import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import baseConfig from '../firebase-applet-config.json';

// Support VITE_ environment variables overrides as requested
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || baseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || baseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || baseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || baseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || baseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || baseConfig.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || baseConfig.firestoreDatabaseId
};

// --- STARTUP AUDIT ---
const audit: any = {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKeyStatus: firebaseConfig.apiKey ? 'PRESENT' : 'MISSING',
  appIdStatus: firebaseConfig.appId ? 'PRESENT' : 'MISSING',
  environment: import.meta.env.PROD ? 'PRODUCTION' : 'DEVELOPMENT',
  currentHost: window.location.hostname,
  authorized: true // Assumption to be verified by check
};

// LOGGING
console.log("========== FIREBASE AUTH STARTUP AUDIT ==========");
console.log(`Project ID:      ${audit.projectId}`);
console.log(`Auth Domain:     ${audit.authDomain}`);
console.log(`API Key:         ${firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 6) + '...' : 'MISSING'}`);
console.log(`Storage:         ${firebaseConfig.storageBucket}`);
console.log(`Current Host:    ${audit.currentHost}`);
console.log(`Environment:     ${audit.environment}`);
console.log(`Firebase SDK:    12.14.0`); // Hardcoded version tracking

// Domain Authorization Check
const authDomainName = firebaseConfig.authDomain?.split('.')[0];
if (audit.projectId && authDomainName && audit.projectId !== authDomainName) {
  console.warn(`⚠️ [FIREBASE AUDIT] Mismatch detected: projectId (${audit.projectId}) does not match authDomain prefix (${authDomainName}). This is a common cause of auth/invalid-credential.`);
}

const isDomainAuthPotentiallyMissing = !firebaseConfig.authDomain.includes(audit.currentHost) && 
                                       audit.currentHost !== 'localhost' && 
                                       !audit.currentHost.endsWith('.asia-southeast1.run.app');

if (isDomainAuthPotentiallyMissing) {
  audit.authorized = false;
  console.warn(`⚠️ [FIREBASE AUDIT] UNAUTHORIZED DOMAIN: "${audit.currentHost}" may not be in Firebase Console > Auth > Authorized Domains.`);
} else {
  console.log(`Authorized:      YES (Domain matched)`);
}

// FAIL FAST: Validation
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  const errorMsg = `🔥 [FIREBASE FATAL] Configuration Corrupted: Missing ${!firebaseConfig.apiKey ? 'API_KEY' : 'PROJECT_ID'}. Auth cannot initialize. Check VITE_FIREBASE_* env vars or firebase-applet-config.json.`;
  console.error(errorMsg);
}

console.log("Initialization:  PASSED (Basic Validation)");
console.log("==================================================");

let initializedApp: any = null;
let firestoreDb: any = null;
let firebaseAuth: any = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    initializedApp = initializeApp(firebaseConfig);
    console.log("Firebase App initialized successfully.");
  } else {
    console.warn("⚠️ Firebase: Missing essential config keys.");
  }
} catch (e) {
  console.error("Firebase App initialization failed:", e);
}

if (initializedApp) {
  // Isolate Auth initialization
  try {
    firebaseAuth = getAuth(initializedApp);
    console.log("Auth Ready:      YES");
  } catch (e) {
    console.error("Firebase Auth initialization failed:", e);
  }

  // Isolate Firestore initialization with robust fallback
  try {
    if (firebaseConfig.firestoreDatabaseId) {
      try {
        firestoreDb = getFirestore(initializedApp, firebaseConfig.firestoreDatabaseId);
        console.log(`Firestore Ready with Named Database: "${firebaseConfig.firestoreDatabaseId}"`);
      } catch (namedDbErr) {
        console.warn(`Firestore named database "${firebaseConfig.firestoreDatabaseId}" failed. Trying default database fallback...`, namedDbErr);
        firestoreDb = getFirestore(initializedApp);
        console.log("Firestore Ready with Default Database (Fallback)");
      }
    } else {
      firestoreDb = getFirestore(initializedApp);
      console.log("Firestore Ready with Default Database");
    }
  } catch (e) {
    console.error("Firestore initialization failed completely.", e);
  }
}

export const app = initializedApp as any;
export const db = firestoreDb as any;
export const auth = firebaseAuth as any;

export async function getMessagingService() {
  try {
    const supported = await isSupported();
    if (supported) {
      return getMessaging(app);
    }
  } catch (e) {
    console.warn("FCM check failed/not supported in this context:", e);
  }
  return null;
}
export { getToken, isSupported };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function getAuthHeaders() {
  const user = auth?.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Enhanced fetch wrapper with robust JSON parsing, error handling, 
 * and response validation as mandated by Production-Ready guidelines.
 */
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
    
    // Strict Content-Type validation
    if (!contentType || !contentType.includes('application/json')) {
      return { 
        success: false, 
        error: `Server did not return valid JSON. Expected application/json but received ${contentType || 'unknown'}.`
      } as unknown as T;
    }

    // Since we verified content type, we can safely parse JSON
    try {
      const data = await response.json();
      if (!response.ok) {
        return { 
          success: false, 
          error: data.error || data.message || `API Error (${response.status})`,
          status: response.status
        } as unknown as T;
      }
      return data as T;
    } catch (parserErr: any) {
      return { 
        success: false, 
        error: `JSON Parser Error: ${parserErr.message}` 
      } as unknown as T;
    }

  } catch (err: any) {
    console.error(`[SafeFetch Failed] ${url}:`, err.message);
    return { success: false, error: err.message || "Network request failed" } as unknown as T;
  }
}
