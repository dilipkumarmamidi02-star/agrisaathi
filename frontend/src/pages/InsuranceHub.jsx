import {
  useState,
  useEffect
} from 'react'
import {
  ShieldPlus,
  Plus,
  Trash2
} from 'lucide-react';
import {
  useLang
} from '../lib/i18n';
import appClient from '../api/appClient';
import {
  Button
} from '../components/ui/button';
import {
  Card,
  CardContent
} from '../components/ui/card';
import {
  Label
} from '../components/ui/label';
import {
  Input
} from '../components/ui/input';
;
import {
  Badge
} from '../components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '../components/ui/select';
import PageHeader from '../components/PageHeader';
import DataGovFeaturePanel from '../components/DataGovFeaturePanel';

const CLAIM_STATUS = {
  none: { label: 'No claim', color: 'bg-gray-100 text-gray-600' },
  filed: { label: 'Filed', color: 'bg-amber-100 text-amber-700' },
  under_review: { label: 'Under review', color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
};

export default function InsuranceHub() {
  const { t } = useLang();
  const [policies, setPolicies] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ policy_name: '', provider: '', crop_name: '', plot_name: '', premium_amount: '', sum_insured: '', start_date: '', end_date: '' });

  const load = () => appClient.entities.InsurancePolicy.list('-created_date').then(setPolicies).catch(() => []);
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.policy_name) { alert('Policy name required'); return; }
    await appClient.entities.InsurancePolicy.create({
      policy_name: form.policy_name, provider: form.provider || undefined, crop_name: form.crop_name || undefined,
      plot_name: form.plot_name || undefined, premium_amount: form.premium_amount ? Number(form.premium_amount) : undefined,
      sum_insured: form.sum_insured ? Number(form.sum_insured) : undefined, start_date: form.start_date || undefined, end_date: form.end_date || undefined,
      status: 'active', claim_status: 'none',
    });
    setForm({ policy_name: '', provider: '', crop_name: '', plot_name: '', premium_amount: '', sum_insured: '', start_date: '', end_date: '' });
    setShowAdd(false);
    load();
  };

  const updateClaim = async (p, claim_status) => { await appClient.entities.InsurancePolicy.update(p.id, { claim_status }); load(); };
  const remove = async (id) => { await appClient.entities.InsurancePolicy.delete(id); load(); };

  const active = policies.filter((p) => p.status === 'active');
  const filedClaims = policies.filter((p) => p.claim_status !== 'none');

  return (
    <div>
      <PageHeader titleKey="insuranceHub" icon={ShieldPlus} />
      <p className="text-xs text-gray-500 mb-3">{t('insuranceIntro')}</p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <Card className="bg-green-50 border-green-100"><CardContent className="pt-3 text-center">
          <div className="text-2xl font-bold text-green-700">{active.length}</div>
          <div className="text-[11px] text-gray-500">{t('activePolicies')}</div>
        </CardContent></Card>
        <Card className="bg-amber-50 border-amber-100"><CardContent className="pt-3 text-center">
          <div className="text-2xl font-bold text-amber-700">{filedClaims.length}</div>
          <div className="text-[11px] text-gray-500">{t('filedClaims')}</div>
        </CardContent></Card>
      </div>

      <div className="space-y-2 mb-4">
        {policies.length === 0 ? (
          <p className="text-sm text-gray-400">{t('noPolicies')}</p>
        ) : policies.map((p) => {
          const cs = CLAIM_STATUS[p.claim_status] || CLAIM_STATUS.none;
          return (
            <Card key={p.id}><CardContent className="pt-3 space-y-2">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.policy_name}</p>
                  <p className="text-xs text-gray-400">{p.provider}{p.crop_name ? ` · ${p.crop_name}` : ''}{p.plot_name ? ` · ${p.plot_name}` : ''}</p>
                </div>
                <button onClick={() => remove(p.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {p.sum_insured && <Badge variant="secondary">₹{p.sum_insured.toLocaleString('en-IN')} {t('covered')}</Badge>}
                {p.premium_amount && <Badge variant="secondary">₹{p.premium_amount.toLocaleString('en-IN')} {t('premium')}</Badge>}
                {p.end_date && <Badge variant="outline">{t('until')} {p.end_date}</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={cs.color}>{cs.label}</Badge>
                {p.claim_status !== 'approved' && p.claim_status !== 'rejected' && (
                  <Select value={p.claim_status} onValueChange={(v) => updateClaim(p, v)}>
                    <SelectTrigger className="h-7 text-xs w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CLAIM_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent></Card>
          );
        })}
      </div>

      {showAdd ? (
        <Card className="border-green-200"><CardContent className="pt-4 space-y-3">
          <Label>{t('addPolicy')}</Label>
          <div><Label className="mb-1 block text-xs">{t('policyName')}</Label><Input value={form.policy_name} onChange={(e) => setForm({ ...form, policy_name: e.target.value })} /></div>
          <div><Label className="mb-1 block text-xs">{t('provider')}</Label><Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="mb-1 block text-xs">{t('crop')}</Label><Input value={form.crop_name} onChange={(e) => setForm({ ...form, crop_name: e.target.value })} /></div>
            <div><Label className="mb-1 block text-xs">{t('plotName')}</Label><Input value={form.plot_name} onChange={(e) => setForm({ ...form, plot_name: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="mb-1 block text-xs">{t('premium')} (₹)</Label><Input type="number" value={form.premium_amount} onChange={(e) => setForm({ ...form, premium_amount: e.target.value })} /></div>
            <div><Label className="mb-1 block text-xs">{t('sumInsured')} (₹)</Label><Input type="number" value={form.sum_insured} onChange={(e) => setForm({ ...form, sum_insured: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="mb-1 block text-xs">{t('startDate')}</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><Label className="mb-1 block text-xs">{t('endDate')}</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={save} className="flex-1 bg-green-600 hover:bg-green-700">{t('save')}</Button>
            <Button onClick={() => setShowAdd(false)} variant="outline" className="flex-1">{t('cancel')}</Button>
          </div>
        </CardContent></Card>
      ) : (
        <Button onClick={() => setShowAdd(true)} variant="outline" className="w-full border-green-300 text-green-700"><Plus className="h-4 w-4 mr-1" />{t('addPolicy')}</Button>
      )}
      <DataGovFeaturePanel feature="Insurance" />
    </div>
  );
}
