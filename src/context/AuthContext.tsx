'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export const ADMIN_EMAIL = 'shashankpawar0113@gmail.com';
export const ADMIN_PASSWORD = '011300';

export interface UserData {
  uid: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  role?: 'admin' | 'customer';
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  isAdmin: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup';
  openAuthModal: (mode?: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
  signUp: (email: string, pass: string, name: string, phone: string) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  const isAdmin =
    currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
    userData?.role === 'admin';

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Check saved admin session on mount
  useEffect(() => {
    try {
      const savedAdmin = localStorage.getItem('malik_admin_session_v1');
      if (savedAdmin === 'true') {
        setCurrentUser({
          uid: 'admin_master_0113',
          email: ADMIN_EMAIL,
          displayName: 'Malik Admin',
        } as User);
        setUserData({
          uid: 'admin_master_0113',
          name: 'Malik Admin',
          email: ADMIN_EMAIL,
          phone: '+91 70785 23738',
          createdAt: new Date().toISOString(),
          role: 'admin',
        });
      }
    } catch (e) {}

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserData);
          } else {
            const isUserAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
            const defaultUserData: UserData = {
              uid: user.uid,
              name: isUserAdmin ? 'Malik Admin' : (user.displayName || 'Valued Customer'),
              email: user.email || '',
              phone: '',
              createdAt: new Date().toISOString(),
              role: isUserAdmin ? 'admin' : 'customer',
            };
            setUserData(defaultUserData);
            try {
              await setDoc(userDocRef, defaultUserData, { merge: true });
            } catch (e) {}
          }
        } catch (e) {
          console.error('Error fetching user profile from Firestore:', e);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, pass: string, name: string, phone: string) => {
    const userCred = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCred.user;

    await updateProfile(user, { displayName: name });

    const isUserAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const newUserData: UserData = {
      uid: user.uid,
      name,
      email,
      phone,
      createdAt: new Date().toISOString(),
      role: isUserAdmin ? 'admin' : 'customer',
    };

    try {
      await setDoc(doc(db, 'users', user.uid), newUserData);
    } catch (err) {
      console.error('Failed to create user document in Firestore:', err);
    }

    setUserData(newUserData);
    closeAuthModal();
  };

  const signIn = async (email: string, pass: string) => {
    const cleanEmail = email.trim();
    const isTargetingAdmin = cleanEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    // ADMIN DIRECT ACCESSIBLE AUTHENTICATION OVERRIDE
    if (isTargetingAdmin) {
      if (pass !== ADMIN_PASSWORD) {
        throw new Error('Invalid Admin Password. Access Denied.');
      }

      const adminProfile: UserData = {
        uid: 'admin_master_0113',
        name: 'Malik Admin',
        email: ADMIN_EMAIL,
        phone: '+91 70785 23738',
        createdAt: new Date().toISOString(),
        role: 'admin',
      };

      try {
        // Try signing in with Firebase Auth first
        const userCred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
        setCurrentUser(userCred.user);
      } catch (err1) {
        try {
          // Account doesn't exist yet — create it
          const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          setCurrentUser(userCred.user);
          await setDoc(doc(db, 'users', userCred.user.uid), adminProfile);
        } catch (err2: any) {
          // Account exists but password doesn't match the admin password constant.
          // This means the Firebase Auth password was changed. Throw a clear error.
          if (err2.code === 'auth/email-already-in-use') {
            throw new Error(
              'Admin account exists in Firebase but the password does not match. Please use the "Forgot Password" option to reset it, then update ADMIN_PASSWORD in the code.'
            );
          }
          throw new Error('Failed to authenticate admin account. ' + (err2.message || ''));
        }
      }

      setUserData(adminProfile);
      try {
        localStorage.setItem('malik_admin_session_v1', 'true');
      } catch (e) {}
      closeAuthModal();
      return;
    }

    // Standard Customer Sign In Flow
    try {
      await signInWithEmailAndPassword(auth, cleanEmail, pass);
    } catch (err: any) {
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        throw new Error(
          `No account found for ${cleanEmail}, or the password is incorrect. Please create a new account using the "Create Account" tab.`
        );
      }
      throw err;
    }
    closeAuthModal();
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Try to create user doc in Firestore (non-blocking if rules reject it)
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          const newUserData: UserData = {
            uid: user.uid,
            name: user.displayName || 'Google User',
            email: user.email || '',
            phone: user.phoneNumber || '',
            createdAt: new Date().toISOString(),
            role: user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'customer',
          };
          await setDoc(userDocRef, newUserData);
          setUserData(newUserData);
        }
      } catch (firestoreErr) {
        // Firestore write failed (likely security rules) — still allow sign-in
        // onAuthStateChanged handler will also try to set user data
        console.warn('Firestore user doc creation skipped (permissions):', firestoreErr);
        setUserData({
          uid: user.uid,
          name: user.displayName || 'Google User',
          email: user.email || '',
          phone: user.phoneNumber || '',
          createdAt: new Date().toISOString(),
          role: user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'customer',
        });
      }

      closeAuthModal();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') return;
      throw new Error(err.message || 'Google Sign-In failed.');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (e: any) {
      console.error(e);
      throw new Error(e.message || 'Failed to send password reset email.');
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    try {
      localStorage.removeItem('malik_admin_session_v1');
    } catch (e) {}
    setCurrentUser(null);
    setUserData(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userData,
        loading,
        isAdmin,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signUp,
        signInWithGoogle,
        signIn,
        resetPassword,
        logOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
