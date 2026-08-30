import { useState, useEffect, useMemo } from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { useLocationContext } from '../lib/LocationContext';
import { useLang } from '../lib/i18n';

// Pincode-first: type 6 digits, state/district autofill from the
// local CSV index (instant, all-India coverage). Mandal/village stay
// editable since the directory lists multiple per pincode.
//
// "Select manually" mode is the fallback for a farmer who doesn't
// know their pincode: cascading State -> District -> Village
// dropdowns backed by the same CSV index via /api/location/states,
// /districts, /villages.
export default function PincodeLocationFields() {
  const { t } = useLang();
  const {
    location,
    setLocation,
    resolvePincode,
    resolving,
    error,
    browseStates,
    browseDistricts,
    browseVillages,
  } = useLocationContext();

  const [mode, setMode] = useState('pincode'); // 'pincode' | 'manual'
  const [stateOptions, setStateOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);
  const [villageOptions, setVillageOptions] = useState([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [villagesLoading, setVillagesLoading] = useState(false);

  // Load states once, when the user switches to manual mode.
  useEffect(() => {
    if (mode !== 'manual' || stateOptions.length > 0) return;
    setStatesLoading(true);
    browseStates().then((states) => {
      setStateOptions(states);
      setStatesLoading(false);
    });
  }, [mode, stateOptions.length, browseStates]);

  // Load districts whenever the selected state changes (manual mode only).
  useEffect(() => {
    if (mode !== 'manual' || !location.state) {
      setDistrictOptions([]);
      return;
    }
    setDistrictsLoading(true);
    browseDistricts(location.state).then((districts) => {
      setDistrictOptions(districts);
      setDistrictsLoading(false);
    });
  }, [mode, location.state, browseDistricts]);

  // Load villages whenever the selected district changes (manual mode only).
  useEffect(() => {
    if (mode !== 'manual' || !location.state || !location.district) {
      setVillageOptions([]);
      return;
    }
    setVillagesLoading(true);
    browseVillages(location.state, location.district).then((villages) => {
      setVillageOptions(villages);
      setVillagesLoading(false);
    });
  }, [mode, location.state, location.district, browseVillages]);

  const onPincodeChange = async (e) => {
    const pincode = e.target.value.replace(/\D/g, '').slice(0, 6);
    setLocation({ pincode });
    if (pincode.length === 6) await resolvePincode(pincode);
  };

  const onManualStateChange = (e) => {
    setLocation({ state: e.target.value, district: '', mandal: '', village: '' });
  };

  const onManualDistrictChange = (e) => {
    setLocation({ district: e.target.value, mandal: '', village: '' });
  };

  const onManualVillageChange = (e) => {
    setLocation({ village: e.target.value });
  };

  const selectClass = 'w-full border rounded-md h-9 px-2 text-sm';

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
        <div className="space-y-2">
          <div>
            <Label className="text-sm">{t('pincode')}</Label>
            <Input value={location.pincode} onChange={onPincodeChange} placeholder="6-digit pincode" maxLength={6} />
            {resolving && <p className="text-xs text-gray-400 mt-1">Resolving…</p>}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          {location.state && (
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div><span className="text-gray-400">State:</span> {location.state}</div>
              <div><span className="text-gray-400">District:</span> {location.district}</div>
            </div>
          )}
          {location.mandals?.length > 0 && (
            <div>
              <Label className="text-sm">{t('mandal')}</Label>
              <select className={selectClass} value={location.mandal} onChange={(e) => setLocation({ mandal: e.target.value })}>
                {location.mandals.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
          {location.villages?.length > 0 && (
            <div>
              <Label className="text-sm">Village / Post Office</Label>
              <select className={selectClass} value={location.village} onChange={(e) => setLocation({ village: e.target.value })}>
                {location.villages.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {mode === 'manual' && (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-sm">State</Label>
            <select className={selectClass} value={location.state} onChange={onManualStateChange} disabled={statesLoading}>
              <option value="">{statesLoading ? 'Loading…' : 'Select state'}</option>
              {stateOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-sm">District</Label>
            <select className={selectClass} value={location.district} onChange={onManualDistrictChange} disabled={!location.state || districtsLoading}>
              <option value="">{!location.state ? 'Select state first' : districtsLoading ? 'Loading…' : 'Select district'}</option>
              {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-sm">Village / area</Label>
            <select className={selectClass} value={location.village} onChange={onManualVillageChange} disabled={!location.district || villagesLoading}>
              <option value="">{!location.district ? 'Select district first' : villagesLoading ? 'Loading…' : 'Select village'}</option>
              {villageOptions.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
