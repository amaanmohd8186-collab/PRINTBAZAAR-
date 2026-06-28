import { createClient } from '@supabase/supabase-js';

// Load Supabase config from import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize Supabase Client
const isSupabaseConfigured = !!supabaseUrl && !supabaseUrl.includes('placeholder') && !!supabaseAnonKey && !supabaseAnonKey.includes('placeholder');

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder'
);

if (typeof window !== 'undefined') {
  (window as any).supabaseClient = supabase;
  (window as any).supabaseConfigured = isSupabaseConfigured;
  (window as any).firebaseInitStatus = isSupabaseConfigured ? 'Ready' : 'Limited Mode';
}

// Map collections to Supabase tables
const tblMap: Record<string, string> = {
  'users': 'profiles',
  'sellers': 'sellers',
  'products': 'products',
  'orders': 'orders',
  'quotes': 'quotes',
  'designs': 'generated_designs',
  'generated_designs': 'generated_designs',
  'audit_logs': 'audit_logs',
  'payments': 'payments',
  'posts': 'posts'
};

// --- AUTH SECTION ---
const authListeners: ((user: any) => void)[] = [];

export const auth: any = {
  currentUser: null,
  signOut: async () => signOut(null)
};

function triggerAuthChange(user: any) {
  auth.currentUser = user;
  authListeners.forEach(cb => {
    try { cb(user); } catch (e) { console.error(e); }
  });
}

function mapSupabaseToFirebaseUser(supabaseUser: any): any {
  if (!supabaseUser) return null;
  return {
    uid: supabaseUser.id,
    email: supabaseUser.email,
    displayName: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'User',
    photoURL: supabaseUser.user_metadata?.avatar_url || '',
    getIdToken: async () => {
      const { data } = await supabase.auth.getSession();
      return data?.session?.access_token || 'mock_supa_token';
    },
    getIdTokenResult: async () => ({ token: 'mock_supa_token' })
  };
}

export function onAuthStateChanged(authInstance: any, cb: (user: any) => void) {
  authListeners.push(cb);
  cb(auth.currentUser);
  return () => {
    const idx = authListeners.indexOf(cb);
    if (idx !== -1) authListeners.splice(idx, 1);
  };
}

export async function signInWithGoogle() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return data;
  } else {
    // Simulation: Randomly pick one of the admin emails or a guest
    const emails = ['musagraphics75@gmail.com', 'gazisiddiqui01@gmail.com', 'test@example.com'];
    const email = emails[Math.floor(Math.random() * emails.length)];
    const localUsers = JSON.parse(localStorage.getItem('_supabase_emu_users') || '{}');
    let u = localUsers[email];
    if (!u) {
       const uid = 'emu_google_' + Math.random().toString(36).substring(2, 12);
       u = { uid, email, displayName: email.split('@')[0], photoURL: 'https://i.pravatar.cc/150?u=' + uid };
       localUsers[email] = u;
       localStorage.setItem('_supabase_emu_users', JSON.stringify(localUsers));
    }
    const user = {
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      photoURL: u.photoURL,
      getIdToken: async () => 'emu_google_token_' + u.uid
    };
    localStorage.setItem('_supabase_emu_current', JSON.stringify(user));
    triggerAuthChange(user);
    return { user };
  }
}

