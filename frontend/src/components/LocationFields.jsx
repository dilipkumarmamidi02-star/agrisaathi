import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { STATES, districtsOf } from '../lib/indianLocations';
import { useLang } from '../lib/i18n';

// Matches how every caller actually uses this component:
//   <LocationFields value={profile} onChange={(v) => setProfile({ ...profile, ...v })} />
// Previous version expected {state, district, onStateChange, onDistrictChange} props
// that nobody ever passed -- onValueChange ended up undefined and crashed on click.
export default function LocationFields({ value = {}, onChange = () => {}, compact = false }) {
  const { t } = useLang();
  const state = value.state || '';
  const district = value.district || '';
  const districts = districtsOf(state);

  const setState = (v) => onChange({ state: v, district: '' });
  const setDistrict = (v) => onChange({ district: v });
  const setMandal = (v) => onChange({ mandal: v });
  const setVillage = (v) => onChange({ village: v });

  return (
    <div className={compact ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-sm">{t('state')}</Label>
          <Select value={state} onValueChange={setState}>
            <SelectTrigger><SelectValue placeholder={t('selectState')} /></SelectTrigger>
            <SelectContent className="max-h-72">
              {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">{t('district')}</Label>
          <Select value={district} onValueChange={setDistrict} disabled={!state || districts.length === 0}>
            <SelectTrigger><SelectValue placeholder={districts.length ? "Select district" : "No data yet"} /></SelectTrigger>
            <SelectContent className="max-h-72">
              {districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-sm">{t('mandal')}</Label>
          <Input value={value.mandal || ''} onChange={(e) => setMandal(e.target.value)} placeholder={t('mandal')} />
        </div>
        <div>
          <Label className="text-sm">{t('village')}</Label>
          <Input value={value.village || ''} onChange={(e) => setVillage(e.target.value)} placeholder={t('village')} />
        </div>
      </div>
    </div>
  );
}
