import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCRT0D_cw3t_L-tuF1qnwz9sJid-iqR52g",
  authDomain: "taskly-c9195.firebaseapp.com",
  projectId: "taskly-c9195",
  storageBucket: "taskly-c9195.firebasestorage.app",
  messagingSenderId: "110892630266",
  appId: "1:110892630266:web:e38c163af0dcefd1b24943",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
