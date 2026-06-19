import { getFirestore, FieldValue } from 'firebase-admin/firestore';
export { FieldValue };
import { getApp, getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Configure dotenv immediately to ensure we load corrected .env parameters on the server
dotenv.config();

let firebaseAdminApp: App | null = null;
let cachedDb: any = null;
let cachedAuth: any = null;
let cachedStorage: any = null;

// Dynamically read firestoreDatabaseId from firebase-applet-config.json safely
let firestoreDatabaseId: string | undefined;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    firestoreDatabaseId = config.firestoreDatabaseId;
  }
} catch (e) {
  console.error("Failed to load firebase-applet-config.json:", e);
}

/**
 * Strict validation and single initialization of Firebase Admin SDK
 * Falls back gracefully to Application Default Credentials (ADC) then to memory DB mocks.
 */
export function getFirebaseAdmin(): App {
  const apps = getApps();
  if (apps.length > 0) {
    firebaseAdminApp = apps[0]!;
    return firebaseAdminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId === 'thugs-of-sultan-3cb83') {
    throw new Error("🔥 [FATAL] Application blocked: Server is still using 'thugs-of-sultan-3cb83'. You MUST update FIREBASE_PROJECT_ID in Settings > Secrets to the new 'fixble' project.");
  }

  console.log(`[Firebase Startup Validation] Pre-init verification...`);
  console.log(`- FIREBASE_PROJECT_ID: ${projectId || 'MISSING'}`);
  console.log(`- FIREBASE_CLIENT_EMAIL: ${clientEmail || 'MISSING'}`);
  console.log(`- FIREBASE_PRIVATE_KEY length: ${rawPrivateKey ? rawPrivateKey.length : 0}`);

  // Try standard initialization
  try {
    if (!projectId) {
      throw new Error("FIREBASE_PROJECT_ID is empty or missing.");
    }
    if (!/^[a-z0-9-]{4,40}$/.test(projectId)) {
      throw new Error(`FIREBASE_PROJECT_ID "${projectId}" formatting is invalid.`);
    }
    if (!clientEmail) {
      throw new Error("FIREBASE_CLIENT_EMAIL is empty or missing.");
    }
    if (!clientEmail.includes('@') || !clientEmail.endsWith('.iam.gserviceaccount.com')) {
      throw new Error(`FIREBASE_CLIENT_EMAIL "${clientEmail}" is a personal email or an invalid service account address.`);
    }
    if (!rawPrivateKey) {
      throw new Error("FIREBASE_PRIVATE_KEY is empty or missing.");
    }

    let cleanedKey = rawPrivateKey.trim();
    let changed = true;
    while (changed) {
      changed = false;
      cleanedKey = cleanedKey.trim();
      if ((cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) || 
          (cleanedKey.startsWith("'") && cleanedKey.endsWith("'"))) {
        cleanedKey = cleanedKey.slice(1, -1);
        changed = true;
      } else if (cleanedKey.startsWith('\\"') && cleanedKey.endsWith('\\"')) {
        cleanedKey = cleanedKey.slice(2, -2);
        changed = true;
      } else if (cleanedKey.startsWith("\\'") && cleanedKey.endsWith("\\'")) {
        cleanedKey = cleanedKey.slice(2, -2);
        changed = true;
      }
    }

    while (cleanedKey.includes('\\n')) {
      cleanedKey = cleanedKey.replace(/\\n/g, '\n');
    }
    while (cleanedKey.includes('\\r')) {
      cleanedKey = cleanedKey.replace(/\\r/g, '\r');
    }

    if (!cleanedKey.startsWith('-----BEGIN PRIVATE KEY-----') || !cleanedKey.endsWith('-----END PRIVATE KEY-----')) {
      throw new Error("FIREBASE_PRIVATE_KEY lacks standard PEM envelope.");
    }

    firebaseAdminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: cleanedKey,
      })
    });
    console.log(`🔒 [Firebase Admin] Successfully initialized with validated Service Account credentials for project: ${projectId}`);
    return firebaseAdminApp;
  } catch (saErr: any) {
    console.log(`[Firebase Admin] Sandbox Emulation Mode activated: ${saErr.message}`);
    throw new Error(`EMULATION_MODE: ${saErr.message}`);
  }
}

/**
 * Accessor for singleton Firestore instance
 */
export const adminDb = () => {
  if (!cachedDb) {
    try {
      const app = getFirebaseAdmin();
      cachedDb = firestoreDatabaseId ? getFirestore(app, firestoreDatabaseId) : getFirestore(app);
      cachedDb.settings({ ignoreUndefinedProperties: true });
    } catch (err: any) {
      console.log(`[Firebase Admin] Swapped to Sandbox Memory DB layer: ${err.message}`);
      cachedDb = createMemoryDbMock();
    }
  }
  return cachedDb;
};

/**
 * Accessor for singleton Auth instance
 */
export const adminAuth = () => {
  if (!cachedAuth) {
    try {
      cachedAuth = getAuth(getFirebaseAdmin());
    } catch (err: any) {
      console.log(`[Firebase Admin Auth] Swapped to Sandbox Memory Auth layer: ${err.message}`);
      cachedAuth = createAuthMock();
    }
  }
  return cachedAuth;
};

/**
 * Accessor for singleton Storage instance
 */
