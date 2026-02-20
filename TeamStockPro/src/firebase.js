import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDRjDhuD_k1I6ENek5FJF6OUQlPSpsj6uM",
  authDomain: "teamstockpro-dd149.firebaseapp.com",
  projectId: "teamstockpro-dd149",
  storageBucket: "teamstockpro-dd149.firebasestorage.app",
  messagingSenderId: "923670172425",
  appId: "1:923670172425:web:9742b09b72467d13eaf9d8",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);