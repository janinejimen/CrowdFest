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

export const getEmergencyProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login required.");
  }

  const organizerUid = context.auth.uid;
  const { eventId, attendeeUid, reason } = data ?? {};

  if (typeof eventId !== "string" || eventId.length < 3) {
    throw new functions.https.HttpsError("invalid-argument", "eventId required.");
  }
  if (typeof attendeeUid !== "string" || attendeeUid.length < 3) {
    throw new functions.https.HttpsError("invalid-argument", "attendeeUid required.");
  }

  const logRef = db().collection("emergencyAccessLogs").doc();
  const now = new Date();

  // Helper: write log
  const writeLog = async (success: boolean) => {
    await logRef.set({
      organizerUid,
      attendeeUid,
      eventId,
      reason: typeof reason === "string" ? reason.slice(0, 200) : null,
      success,
      createdAt: now,
    });
  };

  // 1) Verify organizer is organizer for this event
  const organizerMemberSnap = await db()
    .collection("events").doc(eventId)
    .collection("members").doc(organizerUid)
    .get();

  if (!organizerMemberSnap.exists || organizerMemberSnap.data()?.role !== "organizer") {
    await writeLog(false);
    throw new functions.https.HttpsError("permission-denied", "Organizer access required.");
  }

  // 2) Verify attendee is part of event (optional but nice)
  const attendeeMemberSnap = await db()
    .collection("events").doc(eventId)
    .collection("members").doc(attendeeUid)
    .get();

  if (!attendeeMemberSnap.exists) {
    await writeLog(false);
    throw new functions.https.HttpsError("not-found", "Attendee is not in this event.");
  }

  // 3) Fetch profile and enforce consent
  const profileSnap = await db().collection("profiles").doc(attendeeUid).get();
  if (!profileSnap.exists) {
    await writeLog(false);
    throw new functions.https.HttpsError("not-found", "Profile not found.");
  }

  const p = profileSnap.data() as any;
  if (p.consentToShareInEmergency !== true) {
    await writeLog(false);
    throw new functions.https.HttpsError("failed-precondition", "User did not consent to share emergency info.");
  }

  await writeLog(true);

  // Return only what emergency view needs
  return {
    displayName: p.displayName ?? null,
    photoURL: p.photoURL ?? null,
    over18: p.over18 ?? null,
    age: p.age ?? null,
    emergencyContact: p.emergencyContact ?? null,
    allergiesConditions: p.allergiesConditions ?? null,
    medications: p.medications ?? null,
    updatedAt: p.updatedAt ?? null,
  };
});


export const upsertProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login required.");
  }

  const uid = context.auth.uid;

  const {
    displayName,
    over18,
    age,
    emergencyContact,
    allergiesConditions,
    medications,
    consentToShareInEmergency,
    photoURL,
  } = data ?? {};

  if (typeof displayName !== "string" || displayName.trim().length < 1) {
    throw new functions.https.HttpsError("invalid-argument", "Name is required.");
  }
  if (consentToShareInEmergency !== true) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Consent is required to complete the profile."
    );
  }

  // Choose one: over18 checkbox is simplest. Allow age optionally.
  const normalizedOver18 =
    typeof over18 === "boolean" ? over18 : null;

  const normalizedAge =
    typeof age === "number" && Number.isFinite(age) && age >= 0 && age <= 120
      ? Math.floor(age)
      : null;

  const normalizedEmergencyContact =
    emergencyContact &&
    typeof emergencyContact === "object" &&
    typeof emergencyContact.name === "string" &&
    typeof emergencyContact.phone === "string"
      ? {
          name: emergencyContact.name.trim(),
          phone: emergencyContact.phone.trim(),
        }
      : null;

  const now = new Date();
  const profileRef = db().collection("profiles").doc(uid);

  // If profile exists, preserve completedAt; otherwise set it.
  await db().runTransaction(async (tx) => {
    const snap = await tx.get(profileRef);
    const existing = snap.exists ? (snap.data() as any) : null;

    tx.set(
      profileRef,
      {
        displayName: displayName.trim(),
        photoURL: typeof photoURL === "string" ? photoURL : (existing?.photoURL ?? null),
        over18: normalizedOver18,
        age: normalizedAge,
        emergencyContact: normalizedEmergencyContact,
        allergiesConditions: typeof allergiesConditions === "string" ? allergiesConditions : null,
        medications: typeof medications === "string" ? medications : null,
        consentToShareInEmergency: true,
        completedAt: existing?.completedAt ?? now,
        updatedAt: now,
      },
      { merge: true }
    );
  });

  return { ok: true };
});

