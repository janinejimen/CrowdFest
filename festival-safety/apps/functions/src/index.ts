import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";

// ✅ v1 auth trigger (works even if you use v2 elsewhere)
import { auth as authV1 } from "firebase-functions/v1";

// ✅ use Firestore FieldValue from admin SDK, not firebase-functions
import { FieldValue } from "firebase-admin/firestore";

import { db } from "./config/firebaseAdmin";

// Health check (v2)

import * as tf from "@tensorflow/tfjs-node";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import sharp from "sharp";


import * as tf from "@tensorflow/tfjs-node";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import sharp from "sharp";


<<<<<<< HEAD
// Health check (v2)
=======
// ----------------------------------------------------
// Health check (v2)
// ----------------------------------------------------
>>>>>>> 6a4aa5553558af8b7463bf889c73ee342ea7f2f4
export const health = onRequest((req, res) => {
  res.status(200).json({
    ok: true,
    service: "festival-safety-functions",
    time: new Date().toISOString(),
  });
});

<<<<<<< HEAD
// Create Firestore user doc on signup (v1 auth trigger)
=======
// ----------------------------------------------------
// Create Firestore user doc on signup (v1 auth trigger)
// ----------------------------------------------------
>>>>>>> 6a4aa5553558af8b7463bf889c73ee342ea7f2f4
export const createUserProfile = authV1.user().onCreate(async (user) => {
  const userRef = db().collection("users").doc(user.uid);

  await db().runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (snap.exists) return;

    tx.set(userRef, {
      role: "attendee",
      email: user.email ?? null,
      createdAt: new Date(),
    });
  });
});

<<<<<<< HEAD
=======
// ----------------------------------------------------
// Helpers
// ----------------------------------------------------
>>>>>>> 6a4aa5553558af8b7463bf889c73ee342ea7f2f4
function makeCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const pick = () => chars[Math.floor(Math.random() * chars.length)];
  return `${pick()}${pick()}${pick()}${pick()}-${pick()}${pick()}${pick()}${pick()}`;
}

<<<<<<< HEAD
// 0) Set account type (v2 callable)
=======
// ----------------------------------------------------
// 0) Set account type (v2 callable)
// ----------------------------------------------------
>>>>>>> 6a4aa5553558af8b7463bf889c73ee342ea7f2f4
export const setAccountType = onCall(async (request) => {
  const data = (request.data ?? {}) as any;
  const auth = request.auth;

  if (!auth) throw new HttpsError("unauthenticated", "Login required.");

  const { accountType } = data;
  if (accountType !== "attendee" && accountType !== "organizer") {
    throw new HttpsError("invalid-argument", "accountType must be attendee or organizer.");
  }

  await db().collection("users").doc(auth.uid).set(
    {
      role: accountType,
      email: (auth.token.email as string | undefined) ?? null,
      updatedAt: new Date(),
    },
    { merge: true }
  );

  return { ok: true };
});

// ----------------------------------------------------
// 1) Create event
// ----------------------------------------------------
export const createEvent = onCall(async (request) => {
  const data = (request.data ?? {}) as any;
  const auth = request.auth;

  if (!auth) throw new HttpsError("unauthenticated", "Login required.");

  const userSnap = await db().collection("users").doc(auth.uid).get();
  if (userSnap.data()?.role !== "organizer") {
    throw new HttpsError("permission-denied", "Organizer required.");
  }

  const { name, startsAt, endsAt } = data;
  if (typeof name !== "string" || name.trim().length < 2) {
    throw new HttpsError("invalid-argument", "Event name required.");
  }

  const ref = db().collection("events").doc();
  const now = new Date();

  await ref.set({
    name: name.trim(),
    startsAt: startsAt ?? null,
    endsAt: endsAt ?? null,
    createdBy: auth.uid,
    createdAt: now,
  });

  await ref.collection("members").doc(auth.uid).set({
    role: "organizer",
    joinedAt: now,
  });

  return { eventId: ref.id };
});


// ----------------------------------------------------
// 2) Create invite
// ----------------------------------------------------
export const createInvite = onCall(async (request) => {
  const data = (request.data ?? {}) as any;
  const auth = request.auth;

  if (!auth) throw new HttpsError("unauthenticated", "Login required.");

  const { eventId, role, maxUses } = data;
  if (!eventId || (role !== "attendee" && role !== "organizer")) {
    throw new HttpsError("invalid-argument", "Invalid invite data.");
  }

<<<<<<< HEAD
  const memberSnap = await db()
    .collection("events")
    .doc(eventId)
    .collection("members")
    .doc(auth.uid)
    .get();

=======
  const memberSnap = await db().collection("events").doc(eventId).collection("members").doc(auth.uid).get();
>>>>>>> 6a4aa5553558af8b7463bf889c73ee342ea7f2f4
  if (memberSnap.data()?.role !== "organizer") {
    throw new HttpsError("permission-denied", "Organizer access required.");
  }

  const code = makeCode();
  const inviteRef = db().collection("events").doc(eventId).collection("invites").doc();
  const now = new Date();

  await inviteRef.set({
    code,
    role,
    active: true,
    uses: 0,
    maxUses: typeof maxUses === "number" ? maxUses : null,
    createdAt: now,
    createdBy: auth.uid,
  });

  await db().collection("inviteCodes").doc(code).set({
    eventId,
    inviteId: inviteRef.id,
    role,
    active: true,
    createdAt: now,
  });

  return { code };
});

