import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, serverTimestamp } from "firebase/firestore"; // Import Firestore
import { getStorage } from 'firebase/storage'; // Import Firebase Storage

const firebaseConfig = {
  apiKey: "AIzaSyB6ZVQHNuNDGpqkeIIgH0RiD67DofjZ-vw",
  authDomain: "cpe-wiki.firebaseapp.com",
  projectId: "cpe-wiki",
  storageBucket: "gs://cpe-wiki.firebasestorage.app",
  messagingSenderId: "976234079924",
  appId: "1:976234079924:web:ddf307f113dd300a10320c"
};

export const app = initializeApp(firebaseConfig); // Adicionado export aqui
export const auth = getAuth(app);
export const db = getFirestore(app); // Initialize and export Firestore
export const storage = getStorage(app); // Initialize and export Firebase Storage
export { serverTimestamp };
