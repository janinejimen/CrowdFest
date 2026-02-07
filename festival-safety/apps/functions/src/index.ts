import * as functions from "firebase-functions";
import { db } from "./config/firebaseAdmin";

// Health check
export const health = functions.https.onRequest((req, res) => {
  res.status(200).json({
    ok: true,
    service: "festival-safety-functions",
    time: new Date().toISOString(),
  });
});

// Create Firestore user doc on signup (DO NOT overwrite role if it was already set)
export const createUserProfile = functions.auth.user().onCreate(async (user) => {
  const userRef = db().collection("users").doc(user.uid);

  await db().runTransaction(async (tx) => {
    const snap = await tx.get(userRef);

    // If doc already exists (e.g., role was set by setAccountType), don't overwrite it.
    if (snap.exists) {
      return;
    }

    tx.set(userRef, {
      role: "attendee",
      email: user.email ?? null,
      createdAt: new Date(),
    });
  });
});


// 0) Set account type after signup (callable)
// User picks attendee/organizer. For demo, organizer can be allowlisted.
export const setAccountType = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login required.");
  }

  const { accountType } = data ?? {};
  if (accountType !== "attendee" && accountType !== "organizer") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "accountType must be attendee or organizer."
    );
  }

  const uid = context.auth.uid;
  const email = (context.auth.token.email as string | undefined) ?? null;

  // ---- DEMO GATE: organizer allowlist (edit to your needs) ----
  // If you want to allow ANYONE to pick organizer for the demo, set REQUIRE_ALLOWLIST = false.
  const REQUIRE_ALLOWLIST = false;

  const ORGANIZER_ALLOWLIST = new Set<string>([
    "organizer@demo.com",
    // add your real organizer emails here:
  ]);

  if (accountType === "organizer" && REQUIRE_ALLOWLIST) {
    if (!email || !ORGANIZER_ALLOWLIST.has(email.toLowerCase())) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Organizer accounts require approval."
      );
    }
  }
  // ------------------------------------------------------------

  await db().collection("users").doc(uid).set(
    {
      role: accountType, // global account type for dashboard + permissions
      email,
      updatedAt: new Date(),
    },
    { merge: true }
  );

  return { ok: true, role: accountType };
});

function makeCode() {
  // simple readable code: XXXX-XXXX
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no O/0/I/1
  const pick = () => chars[Math.floor(Math.random() * chars.length)];
  return `${pick()}${pick()}${pick()}${pick()}-${pick()}${pick()}${pick()}${pick()}`;
}

// 1) Create an event (callable)
export const createEvent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login required.");
  }

  const uid = context.auth.uid;

  // Gate: only organizer accounts can create events
  const userSnap = await db().collection("users").doc(uid).get();
  const userRole = userSnap.data()?.role;

  if (userRole !== "organizer") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Organizer account required to create events."
    );
  }

  const { name, startsAt, endsAt } = data ?? {};
  if (typeof name !== "string" || name.trim().length < 2) {
    throw new functions.https.HttpsError("invalid-argument", "Event name required.");
  }

  const eventRef = db().collection("events").doc();
  const now = new Date();

  await eventRef.set({
    name: name.trim(),
    startsAt: startsAt ?? null,
    endsAt: endsAt ?? null,
    createdBy: uid,
    createdAt: now,
  });

  // creator becomes organizer for this event
  await eventRef.collection("members").doc(uid).set({
    role: "organizer",
    joinedAt: now,
  });

  return { eventId: eventRef.id };
});

// 2) Create an invite code for an event (callable)
export const createInvite = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login required.");
  }

  const { eventId, role, maxUses } = data ?? {};
  if (typeof eventId !== "string" || eventId.length < 3) {
    throw new functions.https.HttpsError("invalid-argument", "eventId required.");
  }
  if (role !== "attendee" && role !== "organizer") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "role must be attendee or organizer."
    );
  }

  const uid = context.auth.uid;

  // Ensure caller is an organizer for this event
  const memberSnap = await db()
    .collection("events")
    .doc(eventId)
    .collection("members")
    .doc(uid)
    .get();

  if (!memberSnap.exists || memberSnap.data()?.role !== "organizer") {
    throw new functions.https.HttpsError("permission-denied", "Organizer access required.");
  }

  // generate unique code (retry a few times)
  let code = "";
  for (let i = 0; i < 10; i++) {
    const candidate = makeCode();
    const existing = await db().collection("inviteCodes").doc(candidate).get();
    if (!existing.exists) {
      code = candidate;
      break;
    }
  }
  if (!code) {
    throw new functions.https.HttpsError("internal", "Failed to generate unique code.");
  }

  const inviteRef = db().collection("events").doc(eventId).collection("invites").doc();
  const now = new Date();

  await inviteRef.set({
    code,
    role,
    active: true,
    uses: 0,
    maxUses: typeof maxUses === "number" ? maxUses : null,
    createdAt: now,
    createdBy: uid,
  });

  // lookup index by code
  await db().collection("inviteCodes").doc(code).set({
    eventId,
    inviteId: inviteRef.id,
    role,
    active: true,
    createdAt: now,
  });

  return { code, inviteId: inviteRef.id };
});

// 3) Join event using invite code (callable)
export const joinWithCode = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login required.");
  }

  const { code } = data ?? {};
  if (typeof code !== "string" || code.trim().length < 4) {
    throw new functions.https.HttpsError("invalid-argument", "code required.");
  }

  const uid = context.auth.uid;
  const normalized = code.trim().toUpperCase();

  // lookup
  const codeSnap = await db().collection("inviteCodes").doc(normalized).get();
  if (!codeSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Invalid code.");
  }

  const { eventId, inviteId, role, active } = codeSnap.data() as any;
  if (!active) {
    throw new functions.https.HttpsError("failed-precondition", "Invite is inactive.");
  }

  const inviteRef = db().collection("events").doc(eventId).collection("invites").doc(inviteId);
  const memberRef = db().collection("events").doc(eventId).collection("members").doc(uid);

  await db().runTransaction(async (tx) => {
    const invite = await tx.get(inviteRef);
    if (!invite.exists) throw new functions.https.HttpsError("not-found", "Invite missing.");

    const inv = invite.data() as any;
    if (!inv.active) throw new functions.https.HttpsError("failed-precondition", "Invite is inactive.");

    const currentUses = inv.uses ?? 0;
    const max = inv.maxUses ?? null;

    if (typeof max === "number" && currentUses >= max) {
      throw new functions.https.HttpsError("failed-precondition", "Invite has reached max uses.");
    }

    // create/overwrite membership
    tx.set(memberRef, { role, joinedAt: new Date() }, { merge: true });
    tx.update(inviteRef, { uses: currentUses + 1 });
  });

  return { eventId, role };
});
