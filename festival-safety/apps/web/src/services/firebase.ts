import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAgnDCVTEAQvTP8bUKXcI3x0VroKhEIkM4",
  authDomain: "wics-hack26.firebaseapp.com",
  projectId: "wics-hack26",
  storageBucket: "wics-hack26.firebasestorage.app",
  messagingSenderId: "500186983246",
  appId: "1:500186983246:web:1d516c3b038dd2200a4c1f",
  measurementId: "G-S6111ENT0H"
};

export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const functions = getFunctions(firebaseApp);