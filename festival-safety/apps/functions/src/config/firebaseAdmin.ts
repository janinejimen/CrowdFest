import * as admin from "firebase-admin";

let initialized = false;

function init() {
  if (!initialized) {
    admin.initializeApp();
    initialized = true;
  }
  return admin;
}

export const db = () => init().firestore();
export const auth = () => init().auth();