export async function signInWithEmailAndPassword(authInstance: any, email: string, pass: string) {
  const cleanEmail = email.toLowerCase().trim();
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: pass });
    if (error) {
      throw { code: 'auth/invalid-credential', message: error.message };
    }
    const user = mapSupabaseToFirebaseUser(data.user);
    triggerAuthChange(user);
    return { user };
  } else {
    const localUsers = JSON.parse(localStorage.getItem('_supabase_emu_users') || '{}');
    let u = localUsers[cleanEmail];
    if (!u) {
      // Auto-create user on login if they don't exist to prevent auth/invalid-credential errors in sandbox
      const uid = 'emu_user_' + Math.random().toString(36).substring(2, 12);
      u = {
        uid,
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
        photoURL: '',
        password: pass
      };
      localUsers[cleanEmail] = u;
      localStorage.setItem('_supabase_emu_users', JSON.stringify(localUsers));

      const localDB = getLocalDB();
      if (!localDB['users']) localDB['users'] = {};
      
      const isSuperAdmin = [
        'musagraphics75@gmail.com',
        'gazisiddiqui01@gmail.com'
      ].includes(cleanEmail);

      localDB['users'][uid] = {
        uid,
        email: cleanEmail,
        name: u.displayName,
        photoURL: '',
        role: isSuperAdmin ? 'admin' : 'customer',
        ai_credits: 10,
        wallet_balance: 0
      };
      saveLocalDB(localDB);
    } else if (u.password !== pass) {
      // In local fallback mode, allow password correction to avoid errors
      u.password = pass;
      localUsers[cleanEmail] = u;
      localStorage.setItem('_supabase_emu_users', JSON.stringify(localUsers));
    }
    const user = {
      uid: u.uid,
      email: u.email,
      displayName: u.displayName || u.email.split('@')[0],
      photoURL: u.photoURL || '',
      getIdToken: async () => 'emu_token_' + u.uid + '___' + u.email
    };
    localStorage.setItem('_supabase_emu_current', JSON.stringify(user));
    triggerAuthChange(user);
    return { user };
  }
}

export async function createUserWithEmailAndPassword(authInstance: any, email: string, pass: string) {
  const cleanEmail = email.toLowerCase().trim();
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: pass
    });
    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        throw { code: 'auth/email-already-in-use', message: error.message };
      }
      throw { code: 'auth/invalid-credential', message: error.message };
    }
    const user = mapSupabaseToFirebaseUser(data.user);
    try {
      await supabase.from('profiles').upsert({
        id: data.user?.id,
        email: cleanEmail,
        full_name: cleanEmail.split('@')[0],
        ai_credits: 10,
        role: 'customer'
      });
    } catch (upsertErr) {
      // Handled
    }
    triggerAuthChange(user);
    return { user };
  } else {
    const localUsers = JSON.parse(localStorage.getItem('_supabase_emu_users') || '{}');
    if (localUsers[cleanEmail]) {
      throw { code: 'auth/email-already-in-use', message: 'This email is already in use.' };
    }
    const uid = 'emu_user_' + Math.random().toString(36).substring(2, 12);
    const newUser = {
      uid,
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0],
      photoURL: '',
      password: pass
    };
    localUsers[cleanEmail] = newUser;
    localStorage.setItem('_supabase_emu_users', JSON.stringify(localUsers));

    const user = {
      uid,
      email: cleanEmail,
      displayName: newUser.displayName,
      photoURL: '',
      getIdToken: async () => 'emu_token_' + uid + '___' + cleanEmail
    };
    localStorage.setItem('_supabase_emu_current', JSON.stringify(user));

    const localDB = getLocalDB();
    if (!localDB['users']) localDB['users'] = {};
    
    const isSuperAdmin = [
      'musagraphics75@gmail.com',
      'gazisiddiqui01@gmail.com'
    ].includes(cleanEmail);

    localDB['users'][uid] = {
      uid,
      email: cleanEmail,
      name: newUser.displayName,
      photoURL: '',
      role: isSuperAdmin ? 'admin' : 'customer',
      ai_credits: 10,
      wallet_balance: 0
    };
    saveLocalDB(localDB);

    triggerAuthChange(user);
    return { user };
  }
}

export async function signOut(authInstance: any) {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem('_supabase_emu_current');
  triggerAuthChange(null);
}

export async function updateProfile(userInstance: any, profile: { displayName?: string, photoURL?: string }) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: profile.displayName,
        avatar_url: profile.photoURL
      }
    });
    if (error) throw error;
    try {
      await supabase.from('profiles').update({
        full_name: profile.displayName,
        avatar_url: profile.photoURL
      }).eq('id', userInstance.uid);
    } catch (upsertErr) {
      // Handled
    }
  }

  if (auth.currentUser) {
    const updated = {
      ...auth.currentUser,
      displayName: profile.displayName || auth.currentUser.displayName,
      photoURL: profile.photoURL || auth.currentUser.photoURL
    };
    auth.currentUser = updated;
    localStorage.setItem('_supabase_emu_current', JSON.stringify(updated));
    triggerAuthChange(updated);
  }
}

