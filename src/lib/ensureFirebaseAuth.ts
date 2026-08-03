import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';

/** Ensure a Firebase Auth session exists so Firestore write rules pass. */
export async function ensureFirebaseAuth(): Promise<void> {
  if (auth.currentUser) return;

  try {
    await signInAnonymously(auth);
  } catch (error) {
    console.error('Firebase anonymous sign-in failed:', error);
    throw error;
  }
}
