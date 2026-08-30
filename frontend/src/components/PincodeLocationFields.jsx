import { Label } from './ui/label';
import { Input } from './ui/input';
import { useLocationContext } from '../lib/LocationContext';
import { useLang } from '../lib/i18n';

// Pincode-first: type 6 digits, state/district autofill from the
// local CSV index (instant, all-India coverage). Mandal/village stay
// editable since the directory lists multiple per pincode.
export default function PincodeLocationFields() {
  const { t } = useLang();
  const { location, setLocation, resolvePincode, resolving, error } = useLocationContext();

  const onPincodeChange = async (e) => {
    const pincode = e.target.value.replace(/\D/g, '').slice(0, 6);
    setLocation({ pincode });
    if (pincode.length === 6) await resolvePincode(pincode);
  };

  return (
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
          <select
            className="w-full border rounded-md h-9 px-2 text-sm"
            value={location.mandal}
            onChange={(e) => setLocation({ mandal: e.target.value })}
          >
            {location.mandals.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      )}
      {location.villages?.length > 0 && (
        <div>
          <Label className="text-sm">Village / Post Office</Label>
          <select
            className="w-full border rounded-md h-9 px-2 text-sm"
            value={location.village}
            onChange={(e) => setLocation({ village: e.target.value })}
          >
            {location.villages.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