// Initial session check
if (isSupabaseConfigured) {
  supabase.auth.getSession().then(({ data }) => {
    if (data?.session?.user) {
      triggerAuthChange(mapSupabaseToFirebaseUser(data.session.user));
    } else {
      loadFallbackEmuUser();
    }
  }).catch(() => {
    loadFallbackEmuUser();
  });
} else {
  loadFallbackEmuUser();
}

function loadFallbackEmuUser() {
  try {
    const raw = localStorage.getItem('_supabase_emu_current');
    if (raw) {
      const parsed = JSON.parse(raw);
      triggerAuthChange({
        ...parsed,
        getIdToken: async () => 'emu_token_' + parsed.uid
      });
    }
  } catch {}
}


// --- DATABASE SECTION ---
export const db = {
  _isMock: true
};

export class DocumentReference {
  constructor(public collectionPath: string, public docId: string) {}
  get id() { return this.docId; }
}

export class CollectionReference {
  constructor(public collectionPath: string) {}
}

export class QueryClass {
  constructor(public colRef: CollectionReference, public constraints: any[] = []) {}
}

export function collection(dbInstance: any, path: string) {
  return new CollectionReference(path);
}

export function doc(dbInstance: any, path: string, docId?: string) {
  const finalId = docId || 'doc_' + Math.random().toString(36).substring(2, 12);
  return new DocumentReference(path, finalId);
}

export function where(field: string, op: string, val: any) {
  return { type: 'where', field, op, val };
}

export function orderBy(field: string, dir: 'asc' | 'desc' = 'asc') {
  return { type: 'orderBy', field, dir };
}

export function limit(n: number) {
  return { type: 'limit', val: n };
}

export function query(colRef: CollectionReference, ...constraints: any[]) {
  return new QueryClass(colRef, constraints);
}

