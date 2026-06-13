import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDW9GrXXyYc4vBDnyDjRPOuBRj31b3X-rE",
  authDomain: "whereiscatalina.firebaseapp.com",
  projectId: "whereiscatalina",
  storageBucket: "whereiscatalina.firebasestorage.app",
  messagingSenderId: "994911762048",
  appId: "1:994911762048:web:cfd784d806c93270781865"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
