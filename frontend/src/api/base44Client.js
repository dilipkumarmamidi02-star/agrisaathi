import axios from 'axios';
import { getAuth } from 'firebase/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
const STORAGE_PREFIX = 'agrisaathi_entity_';
const AUTH_KEY = 'agrisaathi_user_profile';

// ---- generic localStorage-backed entity store (unchanged) ----
function readStore(entityName) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + entityName);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStore(entityName, records) {
  localStorage.setItem(STORAGE_PREFIX + entityName, JSON.stringify(records));
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function createEntity(entityName) {
  return {
    list: async (_sortField, limit) => {
      const records = readStore(entityName);
      return typeof limit === 'number' ? records.slice(0, limit) : records;
    },
    filter: async (query = {}) => {
      const records = readStore(entityName);
      return records.filter((r) =>
        Object.entries(query).every(([k, v]) => r[k] === v)
      );
    },
    get: async (id) => {
      const records = readStore(entityName);
      return records.find((r) => r.id === id) || null;
    },
    create: async (data) => {
      const records = readStore(entityName);
      const record = { id: makeId(), ...data, created_at: new Date().toISOString() };
      records.push(record);
      writeStore(entityName, records);
      return record;
    },
    update: async (id, data) => {
      const records = readStore(entityName);
      const idx = records.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      records[idx] = { ...records[idx], ...data, updated_at: new Date().toISOString() };
      writeStore(entityName, records);
      return records[idx];
    },
    delete: async (id) => {
      const records = readStore(entityName);
      const filtered = records.filter((r) => r.id !== id);
      writeStore(entityName, filtered);
      return true;
    },
  };
}

const entitiesProxy = new Proxy(
  {},
  { get: (_target, entityName) => createEntity(String(entityName)) }
);

// ---- NEW: auth namespace ----
// This is what was missing. It mirrors the entitiesProxy pattern (local-first,
// backend-optional) so every page that calls base44.auth.me()/.updateMe()
// gets a real object back instead of `undefined`, which is what was throwing
// "Cannot read properties of undefined (reading 'me')" on Profile,
// Government Schemes, Community, and Animal Encyclopedia.
//
// Once you wire real Firebase sign-in on the frontend, replace the body of
// `me()` with a call to your backend's /api/users/me (sent with the Firebase
// ID token as a Bearer header, same as protected_test.py expects) and keep
// the localStorage branch only as an offline fallback.
function defaultProfile() {
  return {
    id: 'guest',
    full_name: '',
    email: '',
    phone: '',
    state: '',
    district: '',
    mandal: '',
    village: '',
    geo_lat: null,
    geo_lng: null,
    preferred_language: 'en',
    is_guest: true,
  };
}

function readProfile() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : defaultProfile();
  } catch {
    return defaultProfile();
  }
}

function writeProfile(profile) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(profile));
  return profile;
}

const auth = {
  // Pages call this expecting a user object back (or a rejected promise
  // they .catch(() => {}) around) — never expose it as undefined.
  me: async () => {
    // TODO: once Firebase sign-in is wired on the frontend, try:
    //   const token = await firebaseAuth.currentUser?.getIdToken();
    //   if (token) return (await base44.createClient({ headers: { Authorization: `Bearer ${token}` } }).get('/api/users/me')).data;
    return readProfile();
  },

  updateMe: async (patch) => {
    const current = readProfile();
    const updated = { ...current, ...patch, is_guest: false };
    return writeProfile(updated);
  },

  isAuthenticated: async () => {
    const p = readProfile();
    return !p.is_guest;
  },

  logout: async () => {
    localStorage.removeItem(AUTH_KEY);
    return true;
  },
};

export const base44 = {
  entities: entitiesProxy,
  auth,

  createClient: (options = {}) => {
    const client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    client.interceptors.request.use(async (config) => {
      const user = getAuth().currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return client;
  },

  call: async (endpoint, options = {}) => {
    const client = base44.createClient();
    try {
      const response = await client({
        url: endpoint,
        method: options.method || 'GET',
        data: options.data,
        params: options.params,
        ...options,
      });
      return response.data;
    } catch (error) {
      console.error('API Call Error:', error);
      throw error;
    }
  },

  integrations: {
    Core: {
      InvokeLLM: async (params) => {
        if (params.prompt && params.prompt.includes('plant disease')) {
          try {
            const response = await base44.call('/api/diagnosis/analyze', {
              method: 'POST',
              data: params,
            });
            return response;
          } catch (error) {
            console.error('LLM Invoke Error:', error);
            return { status: 'error', reason: 'Failed to analyze' };
          }
        }
        return { status: 'partial', reason: 'LLM service not configured' };
      },
    },
  },
};

export default base44;

