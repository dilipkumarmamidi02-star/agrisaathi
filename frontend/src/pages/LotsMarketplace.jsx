import { useEffect, useState } from 'react';
import axios from 'axios';
import { auth } from '../lib/firebase';
import {
  MapPin,
  ShieldCheck,
  Navigation,
  QrCode,
  X,
  ExternalLink,
  PackageCheck,
  FlaskConical,
  Link as LinkIcon,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import LotDirections from '../components/LotDirections.jsx';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000';

async function authConfig() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('Please sign in before accessing the marketplace.');
  }

  const token = await user.getIdToken();

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}

function distanceKm(lat1, lon1, lat2, lon2) {
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null
  ) {
    return null;
  }

  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371.0088;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return Number(
    (2 * R * Math.asin(Math.sqrt(a))).toFixed(2)
  );
}

function formatNumber(value) {
  if (value == null || value === '') return '—';

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return number.toLocaleString('en-IN');
}

function formatPercent(value) {
  if (value == null || value === '') return '—';

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return `${(number * 100).toFixed(1)}%`;
}

function statusLabel(value) {
  if (!value) return 'Unknown';

  return String(value)
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(value) {
  const normalized = String(value || '').toLowerCase();

  if (
    normalized.includes('verified') ||
    normalized.includes('success') ||
    normalized.includes('approved') ||
    normalized.includes('complete')
  ) {
    return 'bg-green-50 text-green-700 border-green-200';
  }

  if (
    normalized.includes('pending') ||
    normalized.includes('review')
  ) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }

  if (
    normalized.includes('fail') ||
    normalized.includes('invalid') ||
    normalized.includes('reject')
  ) {
    return 'bg-red-50 text-red-700 border-red-200';
  }

  return 'bg-gray-50 text-gray-700 border-gray-200';
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-2 last:border-b-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-right text-sm font-semibold text-gray-800 break-words">
        {value ?? '—'}
      </span>
    </div>
  );
}

