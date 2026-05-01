import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAYLJ4-Gt-FZ0zU6Xp9Lx-UhrGGhGNTp8s",
  authDomain: "gp-maximus.firebaseapp.com",
  projectId: "gp-maximus",
  storageBucket: "gp-maximus.firebasestorage.app",
  messagingSenderId: "975233569379",
  appId: "1:975233569379:web:0356e1af46d1f0aa1f9e56"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
