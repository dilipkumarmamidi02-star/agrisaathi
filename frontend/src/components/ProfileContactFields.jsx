import { useEffect, useState } from 'react';
import axios from 'axios';
import { auth } from '../lib/firebase';
import {
  Mail,
  Phone,
  MapPin,
  Navigation,
  Save,
} from 'lucide-react';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000';

async function config() {
  if (!auth.currentUser) {
    throw new Error('Please sign in.');
  }

  const token = await auth.currentUser.getIdToken();

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}

export default function ProfileContactFields() {
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await axios.get(
          `${API_URL}/api/users/me`,
          await config()
        );

        if (!active) return;

        setProfile(response.data);
        setPhone(response.data.phone || '');
        setLatitude(
          response.data.latitude ?? ''
        );
        setLongitude(
          response.data.longitude ?? ''
        );
      } catch (error) {
        if (active) {
          setMessage(
            error?.response?.data?.detail ||
              'Could not load profile.'
          );
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setMessage(
        'Location is not supported by this browser.'
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(
          position.coords.latitude.toFixed(7)
        );
        setLongitude(
          position.coords.longitude.toFixed(7)
        );
        setMessage(
          'Current location captured. Save your profile.'
        );
      },
      () => {
        setMessage(
          'Location permission was not granted.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const save = async () => {
    setSaving(true);
    setMessage('');

    try {
      const response = await axios.patch(
        `${API_URL}/api/users/me`,
        {
          phone: phone.trim() || null,
          latitude:
            latitude === ''
              ? null
              : Number(latitude),
          longitude:
            longitude === ''
              ? null
              : Number(longitude),
        },
        await config()
      );

      setProfile(response.data);
      setMessage(
        'Profile contact and location saved successfully.'
      );
    } catch (error) {
      setMessage(
        error?.response?.data?.detail ||
          'Could not save profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm space-y-4">
      <div>
        <h2 className="text-lg font-bold text-[#1b4332]">
          Contact & Location
        </h2>
        <p className="text-sm text-gray-500">
          These details are used on your lots, QR verification
          and distance/map features.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            <Mail className="inline h-4 w-4 mr-1" />
            Email
          </label>

          <input
            value={profile.email || ''}
            readOnly
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600"
          />

          <p className="mt-1 text-xs text-gray-400">
            Email is taken from your verified account.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            <Phone className="inline h-4 w-4 mr-1" />
            Phone Number
          </label>

          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={(event) =>
              setPhone(
                event.target.value
                  .replace(/\D/g, '')
                  .slice(0, 10)
              )
            }
            placeholder="10-digit mobile number"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            <MapPin className="inline h-4 w-4 mr-1" />
            Latitude
          </label>

          <input
            value={latitude}
            onChange={(event) =>
              setLatitude(event.target.value)
            }
            placeholder="Captured from GPS"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            <MapPin className="inline h-4 w-4 mr-1" />
            Longitude
          </label>

          <input
            value={longitude}
            onChange={(event) =>
              setLongitude(event.target.value)
            }
            placeholder="Captured from GPS"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={captureLocation}
          className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100"
        >
          <Navigation className="h-4 w-4" />
          Use Current Location
        </button>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </div>

      {message && (
        <p className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </p>
      )}
    </section>
  );
}