function StatusBadge({ label, value }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
        value
      )}`}
    >
      {label}: {statusLabel(value)}
    </span>
  );
}

function normalizeVerificationResponse(data) {
  if (!data || typeof data !== 'object') {
    return {
      lot: null,
      qualityReport: null,
      integrity: null,
      verification: null,
      qrToken: null,
      verificationPath: null,
    };
  }

  const lot =
    data.lot ||
    data.lot_details ||
    data.lot_info ||
    null;

  const qualityReport =
    data.quality_report ||
    data.qualityReport ||
    data.report ||
    null;

  const integrity =
    data.integrity ||
    data.blockchain ||
    null;

  const verification =
    data.verification ||
    data.verification_status ||
    null;

  const qrToken =
    data.qr_token ||
    data.qrToken ||
    lot?.qr_token ||
    null;

  const verificationPath =
    data.verification_url_path ||
    data.verification_path ||
    data.url_path ||
    (qrToken
      ? `/lot-verification/${encodeURIComponent(qrToken)}`
      : null);

  return {
    lot,
    qualityReport,
    integrity,
    verification,
    qrToken,
    verificationPath,
  };
}

export default function LotsMarketplace() {
  const [lots, setLots] = useState([]);
  const [offerPrice, setOfferPrice] = useState({});
  const [sendingOfferFor, setSendingOfferFor] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [myLocation, setMyLocation] = useState(null);

  const [selectedLot, setSelectedLot] = useState(null);
  const [verification, setVerification] = useState(null);
  const [verificationLoading, setVerificationLoading] =
    useState(false);
  const [verificationError, setVerificationError] =
    useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const config = await authConfig();

        const response = await axios.get(
          `${API_URL}/api/lots/?status=active`,
          config
        );

        if (mounted) {
          setLots(response.data || []);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err?.response?.data?.detail ||
              err?.message ||
              'Could not load active lots.'
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!mounted) return;

          setMyLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          // Location is optional for marketplace browsing.
        },
        {
          enableHighAccuracy: true,
          maximumAge: 60000,
          timeout: 10000,
        }
      );
    }

    return () => {
      mounted = false;
    };
  }, []);

  async function openLotDetails(lot) {
    setSelectedLot(lot);
    setVerification(null);
    setVerificationError('');
    setVerificationLoading(true);

    try {
      const config = await authConfig();

      const response = await axios.get(
        `${API_URL}/api/lot-verification/by-lot/${encodeURIComponent(
          lot.id
        )}`,
        config
      );

      setVerification(
        normalizeVerificationResponse(response.data)
      );
    } catch (err) {
      setVerificationError(
        err?.response?.data?.detail ||
          err?.message ||
          'Could not load the lot verification report.'
      );
    } finally {
      setVerificationLoading(false);
    }
  }

  function closeLotDetails() {
    setSelectedLot(null);
    setVerification(null);
    setVerificationError('');
    setVerificationLoading(false);
  }

  function verificationUrl(path) {
    if (!path) return null;

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    if (path.startsWith('/')) {
      return `${window.location.origin}${path}`;
    }

    return `${window.location.origin}/${path}`;
  }

  const makeOffer = async (lot) => {
    const raw = offerPrice[lot.id];
    const price = Number(raw);

    if (!price || price <= 0) {
      alert('Enter a valid offer price per quintal.');
      return;
    }

    setSendingOfferFor(lot.id);
    setError('');

    try {
      const config = await authConfig();

      await axios.post(
        `${API_URL}/api/offers`,
        {
          lot_id: lot.id,
          price,
          quantity: Number(lot.quantity_quintal || 0),
          wants_own_logistics: false,
        },
        config
      );

      alert(
        'Offer sent successfully. The farmer has been notified.'
      );

      setOfferPrice((previous) => ({
        ...previous,
        [lot.id]: '',
      }));
    } catch (err) {
      const detail = err?.response?.data?.detail;

      if (typeof detail === 'object' && detail?.message) {
        setError(detail.message);
      } else {
        setError(
          detail ||
            err?.message ||
            'Could not send offer.'
        );
      }
    } finally {
      setSendingOfferFor(null);
    }
  };

  return (
    <div className="px-4 pt-6 pb-24 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-emerald-800">
          Lots Marketplace
        </h1>

        <p className="text-sm text-gray-500">
          Browse active farmer lots and make an offer.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white border border-green-100 p-8 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-green-100 border-t-green-600" />
          Loading active lots…
        </div>
      ) : lots.length === 0 ? (
        <div className="rounded-2xl bg-white border border-green-100 p-8 text-center">
          <p className="font-semibold text-gray-700">
            No active lots right now.
          </p>

          <p className="text-sm text-gray-500 mt-1">
            New farmer lots will appear here after they become
            marketplace-active.
          </p>
        </div>
      ) : (
        lots.map((lot) => {
          const distance = distanceKm(
            myLocation?.latitude,
            myLocation?.longitude,
            lot.latitude,
            lot.longitude
          );

          return (
            <div
              key={lot.id}
              className="rounded-2xl bg-white border border-green-100 shadow-sm p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-800 text-lg">
                    {lot.crop}
                    {lot.variety
                      ? ` · ${lot.variety}`
                      : ''}
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    {formatNumber(lot.quantity_quintal)} quintal ·
                    Asking ₹
                    {formatNumber(lot.price_per_quintal)}
                    /quintal
                  </p>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Active
                </span>
              </div>

              <div className="rounded-xl bg-green-50/70 border border-green-100 p-3">
                <p className="font-semibold text-gray-800">
                  {lot.farmer_name || 'Farmer'}
                </p>

                {lot.farmer_phone && (
                  <p className="text-sm text-gray-600">
                    📱 {lot.farmer_phone}
                  </p>
                )}

                {lot.farmer_email && (
                  <p className="text-sm text-gray-600 break-all">
                    ✉️ {lot.farmer_email}
                  </p>
                )}

                {(lot.village ||
                  lot.district ||
                  lot.state) && (
                  <p className="text-sm text-gray-600 mt-1">
                    <MapPin className="inline h-3.5 w-3.5 mr-1" />
                    {[lot.village, lot.district, lot.state]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}

                {distance != null && (
                  <p className="text-sm font-semibold text-green-700 mt-1">
                    <Navigation className="inline h-3.5 w-3.5 mr-1" />
                    {distance} km from your location
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => openLotDetails(lot)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                >
                  <PackageCheck className="h-4 w-4" />

                  {(lot.latitude != null ||
                    lot.longitude != null ||
                    lot.location_address ||
                    lot.address ||
                    lot.village ||
                    lot.district ||
                    lot.state) && (
                    <div className="mt-2">
                      <LotDirections
                        latitude={lot.latitude}
                        longitude={lot.longitude}
                        address={
                          lot.location_address ||
                          lot.address ||
                          [
                            lot.village,
                            lot.district,
                            lot.state,
                          ].filter(Boolean).join(', ')
                        }
                        locationLabel="Farmer lot location"
                        compact
                      />
                    </div>
                  )}
                  View Lot & Quality
                </button>

                <button
                  type="button"
                  onClick={() => openLotDetails(lot)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  <QrCode className="h-4 w-4" />
                  View QR
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="Your offer ₹/quintal"
                  value={offerPrice[lot.id] || ''}
                  onChange={(event) =>
                    setOfferPrice((previous) => ({
                      ...previous,
                      [lot.id]: event.target.value,
                    }))
                  }
                  className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />

                <button
                  type="button"
                  onClick={() => makeOffer(lot)}
                  disabled={
                    sendingOfferFor === lot.id ||
                    !offerPrice[lot.id]
                  }
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {sendingOfferFor === lot.id
                    ? 'Sending…'
                    : 'Offer'}
                </button>
              </div>
            </div>
          );
        })
      )}

      {selectedLot && (
        <div
          className="fixed inset-0 z-[120] overflow-y-auto bg-black/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeLotDetails();
            }
          }}
        >
          <div className="mx-auto my-6 w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-3xl border-b border-gray-100 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  Lot Verification
                </p>

                <h2 className="text-xl font-bold text-[#1b4332]">
                  {selectedLot.crop}
                  {selectedLot.variety
                    ? ` · ${selectedLot.variety}`
                    : ''}
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  Lot ID: {selectedLot.id}
                </p>
              </div>

              <button
                type="button"
                onClick={closeLotDetails}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close lot details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <section className="rounded-2xl border border-green-100 bg-green-50/60 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <PackageCheck className="h-5 w-5 text-emerald-700" />

                  <h3 className="font-bold text-[#1b4332]">
                    Lot Details
                  </h3>
                </div>

                <DetailRow
                  label="Crop"
                  value={selectedLot.crop}
                />

                <DetailRow
                  label="Variety"
                  value={selectedLot.variety}
                />

                <DetailRow
                  label="Quantity"
                  value={
                    selectedLot.quantity_quintal != null
                      ? `${formatNumber(
                          selectedLot.quantity_quintal
                        )} quintal`
                      : '—'
                  }
                />

                <DetailRow
                  label="Asking price"
                  value={
                    selectedLot.price_per_quintal != null
                      ? `₹${formatNumber(
                          selectedLot.price_per_quintal
                        )}/quintal`
                      : '—'
                  }
                />

                <DetailRow
                  label="Minimum price"
                  value={
                    selectedLot.min_price_per_quintal != null
                      ? `₹${formatNumber(
                          selectedLot.min_price_per_quintal
                        )}/quintal`
                      : '—'
                  }
                />

                <DetailRow
                  label="Farmer"
                  value={
                    selectedLot.farmer_name || 'Farmer'
                  }
                />

                <DetailRow
                  label="Phone"
                  value={
                    selectedLot.farmer_phone || '—'
                  }
                />

                <DetailRow
                  label="Email"
                  value={
                    selectedLot.farmer_email || '—'
                  }
                />

                <DetailRow
                  label="Location"
                  value={[
                    selectedLot.village,
                    selectedLot.district,
                    selectedLot.state,
                  ]
                    .filter(Boolean)
                    .join(', ') || '—'}
                />

                <DetailRow
                  label="Status"
                  value={statusLabel(
                    selectedLot.status || 'active'
                  )}
                />
              </section>

              {verificationLoading && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
                  <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-emerald-600" />

                  <p className="font-semibold text-gray-700">
                    Loading verified lot analysis…
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Fetching the real quality report and QR
                    verification data.
                  </p>
                </div>
              )}

              {verificationError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                    <div>
                      <p className="font-semibold text-red-800">
                        Verification information unavailable
                      </p>

                      <p className="mt-1 text-sm text-red-700">
                        {verificationError}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!verificationLoading &&
                !verificationError &&
                verification && (
                  <>
                    {verification.qualityReport && (
                      <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                        <div className="mb-4 flex items-center gap-2">
                          <FlaskConical className="h-5 w-5 text-blue-700" />

                          <h3 className="font-bold text-[#16324f]">
                            Quality Analysis
                          </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="rounded-xl border border-blue-100 bg-white p-3">
                            <p className="text-xs text-gray-500">
                              Grade
                            </p>

                            <p className="mt-1 text-lg font-bold text-gray-800">
                              {verification.qualityReport.grade ??
                                '—'}
                            </p>
                          </div>

                          <div className="rounded-xl border border-blue-100 bg-white p-3">
                            <p className="text-xs text-gray-500">
                              Quality Score
                            </p>

                            <p className="mt-1 text-lg font-bold text-gray-800">
                              {verification.qualityReport.score != null
                                ? `${verification.qualityReport.score}/100`
                                : '—'}
                            </p>
                          </div>

                          <div className="rounded-xl border border-blue-100 bg-white p-3">
                            <p className="text-xs text-gray-500">
                              Confidence
                            </p>

                            <p className="mt-1 text-lg font-bold text-gray-800">
                              {formatPercent(
                                verification.qualityReport.confidence
                              )}
                            </p>
                          </div>

                          <div className="rounded-xl border border-blue-100 bg-white p-3">
                            <p className="text-xs text-gray-500">
                              Samples
                            </p>

                            <p className="mt-1 text-lg font-bold text-gray-800">
                              {formatNumber(
                                verification.qualityReport.sample_count
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <DetailRow
                            label="Commodity"
                            value={
                              verification.qualityReport.commodity ||
                              selectedLot.crop
                            }
                          />

                          <DetailRow
                            label="Analysis model"
                            value={
                              verification.qualityReport.model ||
                              verification.qualityReport.model_name
                            }
                          />

                          <DetailRow
                            label="Report ID"
                            value={
                              verification.qualityReport.report_id ||
                              verification.qualityReport.id
                            }
                          />

                          {Array.isArray(
                            verification.qualityReport.sample_scores
                          ) && (
                            <DetailRow
                              label="Sample scores"
                              value={verification.qualityReport.sample_scores.join(
                                ', '
                              )}
                            />
                          )}
                        </div>
                      </section>
                    )}

                    <section className="rounded-2xl border border-gray-200 bg-white p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-emerald-700" />

                        <h3 className="font-bold text-[#1b4332]">
                          Verification & Integrity
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {verification.verification && (
                          <StatusBadge
                            label="Verification"
                            value={
                              typeof verification.verification ===
                              'string'
                                ? verification.verification
                                : verification.verification.status
                            }
                          />
                        )}

                        {verification.integrity && (
                          <>
                            <StatusBadge
                              label="Blockchain"
                              value={
                                typeof verification.integrity ===
                                'string'
                                  ? verification.integrity
                                  : verification.integrity.blockchain_status ||
                                    verification.integrity.status ||
                                    verification.integrity.verification
                              }
                            />

                            {verification.integrity.lot_hash_present !=
                              null && (
                              <StatusBadge
                                label="Lot hash"
                                value={
                                  verification.integrity
                                    .lot_hash_present
                                    ? 'present'
                                    : 'not present'
                                }
                              />
                            )}

                            {verification.integrity.report_hash_present !=
                              null && (
                              <StatusBadge
                                label="Report hash"
                                value={
                                  verification.integrity
                                    .report_hash_present
                                    ? 'present'
                                    : 'not present'
                                }
                              />
                            )}
                          </>
                        )}
                      </div>

                      {verification.qualityReport?.verification_status && (
                        <div className="mt-3">
                          <DetailRow
                            label="Quality verification"
                            value={statusLabel(
                              verification.qualityReport
                                .verification_status
                            )}
                          />
                        </div>
                      )}
                    </section>

                    <section className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <QrCode className="h-5 w-5 text-emerald-700" />

                        <h3 className="font-bold text-[#1b4332]">
                          Lot Verification QR
                        </h3>
                      </div>

                      {verification.qrToken ? (
                        <>
                          <div className="flex justify-center">
                            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                              <QRCodeSVG
                                value={
                                  verificationUrl(
                                    verification.verificationPath
                                  ) ||
                                  `${window.location.origin}/lot-verification/${encodeURIComponent(
                                    verification.qrToken
                                  )}`
                                }
                                size={240}
                                includeMargin
                              />
                            </div>
                          </div>

                          <p className="mt-3 text-center text-sm text-gray-600">
                            Scan this QR code to view the complete
                            lot and quality verification record.
                          </p>

                          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                            <a
                              href={
                                verificationUrl(
                                  verification.verificationPath
                                ) ||
                                `${window.location.origin}/lot-verification/${encodeURIComponent(
                                  verification.qrToken
                                )}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                            >
                              <ExternalLink className="h-4 w-4" />
                              View Full Verification
                            </a>

                            <button
                              type="button"
                              onClick={() => {
                                const url =
                                  verificationUrl(
                                    verification.verificationPath
                                  ) ||
                                  `${window.location.origin}/lot-verification/${encodeURIComponent(
                                    verification.qrToken
                                  )}`;

                                navigator.clipboard
                                  ?.writeText(url)
                                  .then(() => {
                                    alert(
                                      'Verification link copied.'
                                    );
                                  })
                                  .catch(() => {
                                    alert(url);
                                  });
                              }}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
                            >
                              <LinkIcon className="h-4 w-4" />
                              Copy Verification Link
                            </button>
                          </div>

                          <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3">
                            <p className="text-xs font-semibold text-gray-500">
                              QR token
                            </p>

                            <p className="mt-1 break-all font-mono text-xs text-gray-700">
                              {verification.qrToken}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                          A QR token has not been returned for this
                          lot yet.
                        </div>
                      )}
                    </section>

                    {verification.qualityReport?.provenance && (
                      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <h3 className="font-bold text-gray-800">
                          Provenance
                        </h3>

                        <div className="mt-2">
                          <DetailRow
                            label="Version"
                            value={
                              verification.qualityReport
                                .provenance.version
                            }
                          />

                          <DetailRow
                            label="Content hash"
                            value={
                              verification.qualityReport
                                .provenance.content_hash
                            }
                          />

                          <DetailRow
                            label="Source"
                            value={
                              verification.qualityReport
                                .provenance.source
                            }
                          />
                        </div>
                      </section>
                    )}
                  </>
                )}

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-600">
                  Review the lot information and quality verification
                  before submitting your offer. Verification and
                  blockchain statuses shown here come from the
                  AgriSaathi backend and are not fabricated by the
                  marketplace UI.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
