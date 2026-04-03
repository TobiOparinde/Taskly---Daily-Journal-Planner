import { initializeApp } from 'firebase/app';
import { initializeAuth, GoogleAuthProvider, browserLocalPersistence, indexedDBLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCRT0D_cw3t_L-tuF1qnwz9sJid-iqR52g",
  authDomain: "taskly-daily-journal-planner.vercel.app",
  projectId: "taskly-c9195",
  storageBucket: "taskly-c9195.firebasestorage.app",
  messagingSenderId: "110892630266",
  appId: "1:110892630266:web:e38c163af0dcefd1b24943",
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
});
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
