import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";

// ---------- Firebase init ----------
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

// ---------- Helpers ----------
async function ensureUser(email, password) {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (e) {
    await signInWithEmailAndPassword(auth, email, password);
  }
}

function expect(condition, msg) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
}

async function expectCallableError(fnPromise, expectedCode) {
  try {
    await fnPromise;
    throw new Error(`Expected error ${expectedCode}, but call succeeded.`);
  } catch (e) {
    const code = e?.code || e?.message || "";
    expect(
      String(code).includes(expectedCode),
      `Expected error code containing "${expectedCode}", got "${code}"`
    );
  }
}

async function main() {
  const password = "password123";

  const setAccountType = httpsCallable(functions, "setAccountType");
  const createEvent = httpsCallable(functions, "createEvent");
  const createInvite = httpsCallable(functions, "createInvite");
  const joinWithCode = httpsCallable(functions, "joinWithCode");
  const upsertProfile = httpsCallable(functions, "upsertProfile");
  const getEmergencyProfile = httpsCallable(functions, "getEmergencyProfile");

  // -------------------------------
  // 1) Organizer setup + event create
  // -------------------------------
  const organizerEmail = "organizer@demo.com";
  await ensureUser(organizerEmail, password);
  console.log("Signed in as:", auth.currentUser?.email);

  await setAccountType({ accountType: "organizer" });
  console.log("Set role: organizer");

  const eventRes = await createEvent({ name: "Test Festival", startsAt: null, endsAt: null });
  const eventId = eventRes.data.eventId;
  expect(typeof eventId === "string" && eventId.length > 5, "eventId should be returned");
  console.log("Created eventId:", eventId);

  const inviteRes = await createInvite({ eventId, role: "attendee", maxUses: 5 });
  const code = inviteRes.data.code;
  expect(typeof code === "string" && code.length >= 4, "invite code should be returned");
  console.log("Created invite code:", code);

  // -------------------------------
  // 2) Attendee setup + profile submit (consented)
  // -------------------------------
  const attendeeEmail = "attendee@demo.com";
  await ensureUser(attendeeEmail, password);
  console.log("Signed in as:", auth.currentUser?.email);

  await setAccountType({ accountType: "attendee" });
  console.log("Set role: attendee");

  // Fill out profile (name required + consent required)
  await upsertProfile({
    displayName: "Attendee One",
    over18: true,
    emergencyContact: { name: "Mom", phone: "512-555-1212" },
    allergiesConditions: "Peanuts",
    medications: "EpiPen",
    consentToShareInEmergency: true,
    photoURL: null, // your frontend will set later
  });
  console.log("✅ Profile upserted (consent=true)");

  // Join event
  const joinRes = await joinWithCode({ code });
  expect(joinRes.data?.eventId === eventId, "attendee should join the created event");
  console.log("Join result:", joinRes.data);

  const attendeeUid = auth.currentUser?.uid;
  expect(typeof attendeeUid === "string" && attendeeUid.length > 5, "attendee uid should exist");

  // -------------------------------
  // 3) Organizer emergency view should succeed + return sensitive fields
  // -------------------------------
  await signInWithEmailAndPassword(auth, organizerEmail, password);
  console.log("Signed back in as:", auth.currentUser?.email);

  const emRes = await getEmergencyProfile({
    eventId,
    attendeeUid,
    reason: "demo test",
  });

  const p = emRes.data;
  console.log("Emergency profile:", p);

  expect(p.displayName === "Attendee One", "displayName should match");
  expect(p.emergencyContact?.name === "Mom", "emergency contact name should match");
  expect(p.allergiesConditions === "Peanuts", "allergies should match");
  expect(p.medications === "EpiPen", "medications should match");

  console.log("✅ Emergency view worked (organizer can access with consent)");

  // -------------------------------
  // 3.5) Negative test: attendee cannot access Emergency View (permission-denied)
  // -------------------------------
  await signInWithEmailAndPassword(auth, attendeeEmail, password);
  console.log("Signed back in as:", auth.currentUser?.email);

  await expectCallableError(
    getEmergencyProfile({ eventId, attendeeUid, reason: "should fail" }),
    "permission-denied"
  );
  console.log("✅ Attendee cannot access Emergency View");

  // -------------------------------
  // 4) Negative test: consent=false should block profile completion
  // -------------------------------
  await upsertProfile({
    displayName: "Attendee One",
    over18: true,
    emergencyContact: { name: "Mom", phone: "512-555-1212" },
    allergiesConditions: "Peanuts",
    medications: "EpiPen",
    consentToShareInEmergency: false, // should FAIL because function requires true
    photoURL: null,
  }).then(
    () => {
      throw new Error("Expected upsertProfile to fail when consent=false, but it succeeded.");
    },
    () => console.log("✅ upsertProfile correctly rejected consent=false")
  );

  console.log("✅ All tests passed!");
}

main().catch((e) => {
  console.error("❌ Test failed:", e?.message || e);
  console.error(e);
  process.exit(1);
});
