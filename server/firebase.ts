import { getApps, initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import config from '../firebase-applet-config.json';

export function getFirebaseAdmin() {
  const apps = getApps();
  if (apps.length === 0) {
    return initializeApp({
      projectId: config.projectId,
      storageBucket: config.storageBucket
    });
  }
  return getApp();
}

export const adminDb = () => {
  getFirebaseAdmin();
  return getFirestore(config.firestoreDatabaseId);
};

export const adminAuth = () => {
  getFirebaseAdmin();
  return getAuth();
};

export const adminStorage = () => {
  getFirebaseAdmin();
  return getStorage();
};

export { FieldValue, Timestamp };

export function logDbWarning(context: string, err: any) {
  const msg = err?.message || String(err);
  console.log(`[Database Error] ${context}: ${msg}`);
}
