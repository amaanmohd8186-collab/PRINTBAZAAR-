/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged as fbOnAuthStateChanged,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as fbCreateUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  getFirestore, 
  collection as fbCollection, 
  doc as fbDoc, 
  setDoc as fbSetDoc, 
  updateDoc as fbUpdateDoc, 
  deleteDoc as fbDeleteDoc, 
  addDoc as fbAddDoc,
  getDoc as fbGetDoc,
  getDocs as fbGetDocs,
  onSnapshot as fbOnSnapshot,
  query as fbQuery,
  where as fbWhere,
  orderBy as fbOrderBy,
  limit as fbLimit,
  runTransaction as fbRunTransaction,
  writeBatch as fbWriteBatch,
  increment as fbIncrement,
  arrayUnion as fbArrayUnion,
  arrayRemove as fbArrayRemove,
  serverTimestamp as fbServerTimestamp,
  Timestamp as fbTimestamp
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken as fbGetToken, isSupported as fbIsSupported } from 'firebase/messaging';
import config from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(config);

export const auth = getAuth(app);
export const db = getFirestore(app, config.firestoreDatabaseId);
export const storage = getStorage(app);
let messagingInstance: any = null;
const initMessaging = async () => {
  if (await fbIsSupported()) {
    messagingInstance = getMessaging(app);
  }
};
initMessaging();

export const getMessagingService = () => messagingInstance;
export const getToken = fbGetToken;
export const isSupported = fbIsSupported;
const googleProvider = new GoogleAuthProvider();

// Auth Helpers
export const onAuthStateChanged = (authInstance: any, cb: (user: any) => void) => {
  return fbOnAuthStateChanged(auth, cb);
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

export const signInWithEmailAndPassword = (authInstance: any, email: string, pass: string) => {
  return fbSignInWithEmailAndPassword(auth, email, pass);
};

export const createUserWithEmailAndPassword = (authInstance: any, email: string, pass: string) => {
  return fbCreateUserWithEmailAndPassword(auth, email, pass);
};

export const signOut = (authInstance: any) => {
  return fbSignOut(auth);
};

export const updateProfile = (user: any, profile: { displayName?: string, photoURL?: string }) => {
  return fbUpdateProfile(user, profile);
};

// Firestore Helpers (Exporting standard aliases for easier integration)
export const collection = fbCollection;
export const doc = fbDoc;
export const setDoc = fbSetDoc;
export const updateDoc = fbUpdateDoc;
export const deleteDoc = fbDeleteDoc;
export const addDoc = fbAddDoc;
export const getDoc = fbGetDoc;
export const getDocs = fbGetDocs;
export const onSnapshot = fbOnSnapshot;
export const query = fbQuery;
export const where = fbWhere;
export const orderBy = fbOrderBy;
export const limit = fbLimit;
export const runTransaction = fbRunTransaction;
export const writeBatch = fbWriteBatch;
export const increment = fbIncrement;
export const arrayUnion = fbArrayUnion;
export const arrayRemove = fbArrayRemove;
export const serverTimestamp = fbServerTimestamp;
export const Timestamp = fbTimestamp;

// Utilities
export async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

export async function safeFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const config = {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {})
    }
  };

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      return { 
        success: false, 
        error: `Server error (${response.status}). Non-JSON response received.`
      } as unknown as T;
    }

    const data = await response.json();
    if (!response.ok) {
      return { 
        success: false, 
        error: data.error || data.message || `API Error (${response.status})`,
        status: response.status
      } as unknown as T;
    }
    return data as T;
  } catch (err: any) {
    return { success: false, error: "Network connection issue. Please try again." } as unknown as T;
  }
}
