import { useState, useEffect } from 'react';
import { Phone, MapPin, ExternalLink, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { getAuth } from 'firebase/auth';

// Attaches the signed-in user's Firebase ID token as a plain fetch() header.
// Async because getIdToken() is async — callers must await this before use.
async function authHeader() {
  const user = getAuth().currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

/**
 * NextSteps
 * Renders directly under a HISTORICAL KCC answer block.
 * Gives the farmer three real, immediately actionable paths to a
 * CURRENT answer, without the app itself issuing a dosage/recommendation.
 *
 * Props:
 *   pincode        - string, farmer's pincode if known (from profile/geolocation)
 *   productName     - string, chemical/product name mentioned in the historical
 *                      answer (optional — enables the registration cross-check)
 */
export default function NextSteps({ pincode, productName }) {
  const [kvk, setKvk] = useState(null);
  const [kvkStatus, setKvkStatus] = useState('idle'); // idle | loading | found | unavailable
  const [regStatus, setRegStatus] = useState(null);    // null | { listed: bool, ... } | 'unavailable'

  useEffect(() => {
    if (!pincode) return;
    setKvkStatus('loading');
    // Uses resource #9 (All India Pincode Directory) already registered in your
    // dataGov registry to resolve district, then looks up the nearest KVK.
    // Adjust the endpoint path to whatever your backend actually exposes —
    // this assumes a /api/near-me/kvk route backed by pincode -> district lookup.
    authHeader().then((headers) =>
      fetch(`/api/near-me/kvk?pincode=${encodeURIComponent(pincode)}`, { headers })
      .then((r) => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then((data) => {
        if (data && data.name) {
          setKvk(data);
          setKvkStatus('found');
        } else {
          setKvkStatus('unavailable');
        }
      })
      .catch(() => setKvkStatus('unavailable')));
  }, [pincode]);

  useEffect(() => {
    if (!productName) return;
    // Optional: cross-check against resource #7 (Pesticides Dealers License Report)
    // or a dedicated registration dataset if you have one. This is a FACTUAL
    // lookup only ("is this name present in current records?") — never a
    // recommendation, dosage, or safety claim.
    authHeader().then((headers) =>
      fetch(`/api/data-gov/resources/data?resource=pesticide_dealers&product=${encodeURIComponent(productName)}&limit=1`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.count === 'number') {
          setRegStatus({ listed: data.count > 0 });
        } else {
          setRegStatus('unavailable');
        }
      })
      .catch(() => setRegStatus('unavailable')));
  }, [productName]);

  return (
    <div className="mt-3 rounded-2xl border border-lt-primary/20 bg-lt-primary/5 p-4 space-y-3">
      <div className="text-xs font-semibold text-lt-primary tracking-wide">
        GET A CURRENT ANSWER
      </div>

      {/* Kisan Call Centre live helpline — always shown, always real */}
      <a
        href="tel:18001801551"
        className="flex items-center gap-3 bg-lt-card rounded-xl p-3 border border-lt-primary/10 hover:border-green-300 transition-colors"
      >
        <div className="bg-lt-primary text-white rounded-full p-2">
          <Phone size={16} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-lt-text">
            Call Kisan Call Centre — 1800-180-1551
          </div>
          <div className="text-xs text-lt-text-secondary">
            Free, government-run, live agronomist support in your language
          </div>
        </div>
      </a>

      {/* Nearest KVK, resolved from pincode via resource #9 */}
      {pincode && (
        <div className="bg-lt-card rounded-xl p-3 border border-lt-primary/10">
          <div className="flex items-center gap-3">
            <div className="bg-lt-primary text-white rounded-full p-2">
              <MapPin size={16} />
            </div>
            <div className="flex-1">
              {kvkStatus === 'loading' && (
                <div className="text-sm text-lt-text-secondary">Finding your nearest KVK…</div>
              )}
              {kvkStatus === 'found' && kvk && (
                <>
                  <div className="text-sm font-medium text-lt-text">{kvk.name}</div>
                  <div className="text-xs text-lt-text-secondary">
                    {kvk.district}{kvk.phone ? ` · ${kvk.phone}` : ''}
                  </div>
                </>
              )}
              {kvkStatus === 'unavailable' && (
                <>
                  <div className="text-sm font-medium text-lt-text">
                    Find your nearest Krishi Vigyan Kendra
                  </div>
                  <a
                    href="https://kvk.icar.gov.in/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-lt-primary-dark inline-flex items-center gap-1"
                  >
                    kvk.icar.gov.in <ExternalLink size={10} />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Optional factual registration cross-check — no dosage, no recommendation */}
      {productName && regStatus && regStatus !== 'unavailable' && (
        <div className="bg-lt-card rounded-xl p-3 border border-lt-primary/10 flex items-start gap-3">
          <div className={`rounded-full p-2 text-white ${regStatus.listed ? 'bg-lt-primary' : 'bg-amber-500'}`}>
            {regStatus.listed ? <ShieldCheck size={16} /> : <ShieldQuestion size={16} />}
          </div>
          <div className="text-xs text-lt-text-secondary">
            <span className="font-medium text-lt-text">{productName}</span>
            {regStatus.listed
              ? ' appears in current dealer records we have access to.'
              : ' does not appear in the dealer records we currently have — confirm current registration with your KVK before use.'}
            <div className="text-[10px] text-lt-text-muted mt-1">
              Dealer-license data only — not a registration, safety, or dosage authority.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
