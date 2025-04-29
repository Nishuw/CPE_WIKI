import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore"; // Import Firestore

const firebaseConfig = {
  apiKey: "AIzaSyB6ZVQHNuNDGpqkeIIgH0RiD67DofjZ-vw",
  authDomain: "cpe-wiki.firebaseapp.com",
  projectId: "cpe-wiki",
  storageBucket: "cpe-wiki.appspot.com", // Corrija se necessário
  messagingSenderId: "976234079924", // Corrija se necessário
  appId: "1:976234079924:web:ddf307f113dd300a10320c" // Corrija se necessário
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // Initialize and export Firestore