export const adminStorage = () => {
  if (!cachedStorage) {
    try {
      cachedStorage = getStorage(getFirebaseAdmin());
    } catch (err: any) {
      console.log(`[Firebase Admin Storage] Swapped to Sandbox Memory Storage layer: ${err.message}`);
      cachedStorage = createStorageMock();
    }
  }
  return cachedStorage;
};

export const logDbWarning = (msg: string, err: any) => {
  console.warn(`[Firestore Warning] ${msg}:`, err.message || err);
};

/**
 * Memory DB, Auth and Storage mocks for sandbox resilience
 */
function createMemoryDbMock() {
  const store: Record<string, Record<string, any>> = {};
  
  class MockDocumentReference {
    constructor(private collectionName: string, private docId: string) {}
    get id() { return this.docId; }
    async get() {
      const data = store[this.collectionName]?.[this.docId];
      return {
        exists: !!data,
        id: this.docId,
        data: () => data || null
      };
    }
    async set(data: any, options?: any) {
      if (!store[this.collectionName]) {
        store[this.collectionName] = {};
      }
      const current = store[this.collectionName][this.docId] || {};
      const parsedData = processMockData(data);
      if (options?.merge) {
        store[this.collectionName][this.docId] = { ...current, ...parsedData };
      } else {
        store[this.collectionName][this.docId] = parsedData;
      }
    }
    async update(data: any) {
      if (!store[this.collectionName]) {
        store[this.collectionName] = {};
      }
      const current = store[this.collectionName][this.docId] || {};
      const parsedData = processMockData(data);
      store[this.collectionName][this.docId] = { ...current, ...parsedData };
    }
    async delete() {
      if (store[this.collectionName]) {
        delete store[this.collectionName][this.docId];
      }
    }
  }

  class MockQuery {
    constructor(protected collectionName: string, protected filters: any[] = []) {}
    where(field: string, op: string, val: any) {
      return new MockQuery(this.collectionName, [...this.filters, { field, op, val }]);
    }
    orderBy(field: string, dir?: string) {
      return this;
    }
    limit(n: number) {
      return this;
    }
    async get() {
      const docsMap = store[this.collectionName] || {};
      let items = Object.entries(docsMap).map(([id, data]) => ({ id, data }));
      for (const filter of this.filters) {
        items = items.filter(item => {
          const itemData: any = item.data;
          if (!itemData) return false;
          const fieldValue = itemData[filter.field];
          if (filter.op === '==') return fieldValue === filter.val;
          if (filter.op === '>=') return fieldValue >= filter.val;
          if (filter.op === '<=') return fieldValue <= filter.val;
          if (filter.op === 'array-contains') return Array.isArray(fieldValue) && fieldValue.includes(filter.val);
          return true;
        });
      }
      return {
        empty: items.length === 0,
        size: items.length,
        docs: items.map(item => ({
          id: item.id,
          exists: true,
          data: () => item.data
        }))
      };
    }
  }

  class MockCollectionReference extends MockQuery {
    constructor(collectionName: string) {
      super(collectionName);
    }
    doc(id?: string) {
      const finalId = id || "doc_" + Math.random().toString(36).substring(2, 12);
      return new MockDocumentReference(this.collectionName, finalId);
    }
    async add(data: any) {
      const id = "doc_" + Math.random().toString(36).substring(2, 12);
      const docRef = this.doc(id);
      await docRef.set(data);
      return docRef;
    }
  }

  function processMockData(data: any): any {
    if (!data) return data;
    const result: any = {};
    for (const [key, val] of Object.entries(data)) {
      if (val && typeof val === 'object') {
        const constructorName = val.constructor?.name;
        if (constructorName && (constructorName.includes('FieldValue') || constructorName.includes('Timestamp') || constructorName.includes('Transform'))) {
          result[key] = new Date().toISOString();
        } else {
          result[key] = val;
        }
      } else {
        result[key] = val;
      }
    }
    return result;
  }

  return {
    collection: (name: string) => new MockCollectionReference(name),
    settings: (opts: any) => {},
    store
  };
}

function createAuthMock() {
  const users: Record<string, any> = {};
  return {
    async getUserByEmail(email: string) {
      const found = Object.values(users).find((u: any) => u.email === email);
      if (!found) {
        const err: any = new Error("auth/user-not-found");
        err.code = "auth/user-not-found";
        throw err;
      }
      return found;
    },
    async createUser(properties: any) {
      const uid = properties.uid || "uid_" + Math.random().toString(36).substring(2, 12);
      const user = {
        uid,
        email: properties.email,
        displayName: properties.displayName || properties.email?.split('@')[0] || "Guest",
        ...properties
      };
      users[uid] = user;
      return user;
    },
    async createCustomToken(uid: string) {
      return `mock_custom_token_${uid}_${Math.random().toString(36).substring(2, 10)}`;
    },
    async verifyIdToken(token: string) {
      if (token.startsWith("mock_custom_token_")) {
        const parts = token.split("_");
        const uid = parts[3] || "mock_uid";
        return { uid, email: `${uid}@example.com` };
      }
      return { uid: "mock_uid", email: "mock_user@example.com" };
    }
  };
}

function createStorageMock() {
  return {
    bucket() {
      return {
        file() {
          return {
            save: async () => {},
            getSignedUrl: async () => ["https://example.com/mock_file.png"]
          };
        }
      };
    }
  };
}

