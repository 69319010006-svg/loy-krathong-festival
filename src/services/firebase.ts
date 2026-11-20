import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  increment,
  onSnapshot,
  query,
  orderBy,
  Firestore,
} from 'firebase/firestore';
import { ContestantKrathong } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBlSnpt-VDoJvupelAOpe_iDOw_J5e6XQg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "loy-krathong-festival-164fc.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "loy-krathong-festival-164fc",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "loy-krathong-festival-164fc.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "802168706417",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:802168706417:web:c0dc3335f835eff33752d0",
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore
export const db: Firestore = getFirestore(app);

// Firestore Collection Reference
export const KRATHONGS_COLLECTION = 'krathongs';

/**
 * Subscribe to real-time updates from Firestore.
 * Every time any user casts a vote or releases a new krathong,
 * this listener triggers instantly across all connected devices!
 */
export function subscribeToKrathongs(
  onUpdate: (krathongs: ContestantKrathong[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const q = query(collection(db, KRATHONGS_COLLECTION), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ContestantKrathong[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ContestantKrathong);
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('Firestore real-time listener error:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Failed to subscribe to Firestore:', err);
    if (onError && err instanceof Error) onError(err);
    return () => {};
  }
}

/**
 * Save new Krathong document to Firestore with resized image.
 */
export async function saveKrathongToFirestore(
  krathong: ContestantKrathong
): Promise<void> {
  const docRef = doc(db, KRATHONGS_COLLECTION, krathong.id);
  await setDoc(docRef, krathong);
}

/**
 * Atomically increment vote in Firestore.
 */
export async function voteKrathongInFirestore(id: string): Promise<void> {
  const docRef = doc(db, KRATHONGS_COLLECTION, id);
  await updateDoc(docRef, {
    votes: increment(1),
  });
}
