import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDRjDhuD_k1I6ENek5FJF6OUQlPSpsj6uM",
  authDomain: "teamstockpro-dd149.firebaseapp.com",
  projectId: "teamstockpro-dd149",
  storageBucket: "teamstockpro-dd149.firebasestorage.app",
  messagingSenderId: "923670172425",
  appId: "1:923670172425:web:9742b09b72467d13eaf9d8r",
};

// ✅ Prevent re-initializing app
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

// ✅ SAFE auth initialization (this is the key)
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}

const db = getFirestore(app);

export { auth, db };