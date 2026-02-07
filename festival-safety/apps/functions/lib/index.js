"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinWithCode = exports.createInvite = exports.createEvent = exports.setAccountType = exports.createUserProfile = exports.health = void 0;
const functions = __importStar(require("firebase-functions"));
const firebaseAdmin_1 = require("./config/firebaseAdmin");
// Health check
exports.health = functions.https.onRequest((req, res) => {
    res.status(200).json({
        ok: true,
        service: "festival-safety-functions",
        time: new Date().toISOString(),
    });
});
// Create Firestore user doc on signup (DO NOT overwrite role if it was already set)
exports.createUserProfile = functions.auth.user().onCreate(async (user) => {
    const userRef = (0, firebaseAdmin_1.db)().collection("users").doc(user.uid);
    await (0, firebaseAdmin_1.db)().runTransaction(async (tx) => {
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
exports.setAccountType = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Login required.");
    }
    const { accountType } = data ?? {};
    if (accountType !== "attendee" && accountType !== "organizer") {
        throw new functions.https.HttpsError("invalid-argument", "accountType must be attendee or organizer.");
    }
    const uid = context.auth.uid;
    const email = context.auth.token.email ?? null;
    // ---- DEMO GATE: organizer allowlist (edit to your needs) ----
    // If you want to allow ANYONE to pick organizer for the demo, set REQUIRE_ALLOWLIST = false.
    const REQUIRE_ALLOWLIST = false;
    const ORGANIZER_ALLOWLIST = new Set([
        "organizer@demo.com",
        // add your real organizer emails here:
    ]);
    if (accountType === "organizer" && REQUIRE_ALLOWLIST) {
        if (!email || !ORGANIZER_ALLOWLIST.has(email.toLowerCase())) {
            throw new functions.https.HttpsError("permission-denied", "Organizer accounts require approval.");
        }
    }
    // ------------------------------------------------------------
    await (0, firebaseAdmin_1.db)().collection("users").doc(uid).set({
        role: accountType, // global account type for dashboard + permissions
        email,
        updatedAt: new Date(),
    }, { merge: true });
    return { ok: true, role: accountType };
});
function makeCode() {
    // simple readable code: XXXX-XXXX
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no O/0/I/1
    const pick = () => chars[Math.floor(Math.random() * chars.length)];
    return `${pick()}${pick()}${pick()}${pick()}-${pick()}${pick()}${pick()}${pick()}`;
}
// 1) Create an event (callable)
exports.createEvent = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Login required.");
    }
    const uid = context.auth.uid;
    // Gate: only organizer accounts can create events
    const userSnap = await (0, firebaseAdmin_1.db)().collection("users").doc(uid).get();
    const userRole = userSnap.data()?.role;
    if (userRole !== "organizer") {
        throw new functions.https.HttpsError("permission-denied", "Organizer account required to create events.");
    }
    const { name, startsAt, endsAt } = data ?? {};
    if (typeof name !== "string" || name.trim().length < 2) {
        throw new functions.https.HttpsError("invalid-argument", "Event name required.");
    }
    const eventRef = (0, firebaseAdmin_1.db)().collection("events").doc();
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
exports.createInvite = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Login required.");
    }
    const { eventId, role, maxUses } = data ?? {};
    if (typeof eventId !== "string" || eventId.length < 3) {
        throw new functions.https.HttpsError("invalid-argument", "eventId required.");
    }
    if (role !== "attendee" && role !== "organizer") {
        throw new functions.https.HttpsError("invalid-argument", "role must be attendee or organizer.");
    }
    const uid = context.auth.uid;
    // Ensure caller is an organizer for this event
    const memberSnap = await (0, firebaseAdmin_1.db)()
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
        const existing = await (0, firebaseAdmin_1.db)().collection("inviteCodes").doc(candidate).get();
        if (!existing.exists) {
            code = candidate;
            break;
        }
    }
    if (!code) {
        throw new functions.https.HttpsError("internal", "Failed to generate unique code.");
    }
    const inviteRef = (0, firebaseAdmin_1.db)().collection("events").doc(eventId).collection("invites").doc();
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
    await (0, firebaseAdmin_1.db)().collection("inviteCodes").doc(code).set({
        eventId,
        inviteId: inviteRef.id,
        role,
        active: true,
        createdAt: now,
    });
    return { code, inviteId: inviteRef.id };
});
// 3) Join event using invite code (callable)
exports.joinWithCode = functions.https.onCall(async (data, context) => {
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
    const codeSnap = await (0, firebaseAdmin_1.db)().collection("inviteCodes").doc(normalized).get();
    if (!codeSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Invalid code.");
    }
    const { eventId, inviteId, role, active } = codeSnap.data();
    if (!active) {
        throw new functions.https.HttpsError("failed-precondition", "Invite is inactive.");
    }
    const inviteRef = (0, firebaseAdmin_1.db)().collection("events").doc(eventId).collection("invites").doc(inviteId);
    const memberRef = (0, firebaseAdmin_1.db)().collection("events").doc(eventId).collection("members").doc(uid);
    await (0, firebaseAdmin_1.db)().runTransaction(async (tx) => {
        const invite = await tx.get(inviteRef);
        if (!invite.exists)
            throw new functions.https.HttpsError("not-found", "Invite missing.");
        const inv = invite.data();
        if (!inv.active)
            throw new functions.https.HttpsError("failed-precondition", "Invite is inactive.");
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
