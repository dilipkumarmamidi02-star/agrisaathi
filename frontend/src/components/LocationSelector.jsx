import { useState, useCallback, useRef, useMemo } from 'react';
import { getDataGovResource } from '../lib/dataGov';
import { useLocationTree } from '../hooks/useLocationTree';
import { getStates, getDistricts, getVillages } from '../lib/locations';

/*
 * LocationSelector
 * -----------------------------------------------------------------
 * Two modes:
 *   - "By pincode": looks up a 6-digit pincode via the live
 *     Data.gov.in pincode_directory resource (unchanged from before).
 *   - "Select manually": true cascading State -> District -> Village
 *     dropdowns, backed by public/data/locations.json (36 states,
 *     754 districts, ~162k villages/post offices — built from the
 *     same India Post pincode directory dataset).
 *
 * Usage:
 *   <LocationSelector value={location} onChange={setLocation} />
 * value / onChange shape (unchanged):
 *   { pincode, state, district, village }
 */

export default function LocationSelector({ value, onChange }) {
  const [mode, setMode] = useState('pincode'); // 'pincode' | 'manual'
  const [pincodeInput, setPincodeInput] = useState(value?.pincode || '');
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | found | notfound | error
  const debounceRef = useRef(null);

  const { tree, loading: treeLoading, error: treeError } = useLocationTree();

  const loc = value || { pincode: '', state: '', district: '', village: '' };

  const states = useMemo(() => getStates(tree), [tree]);
  const districts = useMemo(
    () => getDistricts(tree, loc.state),
    [tree, loc.state]
  );
  const villages = useMemo(
    () => getVillages(tree, loc.state, loc.district),
    [tree, loc.state, loc.district]
  );

  const lookupPincode = useCallback(async (pin) => {
    if (!/^\d{6}$/.test(pin)) {
      setStatus('idle');
      setMatches([]);
      return;
    }
    setStatus('loading');
    try {
      const data = await getDataGovResource('pincode_directory', { pincode: pin, limit: 10 });
      const records = Array.isArray(data?.records) ? data.records : [];
      if (records.length === 0) {
        setStatus('notfound');
        setMatches([]);
        return;
      }
      setMatches(records);
      setStatus('found');
      const first = records[0];
      onChange({
        pincode: pin,
        state: first.statename || '',
        district: first.district || '',
        village: first.officename || '',
      });
    } catch {
      setStatus('error');
      setMatches([]);
    }
  }, [onChange]);

  const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPincodeInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => lookupPincode(val), 400);
  };

  const selectOffice = (record) => {
    onChange({
      pincode: pincodeInput,
      state: record.statename || '',
      district: record.district || '',
      village: record.officename || '',
    });
  };

  const handleStateChange = (e) => {
    onChange({ ...loc, state: e.target.value, district: '', village: '' });
  };

  const handleDistrictChange = (e) => {
    onChange({ ...loc, district: e.target.value, village: '' });
  };

  const handleVillageChange = (e) => {
    onChange({ ...loc, village: e.target.value });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 bg-gray-100 rounded-full p-1 w-fit">
        <button
          type="button"
          onClick={() => setMode('pincode')}
          className={`px-3 py-1 rounded-full text-xs font-medium ${mode === 'pincode' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
        >
          By pincode
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`px-3 py-1 rounded-full text-xs font-medium ${mode === 'manual' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
        >
          Select manually
        </button>
      </div>

      {mode === 'pincode' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
          <input
            type="text"
            inputMode="numeric"
            value={pincodeInput}
            onChange={handlePincodeChange}
            placeholder="6-digit pincode"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />

          {status === 'loading' && (
            <p className="text-xs text-gray-400 mt-1">Looking up…</p>
          )}
          {status === 'notfound' && (
            <p className="text-xs text-amber-600 mt-1">No match found for this pincode — try selecting manually instead.</p>
          )}
          {status === 'error' && (
            <p className="text-xs text-red-600 mt-1">Could not reach the pincode directory right now.</p>
          )}

          {status === 'found' && loc.state && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <p className="text-gray-800"><span className="text-gray-500">State:</span> {loc.state}</p>
              <p className="text-gray-800"><span className="text-gray-500">District:</span> {loc.district}</p>
              <p className="text-gray-800"><span className="text-gray-500">Post office:</span> {loc.village}</p>
              <p className="text-xs text-gray-400 mt-1">Source: Data.gov.in — All India Pincode Directory</p>
            </div>
          )}

          {matches.length > 1 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1">{matches.length} post offices share this pincode — pick yours:</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {matches.map((m, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectOffice(m)}
                    className={`w-full text-left text-xs px-2 py-1.5 rounded ${loc.village === m.officename ? 'bg-green-100 text-green-800' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  >
                    {m.officename} — {m.district}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'manual' && (
        <div className="grid grid-cols-3 gap-3">
          {treeError && (
            <p className="col-span-3 text-xs text-red-600">
              Could not load the location list. Try refreshing the page.
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select
              value={loc.state}
              onChange={handleStateChange}
              disabled={treeLoading}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">{treeLoading ? 'Loading…' : 'Select state'}</option>
              {states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
            <select
              value={loc.district}
              onChange={handleDistrictChange}
              disabled={!loc.state}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">{loc.state ? 'Select district' : 'Select state first'}</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Village / area</label>
            <select
              value={loc.village}
              onChange={handleVillageChange}
              disabled={!loc.district}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">{loc.district ? 'Select village' : 'Select district first'}</option>
              {villages.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
