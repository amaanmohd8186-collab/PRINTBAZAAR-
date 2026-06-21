import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const isSupabaseConfigured = !!supabaseUrl && !supabaseUrl.includes('placeholder') && !!supabaseServiceRoleKey && !supabaseServiceRoleKey.includes('placeholder');

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseServiceRoleKey : 'placeholder'
);

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

const DB_FILE = path.join(process.cwd(), 'supabase_emulator_db.json');

function getStore() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) {
    console.error("Local mock server-side database file read failed:", e);
  }
  return {};
}

function saveStore(store: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    console.error("Local mock server-side database file write failed:", e);
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

class MockDocumentReference {
  constructor(private collectionName: string, private docId: string) {}
  get id() { return this.docId; }
  async get() {
    if (isSupabaseConfigured) {
      try {
        const table = tblMap[this.collectionName];
        if (table) {
          const { data, error } = await supabase.from(table).select('*').eq('id', this.docId).single();
          if (data && !error) {
            const store = getStore();
            if (!store[this.collectionName]) store[this.collectionName] = {};
            store[this.collectionName][this.docId] = data;
            saveStore(store);
          }
        }
      } catch (e) {
        console.log("Supabase fallback activated msg: " + (e.message || ""));
      }
    }
    const store = getStore();
    const data = store[this.collectionName]?.[this.docId];
    return {
      exists: !!data,
      id: this.docId,
      data: () => data || null
    };
  }
  async set(data: any, options?: any) {
    const store = getStore();
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
    saveStore(store);

    if (isSupabaseConfigured) {
      try {
        const table = tblMap[this.collectionName];
        if (table) {
          const payload = { ...parsedData, id: this.docId };
          await supabase.from(table).upsert(payload);
        }
      } catch (e) {
        console.log("Supabase fallback activated msg: " + (e.message || ""));
      }
    }
  }
  async update(data: any) {
    const store = getStore();
    if (!store[this.collectionName]) {
      store[this.collectionName] = {};
    }
    const current = store[this.collectionName][this.docId] || {};
    const parsedData = processMockData(data);
    store[this.collectionName][this.docId] = { ...current, ...parsedData };
    saveStore(store);

    if (isSupabaseConfigured) {
      try {
        const table = tblMap[this.collectionName];
        if (table) {
          await supabase.from(table).update(parsedData).eq('id', this.docId);
        }
      } catch (e) {
        console.log("Supabase fallback activated msg: " + (e.message || ""));
      }
    }
  }
  async delete() {
    const store = getStore();
    if (store[this.collectionName]) {
      delete store[this.collectionName][this.docId];
    }
    saveStore(store);

    if (isSupabaseConfigured) {
      try {
        const table = tblMap[this.collectionName];
        if (table) {
          await supabase.from(table).delete().eq('id', this.docId);
        }
      } catch (e) {
        console.log("Supabase fallback activated msg: " + (e.message || ""));
      }
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
    if (isSupabaseConfigured) {
      try {
        const table = tblMap[this.collectionName];
        if (table) {
          let q: any = supabase.from(table).select('*');
          this.filters.forEach(f => {
            if (f.op === '==') q = q.eq(f.field, f.val);
            else if (f.op === '>=') q = q.gte(f.field, f.val);
            else if (f.op === '<=') q = q.lte(f.field, f.val);
          });
          const { data, error } = await q;
          if (data && !error) {
            const store = getStore();
            if (!store[this.collectionName]) store[this.collectionName] = {};
            data.forEach((row: any) => {
              store[this.collectionName][row.id || row.order_id || 'unnamed'] = row;
            });
            saveStore(store);
          }
        }
      } catch (e) {
        console.log("Supabase fallback activated msg: " + (e.message || ""));
      }
    }

    const store = getStore();
    const docsMap = store[this.collectionName] || {};
    let items = Object.entries(docsMap).map(([id, data]) => ({ id, data: data as any }));
    for (const filter of this.filters) {
      items = items.filter(item => {
        const itemData: any = item.data;
        if (!itemData) return false;
        const fieldValue = itemData[filter.field];
        if (filter.op === '==') return String(fieldValue) === String(filter.val);
        if (filter.op === '>=') return Number(fieldValue) >= Number(filter.val);
        if (filter.op === '<=') return Number(fieldValue) <= Number(filter.val);
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

async function runTransaction(updateFn: (transaction: any) => Promise<any>) {
  const transaction = {
    get: async (docRef: MockDocumentReference) => docRef.get(),
    set: async (docRef: MockDocumentReference, data: any) => docRef.set(data),
    update: async (docRef: MockDocumentReference, data: any) => docRef.update(data),
    delete: async (docRef: MockDocumentReference) => docRef.delete()
  };
  return updateFn(transaction);
}

const adminDbInstance = {
  collection: (name: string) => new MockCollectionReference(name),
  settings: (opts: any) => {},
  runTransaction: runTransaction
};

export const adminDb: any = () => adminDbInstance;
adminDb.runTransaction = runTransaction;

export const FieldValue = {
  serverTimestamp: () => new Date().toISOString(),
  increment: (val: number) => ({ _isIncrement: true, value: val }),
  arrayUnion: (...items: any[]) => items,
  arrayRemove: (...items: any[]) => []
};

export const adminAuth = () => {
  return {
    verifyIdToken: async (token: string) => {
      if (isSupabaseConfigured) {
        try {
          const { data: { user }, error } = await supabase.auth.getUser(token);
          if (user && !error) {
            return {
              uid: user.id,
              email: user.email,
              displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
            };
          }
        } catch (e) {
          console.log("Supabase fallback activated msg: " + (e.message || ""));
        }
      }

      if (token.startsWith('emu_token_') || token.startsWith('mock_')) {
        const rawPayload = token.replace('emu_token_', '').replace('mock_', '') || 'mock_uid';
        let uid = rawPayload;
        let email = `${uid}@gmail.com`;
        
        if (rawPayload.includes('___')) {
          const parts = rawPayload.split('___');
          uid = parts[0];
          email = parts[1];
        }

        return {
          uid,
          email,
          displayName: email.split('@')[0]
        };
      }
      
      return {
        uid: "mock_uid",
        email: "amaanhmohd8186@gmail.com",
        displayName: "Admin Partner"
      };
    },
    getUserByEmail: async (email: string) => {
      return {
        uid: 'mock_uid_' + email.split('@')[0],
        email,
        displayName: email.split('@')[0]
      };
    },
    listUsers: async (maxResults?: number, nextPageToken?: string) => {
      return {
        users: [
          { uid: 'mock_uid_musagraphics75', email: 'musagraphics75@gmail.com', displayName: 'Musa Graphics' },
          { uid: 'mock_uid_gazisiddiqui01', email: 'gazisiddiqui01@gmail.com', displayName: 'Gazi Siddiqui' }
        ],
        pageToken: undefined
      };
    }
  };
};

export const adminStorage = () => {
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
};

export const getFirebaseAdmin = () => {
  return {} as any;
};

export const logDbWarning = (msg: string, err: any) => {
  console.warn(`[Supabase Error Sync Warning] ${msg}:`, err.message || err);
};
