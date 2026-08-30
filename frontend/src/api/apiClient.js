import axios from 'axios';
import { getAuth } from 'firebase/auth';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:8001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Attach the signed-in user's Firebase ID token to every outgoing request.
// If nobody is signed in, the request goes out without an Authorization
// header and the backend's auth dependency will reject it with 401.
api.interceptors.request.use(async (config) => {
  const user = getAuth().currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
export { API_URL };