// 3) Join event
export const joinWithCode = onCall(async (request) => {
  const data = (request.data ?? {}) as any;
  const auth = request.auth;

  if (!auth) throw new HttpsError("unauthenticated", "Login required.");

  const code = typeof data.code === "string" ? data.code.trim().toUpperCase() : "";
  if (!code) throw new HttpsError("invalid-argument", "Code required.");

  const snap = await db().collection("inviteCodes").doc(code).get();
  if (!snap.exists) throw new HttpsError("not-found", "Invalid code.");


  const { eventId, inviteId, role, active } = snap.data() as any;
  if (!active) throw new HttpsError("failed-precondition", "Invite is inactive.");

  await db()
    .collection("events")
    .doc(eventId)
    .collection("members")
    .doc(auth.uid)
    .set({ role, joinedAt: new Date() }, { merge: true });

  // ✅ increment uses using admin FieldValue
  await db()
    .collection("events")
    .doc(eventId)
    .collection("invites")
    .doc(inviteId)
    .update({ uses: FieldValue.increment(1) });
  const inviteData = snap.data() as
    | { eventId: string; inviteId: string; role: "attendee" | "organizer"; active: boolean }
    | undefined;

  if (!inviteData) throw new HttpsError("not-found", "Invalid code.");
  if (!inviteData.active) throw new HttpsError("failed-precondition", "Invite is inactive.");

  const { eventId, inviteId, role } = inviteData;

  await db().collection("events").doc(eventId).collection("members").doc(auth.uid).set(
    { role, joinedAt: new Date() },
    { merge: true }
  );

  await db().collection("events").doc(eventId).collection("invites").doc(inviteId).update({
    uses: FieldValue.increment(1),
  });

  return { eventId, role };
});



// Local COCO-SSD model (cached)
let cocoModel: any = null;

async function getCocoModel() {
  if (!cocoModel) {
    console.log("🔄 Loading COCO-SSD model (first time)...");
    cocoModel = await cocoSsd.load();
    console.log("✅ COCO-SSD model ready");
  }
  return cocoModel;
}
// Other routes
export { createReportFn, claimReportFn, resolveReportFn, postReportMessageFn } from "./reports/reports.routes";
export { createTestEventFn } from "./testing/createTestEvent";
export { setUserRoleTestFn } from "./testing/testAdmin.routes";



// Local COCO-SSD model (cached)
let cocoModel: any = null;

async function getCocoModel() {
  if (!cocoModel) {
    console.log("🔄 Loading COCO-SSD model (first time)...");
    cocoModel = await cocoSsd.load();
    console.log("✅ COCO-SSD model ready");
  }
  return cocoModel;
}

// Other routes
export { createReportFn, claimReportFn, resolveReportFn, postReportMessageFn } from "./reports/reports.routes";
export { createTestEventFn } from "./testing/createTestEvent";
export { setUserRoleTestFn } from "./testing/testAdmin.routes";

// ----------------------------------------------------
// Vision Analysis (Crowd + Flashlight Detection)
// Uses Local TensorFlow + COCO-SSD (NO API CALLS)
// Analyzes JPG frame instantly
// ----------------------------------------------------
export const analyzeVisionFrame = onCall(async (request) => {
  const data = (request.data ?? {}) as any;
  const { imageBase64 } = data;

  if (!imageBase64 || typeof imageBase64 !== "string") {
    throw new HttpsError("invalid-argument", "imageBase64 required");
  }

  try {
    console.log("🔄 Analyzing frame with local COCO-SSD...");
    const startTime = Date.now();

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64, "base64");

    // Resize image for faster processing (416x416)
    const resizedData = await sharp(imageBuffer)
      .resize(416, 416, { fit: "inside", withoutEnlargement: true })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Create tensor from image
    const imageTensor = tf.tensor3d(new Uint8Array(resizedData.data), [
      resizedData.info.height,
      resizedData.info.width,
      resizedData.info.channels,
    ]);

    // Load model and detect
    const model = await getCocoModel();
    const detections = await model.detect(imageTensor);

    // Count only "person" class detections
    const people = detections.filter((d: any) => d.class === "person");
    const crowdCount = people.length;

    console.log(`✅ Found ${crowdCount} people in ${Date.now() - startTime}ms`);

    // FLASHLIGHT DETECTION - check pixel brightness
    const pixelData = new Uint8Array(resizedData.data);
    let brightPixels = 0;
    
    // Check every pixel (RGB = 3 bytes per pixel)
    for (let i = 0; i < pixelData.length; i += 3) {
      const r = pixelData[i];
      const g = pixelData[i + 1];
      const b = pixelData[i + 2];
      
      // Brightness: standard luma formula
      const brightness = r * 0.299 + g * 0.587 + b * 0.114;
      
      // Very bright pixels = flashlight
      if (brightness > 220) {
        brightPixels++;
      }
    }

    const totalPixels = pixelData.length / 3;
    const brightRatio = totalPixels > 0 ? brightPixels / totalPixels : 0;
    const flashlightDetected = brightRatio > 0.005; // >0.5% bright = flashlight
    const flashlightIntensity = Math.min(100, Math.round(brightRatio * 1000));

    console.log(
      `🔦 Flashlight: ${flashlightDetected ? "YES" : "no"} (intensity: ${flashlightIntensity})`
    );

    // Cleanup tensors
    imageTensor.dispose();

    return {
      success: true,
      crowdCount,
      flashlightDetected,
      flashlightIntensity,
      detections: people.map((d: any) => ({
        class: d.class,
        score: d.score,
      })),
      model: "COCO-SSD (Local TensorFlow)",
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("❌ Vision analysis error:", error.message);
    throw new HttpsError("internal", `Analysis failed: ${error.message}`);
  }
});

// Other routes
export { createReportFn, claimReportFn, resolveReportFn, postReportMessageFn } from "./reports/reports.routes";
export { createTestEventFn } from "./testing/createTestEvent";
export { setUserRoleTestFn } from "./testing/testAdmin.routes";

export { createGroup, joinGroupWithCode, regenerateGroupCode } from "./groups/groups.routes";
