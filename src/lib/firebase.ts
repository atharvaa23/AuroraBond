import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC2-xWu8tGm6O5qhopfjbCRFtzbyTC5PA8",
  authDomain: "aurorabond.firebaseapp.com",
  projectId: "aurorabond",
  storageBucket: "aurorabond.firebasestorage.app",
  messagingSenderId: "779654592613",
  appId: "1:779654592613:web:e98d71329c0ff7b2eb6e8c",
  measurementId: "G-XZ61NWW2H2",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);