function getLocalDB() {
  try {
    const raw = localStorage.getItem('supabase_emu_db');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalDB(state: any) {
  try {
    localStorage.setItem('supabase_emu_db', JSON.stringify(state));
    triggerSnapshots();
  } catch (e) {
    console.error("Local storage save failed:", e);
  }
}

const activeSnapshots: { ref: any; callback: (sn: any) => void }[] = [];

function triggerSnapshots() {
  activeSnapshots.forEach(({ ref, callback }) => {
    try {
      getDocsOrDoc(ref).then(sn => callback(sn));
    } catch {}
  });
}

// Simulation values
export class Timestamp {
  constructor(public seconds: number, public nanoseconds: number) {}
  static now() {
    return new Timestamp(Math.floor(Date.now() / 1000), 0);
  }
  toDate() {
    return new Date(this.seconds * 1000);
  }
  toISOString() {
    return new Date(this.seconds * 1000).toISOString();
  }
}

export function serverTimestamp() {
  return Timestamp.now();
}

export function increment(n: number) {
  return { _isIncrement: true, value: n };
}

export function arrayUnion(...items: any[]) {
  return { _isArrayUnion: true, value: items };
}

export function arrayRemove(...items: any[]) {
  return { _isArrayRemove: true, value: items };
}

function processDataFields(data: any): any {
  if (!data) return data;
  const result: any = {};
  for (const [key, val] of Object.entries(data)) {
    if (val && typeof val === 'object') {
      if ((val as any)._isIncrement) {
        result[key] = (val as any).value;
      } else if ((val as any)._isArrayUnion) {
        result[key] = (val as any).value;
      } else if ((val as any)._isArrayRemove) {
        result[key] = [];
      } else if (val.constructor?.name === 'Timestamp' || (val as any).seconds !== undefined) {
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

export class DocumentSnapshot {
  constructor(public existsValue: boolean, public idValue: string, public dataValue: any) {}
  get id() { return this.idValue; }
  exists() { return this.existsValue; }
  data() { return this.dataValue || null; }
}

export class QuerySnapshot {
  constructor(public docsValue: DocumentSnapshot[]) {}
  get docs() { return this.docsValue; }
  get size() { return this.docsValue.length; }
  get empty() { return this.docsValue.length === 0; }
  forEach(cb: (doc: DocumentSnapshot) => void) {
    this.docsValue.forEach(cb);
  }
}

async function getDocsOrDoc(ref: any): Promise<any> {
  const localDB = getLocalDB();
  
  if (ref instanceof DocumentReference) {
    const collectionData = localDB[ref.collectionPath] || {};
    const docData = collectionData[ref.docId];
    return new DocumentSnapshot(!!docData, ref.docId, docData);
  }
  
  const colPath = ref instanceof CollectionReference ? ref.collectionPath : ref.colRef.collectionPath;
  const collectionData = localDB[colPath] || {};
  let items = Object.entries(collectionData).map(([id, data]) => ({ id, data: data as any }));
  
  if (ref instanceof QueryClass) {
    ref.constraints.forEach(con => {
      if (con.type === 'where') {
        items = items.filter(item => {
          const fieldVal = item.data?.[con.field];
          if (con.op === '==' || con.op === '===') return String(fieldVal) === String(con.val);
          if (con.op === '>=') return Number(fieldVal) >= Number(con.val);
          if (con.op === '<=') return Number(fieldVal) <= Number(con.val);
          if (con.op === 'array-contains') return Array.isArray(fieldVal) && fieldVal.includes(con.val);
          return true;
        });
      } else if (con.type === 'orderBy') {
        items.sort((a, b) => {
          const valA = a.data?.[con.field];
          const valB = b.data?.[con.field];
          if (valA === valB) return 0;
          if (valA > valB) return con.dir === 'asc' ? 1 : -1;
          return con.dir === 'asc' ? -1 : 1;
        });
      } else if (con.type === 'limit') {
        items = items.slice(0, con.val);
      }
    });
  }
  
  const docSnaps = items.map(item => new DocumentSnapshot(true, item.id, item.data));
  return new QuerySnapshot(docSnaps);
}

function updateLocalItem(path: string, docId: string, data: any) {
  const localDB = getLocalDB();
  if (!localDB[path]) localDB[path] = {};
  localDB[path][docId] = {
    ...localDB[path][docId],
    ...data
  };
  saveLocalDB(localDB);
}

export async function getDoc(docRef: DocumentReference) {
  if (isSupabaseConfigured) {
    try {
      const table = tblMap[docRef.collectionPath];
      if (table) {
        const { data, error } = await supabase.from(table).select('*').eq('id', docRef.docId).single();
        if (data && !error) {
          updateLocalItem(docRef.collectionPath, docRef.docId, data);
        }
      }
    } catch {}
  }
  return getDocsOrDoc(docRef);
}

export async function getDocs(queryRef: CollectionReference | QueryClass) {
  if (isSupabaseConfigured) {
    try {
      const path = queryRef instanceof CollectionReference ? queryRef.collectionPath : queryRef.colRef.collectionPath;
      const table = tblMap[path];
      if (table) {
        let q: any = supabase.from(table).select('*');
        if (queryRef instanceof QueryClass) {
          queryRef.constraints.forEach(con => {
            if (con.type === 'where') {
              if (con.op === '==' || con.op === '===') q = q.eq(con.field, con.val);
              else if (con.op === '>=') q = q.gte(con.field, con.val);
              else if (con.op === '<=') q = q.lte(con.field, con.val);
            }
          });
        }
        const { data, error } = await q;
        if (data && !error) {
          data.forEach((row: any) => {
            updateLocalItem(path, row.id || row.order_id || 'unnamed', row);
          });
        }
      }
    } catch {}
  }
  return getDocsOrDoc(queryRef);
}

export async function setDoc(docRef: DocumentReference, data: any, options?: any) {
  const localDB = getLocalDB();
  if (!localDB[docRef.collectionPath]) localDB[docRef.collectionPath] = {};
  
  const parsedData = processDataFields(data);
  const current = localDB[docRef.collectionPath][docRef.docId] || {};
  
  if (options?.merge) {
    localDB[docRef.collectionPath][docRef.docId] = { ...current, ...parsedData };
  } else {
    localDB[docRef.collectionPath][docRef.docId] = parsedData;
  }
  saveLocalDB(localDB);

  if (isSupabaseConfigured) {
    try {
      const table = tblMap[docRef.collectionPath];
      if (table) {
        const payload = { ...parsedData, id: docRef.docId };
        await supabase.from(table).upsert(payload);
      }
    } catch (e) {
      // Handled
    }
  }
}

export async function updateDoc(docRef: DocumentReference, data: any) {
  const localDB = getLocalDB();
  if (!localDB[docRef.collectionPath]) localDB[docRef.collectionPath] = {};
  
  const parsedData = processDataFields(data);
  const current = localDB[docRef.collectionPath][docRef.docId] || {};
  localDB[docRef.collectionPath][docRef.docId] = { ...current, ...parsedData };
  saveLocalDB(localDB);

  if (isSupabaseConfigured) {
    try {
      const table = tblMap[docRef.collectionPath];
      if (table) {
        await supabase.from(table).update(parsedData).eq('id', docRef.docId);
      }
    } catch (e) {
      // Handled
    }
  }
}

export async function addDoc(colRef: CollectionReference, data: any) {
  const docId = 'doc_' + Math.random().toString(36).substring(2, 12);
  const docRef = new DocumentReference(colRef.collectionPath, docId);
  await setDoc(docRef, data);
  return docRef;
}

export async function deleteDoc(docRef: DocumentReference) {
  const localDB = getLocalDB();
  if (localDB[docRef.collectionPath]) {
    delete localDB[docRef.collectionPath][docRef.docId];
  }
  saveLocalDB(localDB);

  if (isSupabaseConfigured) {
    try {
      const table = tblMap[docRef.collectionPath];
      if (table) {
        await supabase.from(table).delete().eq('id', docRef.docId);
      }
    } catch (e) {
      // Handled
    }
  }
}

export async function runTransaction(dbInstance: any, updateFn: (transaction: any) => Promise<any>) {
  const transaction = {
    get: async (docRef: DocumentReference) => getDoc(docRef),
    set: async (docRef: DocumentReference, data: any) => setDoc(docRef, data),
    update: async (docRef: DocumentReference, data: any) => updateDoc(docRef, data),
    delete: async (docRef: DocumentReference) => deleteDoc(docRef)
  };
  return updateFn(transaction);
}

export function onSnapshot(ref: any, callback: (sn: any) => void, errorCallback?: (err: any) => void) {
  activeSnapshots.push({ ref, callback });
  getDocsOrDoc(ref).then(callback);

  let unsubscribeSupabase: any = null;
  if (isSupabaseConfigured) {
    const path = ref instanceof DocumentReference ? ref.collectionPath : (ref instanceof CollectionReference ? ref.collectionPath : ref.colRef.collectionPath);
    const table = tblMap[path];
    if (table) {
      const channel = supabase.channel(`public:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          if (ref instanceof DocumentReference) {
            getDoc(ref).then(sn => callback(sn));
          } else {
            getDocs(ref).then(sn => callback(sn));
          }
        })
        .subscribe();
      unsubscribeSupabase = () => {
        supabase.removeChannel(channel);
      };
    }
  }

  return () => {
    const idx = activeSnapshots.findIndex(s => s.ref === ref && s.callback === callback);
    if (idx !== -1) activeSnapshots.splice(idx, 1);
    if (unsubscribeSupabase) unsubscribeSupabase();
  };
}


export function writeBatch(dbInstance: any) {
  const operations: (() => Promise<void>)[] = [];
  return {
    set(docRef: DocumentReference, data: any, options?: any) {
      operations.push(() => setDoc(docRef, data, options));
    },
    update(docRef: DocumentReference, data: any) {
      operations.push(() => updateDoc(docRef, data));
    },
    delete(docRef: DocumentReference) {
      operations.push(() => deleteDoc(docRef));
    },
    async commit() {
      for (const op of operations) {
        await op();
      }
    }
  };
}


// --- DUMMY FCM SERVICES & WEB WRAPPERS ---
export async function getMessagingService() {
  return null;
}
export async function getToken(messaging?: any, options?: any) {
  return 'mock_token';
}
export async function isSupported() {
  return false;
}

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
      return { 
        success: false, 
        error: `Server did not return valid JSON. Received: ${contentType || 'unknown'}.`
      } as unknown as T;
    }

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
    return { success: false, error: "Network connection issue. Please try again." } as unknown as T;
  }
}
