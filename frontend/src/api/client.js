import axios from 'axios';
import { getAuth } from 'firebase/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the signed-in user's Firebase ID token to every outgoing request.
api.interceptors.request.use(async (config) => {
  const user = getAuth().currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API methods
export const apiClient = {
  dataGovResources: () => api.get('/api/data-gov/resources'),

  dataGovResource: (resourceKey, params = {}) =>
    api.get('/api/data-gov/resources/data', {
      params: {
        resource: resourceKey,
        ...params,
      },
    }),

  dataGovHealth: () => api.get('/api/data-gov/health'),

  // Health check
  health: () => api.get('/health'),
  
  // Crop recommendation
  recommendCrop: (data) => api.post('/api/crop/recommend', data),
  
  // Fertilizer calculation
  calculateFertilizer: (data) => api.post('/api/fertilizer/calculate', data),
  
  // Diagnosis
  analyzeImage: (formData) => api.post('/api/diagnosis/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export default apiClient;
