import { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { useUserRole } from '../hooks/useUserRole';

import { getErrorMessage } from '../lib/errorMessage';
import { QRCodeSVG } from 'qrcode.react';
export default function LotsMarketplace() {

  // Buyer QR verification state.
  // Uses the REAL qr_token persisted on the lot.
  const [qrLot, setQrLot] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');

  const API_BASE_URL = (
    import.meta.env.VITE_API_URL || 'http://localhost:8000'
  ).replace(/\/$/, '');

  const getLotQrToken = (lot) =>
    lot?.qr_token ||
    lot?.qrToken ||
    lot?.qr?.token ||
    lot?.verification_token ||
    null;

  const getLotQrUrl = (lot) => {
    const token = getLotQrToken(lot);

    if (!token) {
      return null;
    }

    return (
      window.location.origin +
      '/lot-verification/' +
      encodeURIComponent(token)
    );
  };

  const resolveLotQr = async (lot) => {
    setQrError('');
    setQrLoading(true);

    try {
      let token = getLotQrToken(lot);

      /*
       * Prefer the real qr_token already returned
       * by the marketplace API.
       */
      if (!token) {
        const lotId =
          lot?.lot_id ||
          lot?.lotId ||
          lot?.id;

        if (!lotId) {
          throw new Error(
            'This marketplace lot does not contain a lot ID.'
          );
        }

        const response = await fetch(
          `${API_BASE_URL}/api/lot-verification/by-lot/${encodeURIComponent(lotId)}`
        );

        if (!response.ok) {
          let message = 'Unable to retrieve the real QR token.';

          try {
            const data = await response.json();
            if (data?.detail) {
              message = data.detail;
            }
          } catch {
            // Keep default message.
          }

          throw new Error(message);
        }

        const data = await response.json();
        token = data?.qr_token || null;
      }

      if (!token) {
        throw new Error(
          'No persisted QR token exists for this lot.'
        );
      }

      /*
       * Preserve the marketplace lot and attach
       * the real persisted token.
       */
      setQrLot({
        ...lot,
        qr_token: token,
      });

    } catch (error) {
      console.error('Buyer QR verification error:', error);

      setQrLot(null);
      setQrError(
        error?.message ||
        'Unable to open the lot QR verification.'
      );
    } finally {
      setQrLoading(false);
    }
  };

  const closeQr = () => {
    setQrLot(null);
    setQrError('');
    setQrLoading(false);
  };



  const { uid } = useUserRole();
  const [lots, setLots] = useState([]);
  const [offerPrice, setOfferPrice] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendingOfferFor, setSendingOfferFor] = useState(null);

  useEffect(() => {
    apiClient
      .get('/api/lots', { params: { status: 'active' } })
      .then((res) => {
        setLots(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(getErrorMessage(err, 'Could not load lots.'));
        setLoading(false);
      });
  }, []);

  const makeOffer = async (lot) => {
    const price = Number(offerPrice[lot.id]);
    if (!price) return;
    setSendingOfferFor(lot.id);
    try {
      await apiClient.post('/api/entities/Offer', {
        lot_id: lot.id,
        buyer_id: uid,
        farmer_id: lot.farmer_id,
        quantity: lot.quantity_quintal,
        quantity_unit: 'quintal',
        price_per_unit: price,
        total_price: price * (lot.quantity_quintal || 0),
        status: 'pending',
      });
      alert('Offer sent to the farmer.');
      setOfferPrice((p) => ({ ...p, [lot.id]: '' }));
    } catch (err) {
      alert(err?.response?.data?.detail || 'Could not send offer. Please try again.');
    } finally {
      setSendingOfferFor(null);
    }
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-2xl font-bold text-emerald-800">Lots Marketplace</h1>
      <p className="text-sm text-gray-500">Browse active farmer lots and make an offer.</p>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : lots.length === 0 ? (
        <p className="text-sm text-gray-400">No active lots right now.</p>
      ) : (
        lots.map((lot) => (
          <div key={lot.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-2">
            <p className="font-semibold text-gray-800">
              {lot.crop} {lot.variety ? `· ${lot.variety}` : ''}
            </p>
            <p className="text-sm text-gray-500">
              {lot.quantity_quintal} quintal · Asking ₹{lot.price_per_quintal}/quintal · {lot.farmer_name}
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Your offer (₹/quintal)"
                value={offerPrice[lot.id] || ''}
                onChange={(e) => setOfferPrice((p) => ({ ...p, [lot.id]: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm flex-1"
              />
              
<div className="flex flex-wrap items-center gap-2 mt-3">

  <button
    type="button"
    onClick={() => resolveLotQr(lot)}
    disabled={qrLoading}
    className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 transition disabled:opacity-60"
  >
    {qrLoading ? 'Loading QR…' : 'QR Verify'}
  </button>

<button
                onClick={() => makeOffer(lot)}
                disabled={sendingOfferFor === lot.id || !offerPrice[lot.id]}
                className="bg-emerald-600 text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50"
              >
                {sendingOfferFor === lot.id ? 'Sending…' : 'Offer'}
              </button>

</div>
            </div>
          </div>
        ))
      )}

{/* =================================================
          BUYER LOT QR VERIFICATION MODAL
          ================================================= */}

      {qrLot && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setQrLot(null);
            }
          }}
        >

          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">

            <button
              type="button"
              onClick={() => setQrLot(null)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
              aria-label="Close QR verification"
            >
              ×
            </button>

            <div className="pr-10">

              <div className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                AgriSaathi
              </div>

              <h2 className="mt-1 text-2xl font-bold text-[#1b4332]">
                Verify This Lot
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Scan this QR code to inspect the lot and its quality report.
              </p>

            </div>

            <div className="mt-6 flex justify-center">

              {getLotQrUrl(qrLot) ? (
                <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">

                  <QRCodeSVG
                    value={getLotQrUrl(qrLot)}
                    size={240}
                    level="H"
                    includeMargin={true}
                  />

                </div>
              ) : (
                <div className="rounded-xl bg-amber-50 p-5 text-center text-sm text-amber-800">
                  QR verification is not available for this lot yet.
                </div>
              )}

            </div>

            <div className="mt-5 rounded-xl bg-emerald-50 p-4">

              <div className="text-xs text-emerald-700">
                LOT
              </div>

              <div className="mt-1 font-semibold text-[#1b4332]">
                {qrLot?.lot_id ||
                  qrLot?.lotId ||
                  qrLot?.id ||
                  'Lot'}
              </div>

              <div className="mt-1 text-sm text-slate-600">
                {qrLot?.crop || qrLot?.commodity || 'Commodity'}
                {qrLot?.variety
                  ? ` · ${qrLot.variety}`
                  : ''}
              </div>

            </div>

            {getLotQrUrl(qrLot) && (
              <a
                href={getLotQrUrl(qrLot)}
                className="mt-5 flex w-full items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800 transition"
              >
                Open Verification
              </a>
            )}

            <button
              type="button"
              onClick={() => setQrLot(null)}
              className="mt-3 w-full rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>

          </div>

        </div>
      )}

    </div>
  );

      
}
