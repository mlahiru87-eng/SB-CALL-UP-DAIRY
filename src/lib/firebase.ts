import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from "../../firebase-applet-config.json";

let app;
let auth: any = null;
let db: any = null;
let storage: any = null;
let isFirebaseEnabled = false;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  isFirebaseEnabled = true;
} catch (error) {
  console.error("Firebase failed to initialize cleanly:", error);
  isFirebaseEnabled = false;
}

export { auth, db, storage, isFirebaseEnabled };

