import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";

const firebaseConfig = {
  apiKey: "demo",
  authDomain: "demo.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "demo-project",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);

connectAuthEmulator(auth, "http://127.0.0.1:9099");
connectFunctionsEmulator(functions, "127.0.0.1", 5001);

async function ensureUser(email, password) {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (e) {
    // if already exists, just sign in
    await signInWithEmailAndPassword(auth, email, password);
  }
}

// NEW: helper to set global account type in users/{uid}.role
async function setRole(accountType) {
  const setAccountType = httpsCallable(functions, "setAccountType");
  const res = await setAccountType({ accountType }); // "attendee" | "organizer"
  return res.data;
}

async function main() {
  const organizerEmail = "organizer@demo.com";
  const password = "password123";

  // --- Organizer path ---
  await ensureUser(organizerEmail, password);
  console.log("Signed in as:", auth.currentUser?.email);

  // NEW: must set organizer role, otherwise createEvent will be denied
  await setRole("organizer");
  console.log("Set role: organizer");

  const createEvent = httpsCallable(functions, "createEvent");
  const createInvite = httpsCallable(functions, "createInvite");
  const joinWithCode = httpsCallable(functions, "joinWithCode");

  // 1) create event (should succeed)
  const eventRes = await createEvent({ name: "Test Festival", startsAt: null, endsAt: null });
  const eventId = eventRes.data.eventId;
  console.log("Created eventId:", eventId);

  // 2) create attendee invite
  const inviteRes = await createInvite({ eventId, role: "attendee", maxUses: 5 });
  const code = inviteRes.data.code;
  console.log("Created invite code:", code);

  // --- Attendee path ---
  await ensureUser("attendee@demo.com", password);
  console.log("Signed in as:", auth.currentUser?.email);

  // Optional (nice for clarity): explicitly set attendee role
  await setRole("attendee");
  console.log("Set role: attendee");

  // 3) join with code
  const joinRes = await joinWithCode({ code });
  console.log("Join result:", joinRes.data);

  console.log("✅ Invite → join flow worked!");
}

main().catch((e) => {
  console.error("❌ Test failed:", e?.message || e);
  console.error(e);
  process.exit(1);
});
