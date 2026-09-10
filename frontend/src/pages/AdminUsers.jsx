import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Search,
  Phone,
  Mail,
  Building2,
  MapPin,
  QrCode,
  X,
} from 'lucide-react';

import { auth } from '../lib/firebase';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000';

const SUPPORTER_LABELS = {
  fpo_farmer_group: 'FPO / Farmer Group',
  buyer: 'Buyer',
  trader: 'Trader',
  processor: 'Processor',
  institutional_buyer: 'Institutional Buyer',
  logistics_provider: 'Logistics Provider',
  warehouse_provider: 'Warehouse Provider',
  cold_storage_provider: 'Cold Storage Provider',
  quality_service_provider: 'Quality Service Provider',
  private_market_operator: 'Private Market Operator',
  government_market_operator: 'Government Market / Mandi Operator',
};

async function requestConfig() {
  if (!auth.currentUser) {
    throw new Error('Admin session not found.');
  }

  const token = await auth.currentUser.getIdToken();

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(null);
  const [qrUser, setQrUser] = useState(null);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(
        `${API_URL}/api/users/admin/users`,
        await requestConfig()
      );

      setUsers(response.data || []);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          'Could not load users.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateStatus = async (user, action) => {
    setWorking(user.id);
    setError('');

    try {
      const endpoint =
        action === 'verify'
          ? `/api/users/admin/users/${user.id}/verify`
          : action === 'reject'
            ? `/api/users/admin/users/${user.id}/reject`
            : `/api/users/admin/users/${user.id}/suspend`;

      await axios.post(
        `${API_URL}${endpoint}`,
        {},
        await requestConfig()
      );

      await loadUsers();
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          `Could not ${action} user.`
      );
    } finally {
      setWorking(null);
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      if (
        filter !== 'all' &&
        user.role !== filter
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        user.full_name,
        user.email,
        user.phone,
        user.business_name,
        user.supporter_type,
        user.state,
        user.district,
        user.village,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        );
    });
  }, [users, search, filter]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-green-100 border-t-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold text-[#1b4332]">
          User Management
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Verify and manage all platform users
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by name, email, phone or business..."
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-green-500"
          />
        </div>

        <select
          value={filter}
          onChange={(event) =>
            setFilter(event.target.value)
          }
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
        >
          <option value="all">All Users</option>
          <option value="farmer">Farmers</option>
          <option value="supporter">Supporters</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((user) => {
          const status =
            user.verification_status || 'verified';

          const isSupporter =
            user.role === 'supporter';

          return (
            <article
              key={user.id}
              className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex gap-3 min-w-0">
                  <div className="h-11 w-11 shrink-0 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-800">
                    {user.full_name?.[0]?.toUpperCase() ||
                      user.email?.[0]?.toUpperCase() ||
                      'U'}
                  </div>

                  <div className="min-w-0">
                    <h2 className="font-bold text-[#1b4332]">
                      {user.full_name ||
                        'Unnamed User'}
                    </h2>

                    <p className="text-sm text-gray-500 break-all">
                      <Mail className="inline h-3.5 w-3.5 mr-1" />
                      {user.email || 'No email'}
                    </p>

                    <p className="text-sm text-gray-500">
                      <Phone className="inline h-3.5 w-3.5 mr-1" />
                      {user.phone || 'No phone number'}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                        {user.role}
                      </span>

                      {isSupporter &&
                        user.supporter_type && (
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {SUPPORTER_LABELS[
                              user.supporter_type
                            ] ||
                              user.supporter_type}
                          </span>
                        )}

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          status === 'verified'
                            ? 'bg-green-50 text-green-700'
                            : status === 'pending'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {status === 'verified'
                          ? '✓ VERIFIED'
                          : status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setQrUser(user)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-100"
                >
                  <QrCode className="h-4 w-4" />
                  Supporter QR
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {user.business_name && (
                  <div className="rounded-xl bg-gray-50 p-3 text-sm">
                    <p className="text-xs text-gray-400">
                      Business / Company
                    </p>
                    <p className="font-semibold text-gray-700">
                      <Building2 className="inline h-4 w-4 mr-1" />
                      {user.business_name}
                    </p>
                  </div>
                )}

                {(user.state ||
                  user.district ||
                  user.village) && (
                  <div className="rounded-xl bg-gray-50 p-3 text-sm">
                    <p className="text-xs text-gray-400">
                      Location
                    </p>
                    <p className="font-semibold text-gray-700">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      {[
                        user.village,
                        user.district,
                        user.state,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {status === 'pending' &&
                  isSupporter && (
                    <>
                      <button
                        type="button"
                        disabled={working === user.id}
                        onClick={() =>
                          updateStatus(
                            user,
                            'verify'
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Verify
                      </button>

                      <button
                        type="button"
                        disabled={working === user.id}
                        onClick={() =>
                          updateStatus(
                            user,
                            'reject'
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </>
                  )}

                {status === 'verified' &&
                  user.role !== 'admin' && (
                    <>
                      <button
                        type="button"
                        disabled={working === user.id}
                        onClick={() =>
                          updateStatus(
                            user,
                            'reject'
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>

                      <button
                        type="button"
                        disabled={working === user.id}
                        onClick={() =>
                          updateStatus(
                            user,
                            'suspend'
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 disabled:opacity-50"
                      >
                        <ShieldAlert className="h-4 w-4" />
                        Suspend
                      </button>
                    </>
                  )}

                {status === 'rejected' && (
                  <span className="text-sm text-red-600">
                    Account rejected
                  </span>
                )}

                {status === 'suspended' && (
                  <span className="text-sm text-red-600">
                    Account suspended
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-green-100 bg-white p-10 text-center text-gray-500">
          No users found.
        </div>
      )}

      {qrUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setQrUser(null)}
              className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <QrCode className="h-6 w-6 text-green-700" />
              </div>

              <h2 className="text-xl font-bold text-[#1b4332]">
                Supporter Verification QR
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Scan to view the authorised supporter profile.
              </p>

              <div className="my-6 flex justify-center">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <QRCodeSVG
                    value={JSON.stringify({
                      type: 'agrisaathi_supporter',
                      id: qrUser.id,
                      email: qrUser.email,
                      phone: qrUser.phone,
                      name: qrUser.full_name,
                      role: qrUser.role,
                      supporter_type:
                        qrUser.supporter_type,
                      business_name:
                        qrUser.business_name,
                      verification_status:
                        qrUser.verification_status,
                    })}
                    size={220}
                    includeMargin
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-green-50 p-4 text-left space-y-1.5 text-sm">
                <p>
                  <strong>Name:</strong>{' '}
                  {qrUser.full_name || '—'}
                </p>

                <p>
                  <strong>Email:</strong>{' '}
                  {qrUser.email || '—'}
                </p>

                <p>
                  <strong>Phone:</strong>{' '}
                  {qrUser.phone || '—'}
                </p>

                <p>
                  <strong>Role:</strong>{' '}
                  {qrUser.role || '—'}
                </p>

                {qrUser.supporter_type && (
                  <p>
                    <strong>Supporter:</strong>{' '}
                    {SUPPORTER_LABELS[
                      qrUser.supporter_type
                    ] ||
                      qrUser.supporter_type}
                  </p>
                )}

                {qrUser.business_name && (
                  <p>
                    <strong>Business:</strong>{' '}
                    {qrUser.business_name}
                  </p>
                )}

                <p>
                  <strong>Status:</strong>{' '}
                  {qrUser.verification_status ||
                    'verified'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
