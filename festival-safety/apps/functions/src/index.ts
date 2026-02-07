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

// Create Firestore user doc on signup
export const createUserProfile = functions.auth.user().onCreate(async (user) => {
  await db().collection("users").doc(user.uid).set({
    role: "attendee",
    email: user.email ?? null,
    createdAt: new Date(),
  });
});
