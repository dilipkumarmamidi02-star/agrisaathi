import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
const STORAGE_KEY = 'agrisaathi_location';

const LocationContext = createContext(null);

// Every page reads location from here instead of re-asking the user.
// Set once (Profile page, or first prompt from any page), persisted
// to localStorage, resolved instantly from the local pincode CSV.
export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { pincode: '', state: '', district: '', mandal: '', village: '' };
    } catch {
      return { pincode: '', state: '', district: '', mandal: '', village: '' };
    }
  });
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  }, [location]);

  const resolvePincode = useCallback(async (pincode) => {
    if (!/^\d{6}$/.test(pincode)) {
      setError('Enter a valid 6-digit pincode');
      return null;
    }
    setResolving(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/api/location/pincode/${pincode}`);
      const data = res.data;
      const next = {
        pincode,
        state: data.state,
        district: data.district,
        mandal: data.mandals?.[0] || '',
        village: data.villages?.[0] || '',
        mandals: data.mandals || [],
        villages: data.villages || [],
      };
      setLocationState((prev) => ({ ...prev, ...next }));
      return next;
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not resolve this pincode');
      return null;
    } finally {
      setResolving(false);
    }
  }, []);

  const setLocation = useCallback((partial) => {
    setLocationState((prev) => ({ ...prev, ...partial }));
  }, []);

  return (
    <LocationContext.Provider value={{ location, setLocation, resolvePincode, resolving, error }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocationContext must be used within LocationProvider');
  return ctx;
}
