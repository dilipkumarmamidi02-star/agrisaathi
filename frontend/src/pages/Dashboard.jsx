import {
  useState,
  useEffect
} from 'react'
import {
  Link
} from 'react-router-dom';
import {
  LayoutGrid,
  CalendarDays,
  AlertTriangle,
  Plus,
  Leaf,
  Stethoscope,
  TrendingUp
} from 'lucide-react';
import DashboardCalendar from '../components/DashboardCalendar';
import {
  useLang
} from '../lib/i18n';
import appClient from '../api/appClient';
import {
  Card,
  CardContent
} from '../components/ui/card';
import {
  Button
} from '../components/ui/button';
import {
  Badge
} from '../components/ui/badge';
import {
  Input
} from '../components/ui/input';
import {
  Label
} from '../components/ui/label';
;
import PageHeader from '../components/PageHeader';
import ProfitCalculator from '../components/ProfitCalculator';
import PincodeLocationFields from '../components/PincodeLocationFields';
import { useLocationContext } from '../lib/LocationContext';

const today = new Date().toISOString().slice(0, 10);
const daysUntil = (d) => Math.ceil((new Date(d) - new Date(today)) / 86400000);

export default function Dashboard() {
  const { t } = useLang();
  const { location: farmLocation } = useLocationContext();
  const [farms, setFarms] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [livestock, setLivestock] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ plot_name: '', state: '', crop_name: '', area_value: '', sowing_date: '', expected_harvest_date: '' });

  const load = async () => {
    const [f, c, dx, ls, lg, hv] = await Promise.all([
      appClient.entities.Farm.list().catch(() => []),
      appClient.entities.CropCycle.list().catch(() => []),
      appClient.entities.Diagnosis.filter({ escalate: true }, '-created_date', 10).catch(() => []),
      appClient.entities.LivestockCareLog.filter({ status: 'pending' }, 'scheduled_date', 100).catch(() => []),
      appClient.entities.FarmLedgerEntry.list('-entry_date', 100).catch(() => []),
      appClient.entities.HarvestRecord.list('-harvest_date', 50).catch(() => []),
    ]);
    setFarms(f);
    setCycles(c);
    setAlerts(dx);
    setLivestock(ls);
    setLedger(lg);
    setHarvests(hv);
  };
  useEffect(() => { load(); }, []);

  const upcoming = cycles
    .filter((c) => c.expected_harvest_date && c.status !== 'harvested')
    .sort((a, b) => new Date(a.expected_harvest_date) - new Date(b.expected_harvest_date));

  const urgentCycles = cycles.filter((c) => c.alert_level === 'urgent');

  const harvestEvents = upcoming.map((c) => ({ date: c.expected_harvest_date, label: `${c.plot_name} · ${c.crop_name}`, kind: 'harvest' }));
  const milestoneEvents = livestock
    .filter((l) => l.scheduled_date)
    .map((l) => ({ date: l.scheduled_date, label: `${l.animal_type} · ${l.title}`, kind: 'maintenance' }));

  const addPlot = async () => {
    if (!form.plot_name || !form.crop_name) { alert('Plot name and crop are required'); return; }
    const farm = await appClient.entities.Farm.create({
      plot_name: form.plot_name,
      state: farmLocation.state,
      district: farmLocation.district,
      village: farmLocation.village,
      area_value: form.area_value ? Number(form.area_value) : undefined,
      current_crop: form.crop_name,
      farm_type: 'crop',
    });
    await appClient.entities.CropCycle.create({
      farm_id: farm.id,
      plot_name: form.plot_name,
      crop_name: form.crop_name,
      sowing_date: form.sowing_date || undefined,
      expected_harvest_date: form.expected_harvest_date || undefined,
      status: form.sowing_date ? 'sown' : 'planned',
    });
    setForm({ plot_name: '', state: '', crop_name: '', area_value: '', sowing_date: '', expected_harvest_date: '' });
    setShowAdd(false);
    load();
  };

  return (
    <div>
      <PageHeader titleKey="dashboard" icon={LayoutGrid} />

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Card className="bg-mint/10 border-green-100"><CardContent className="pt-3 text-center">
          <div className="text-2xl font-bold text-mint">{farms.length}</div>
          <div className="text-[11px] text-text-secondary">{t('myPlots')}</div>
        </CardContent></Card>
        <Card className="bg-amber-500/10 border-amber-100"><CardContent className="pt-3 text-center">
          <div className="text-2xl font-bold text-amber-400">{upcoming.length}</div>
          <div className="text-[11px] text-text-secondary">{t('upcomingHarvests')}</div>
        </CardContent></Card>
        <Card className="bg-red-500/10 border-red-100"><CardContent className="pt-3 text-center">
          <div className="text-2xl font-bold text-red-600">{alerts.length + urgentCycles.length}</div>
          <div className="text-[11px] text-text-secondary">{t('urgentAlerts')}</div>
        </CardContent></Card>
      </div>

      <div className="mb-4">
        <ProfitCalculator />
      </div>

      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5 mb-2"><TrendingUp className="h-4 w-4 text-green-500" />{t('costVsMarket')}</h3>
      <Card className="mb-4"><CardContent className="pt-4">
        {(() => {
          const totalCost = ledger.filter((e) => e.kind === 'expense').reduce((s, e) => s + (e.amount || 0), 0);
          const harvestValue = harvests.reduce((s, h) => s + ((h.quantity || 0) * (h.sale_price_per_unit || 0)), 0);
          const diff = harvestValue - totalCost;
          const maxVal = Math.max(totalCost, harvestValue, 1);
          return (
            <>
              <div className="space-y-2 mb-3">
                <div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-red-600 font-medium">{t('productionCost')}</span><span className="font-bold text-red-600">₹{totalCost.toLocaleString('en-IN')}</span></div>
                  <div className="bg-surface-hover rounded-full h-2.5 overflow-hidden"><div className="bg-red-500/100 h-full rounded-full" style={{ width: `${(totalCost / maxVal) * 100}%` }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span className="text-green-600 font-medium">{t('harvestMarketValue')}</span><span className="font-bold text-green-600">₹{harvestValue.toLocaleString('en-IN')}</span></div>
                  <div className="bg-surface-hover rounded-full h-2.5 overflow-hidden"><div className="bg-mint/100 h-full rounded-full" style={{ width: `${(harvestValue / maxVal) * 100}%` }} /></div>
                </div>
              </div>
              <div className={`rounded-lg p-2 text-center ${diff >= 0 ? 'bg-mint/10' : 'bg-amber-500/10'}`}>
                <div className={`text-sm font-bold ${diff >= 0 ? 'text-mint' : 'text-amber-400'}`}>{diff >= 0 ? t('surplus') : t('deficit')}: ₹{Math.abs(diff).toLocaleString('en-IN')}</div>
                <div className="text-[10px] text-text-muted">{t('costVsMarketNote')}</div>
              </div>
            </>
          );
        })()}
      </CardContent></Card>

      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5 mb-2"><CalendarDays className="h-4 w-4 text-green-500" />{t('calendar')}</h3>
      <div className="mb-4">
        <DashboardCalendar harvestEvents={harvestEvents} milestoneEvents={milestoneEvents} />
      </div>

      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 text-red-500" />{t('urgentAlerts')}</h3>
      </div>
      {alerts.length === 0 && urgentCycles.length === 0 ? (
        <p className="text-sm text-text-muted mb-4">{t('noAlerts')}</p>
      ) : (
        <div className="space-y-2 mb-4">
          {urgentCycles.map((c) => (
            <Card key={c.id} className="border-red-200 bg-red-500/10/50"><CardContent className="pt-3">
              <p className="text-sm font-medium text-red-400">{c.plot_name} · {c.crop_name}</p>
              <p className="text-xs text-red-600">{c.alert_note || 'Urgent attention needed'}</p>
            </CardContent></Card>
          ))}
          {alerts.map((a) => (
            <Link to="/diagnose" key={a.id}>
              <Card className="border-red-200 bg-red-500/10/50 hover:shadow-md"><CardContent className="pt-3">
                <p className="text-sm font-medium text-red-400">{a.subject || 'Diagnosis'}</p>
                <p className="text-xs text-red-600 truncate">{a.likely_issue} — {a.escalation_note || 'Expert review recommended'}</p>
              </CardContent></Card>
            </Link>
          ))}
        </div>
      )}

      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5 mb-2"><CalendarDays className="h-4 w-4 text-amber-500" />{t('upcomingHarvests')}</h3>
      <div className="space-y-2 mb-4">
        {upcoming.length === 0 ? (
          <p className="text-sm text-text-muted">No scheduled harvests. Add a plot to start tracking.</p>
        ) : upcoming.map((c) => {
          const d = daysUntil(c.expected_harvest_date);
          return (
            <Card key={c.id}><CardContent className="pt-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{c.plot_name} · {c.crop_name}</p>
                <p className="text-xs text-text-muted">{c.expected_harvest_date}</p>
              </div>
              <Badge className={d <= 7 ? 'bg-amber-100 text-amber-400' : 'bg-mint/20 text-mint'}>
                {d > 0 ? `${d} days` : 'Ready'}
              </Badge>
            </CardContent></Card>
          );
        })}
      </div>

      <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5 mb-2"><Leaf className="h-4 w-4 text-green-500" />{t('myPlots')}</h3>
      <div className="space-y-2 mb-4">
        {farms.length === 0 ? (
          <p className="text-sm text-text-muted">No plots yet.</p>
        ) : farms.map((f) => (
          <Card key={f.id}><CardContent className="pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{f.plot_name}</p>
                <p className="text-xs text-text-muted">{f.current_crop || '—'} · {f.state || ''} {f.area_value ? `· ${f.area_value} ${f.area_unit}` : ''}</p>
              </div>
              <Link to="/livestock-care"><Stethoscope className="h-4 w-4 text-gray-300" /></Link>
            </div>
          </CardContent></Card>
        ))}
      </div>

      {showAdd ? (
        <Card className="border-green-200"><CardContent className="pt-4 space-y-3">
          <div><Label className="mb-1 block">{t('plotName')}</Label><Input value={form.plot_name} onChange={(e) => setForm({ ...form, plot_name: e.target.value })} /></div>
          <div><Label className="mb-1 block">{t('crop')}</Label><Input value={form.crop_name} onChange={(e) => setForm({ ...form, crop_name: e.target.value })} /></div>
          <div><Label className="mb-1.5 block">{t('state')}</Label><PincodeLocationFields /></div>
          <div><Label className="mb-1 block">{t('area')}</Label><Input type="number" value={form.area_value} onChange={(e) => setForm({ ...form, area_value: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="mb-1 block">Sowing</Label><Input type="date" value={form.sowing_date} onChange={(e) => setForm({ ...form, sowing_date: e.target.value })} /></div>
            <div><Label className="mb-1 block">Exp. harvest</Label><Input type="date" value={form.expected_harvest_date} onChange={(e) => setForm({ ...form, expected_harvest_date: e.target.value })} /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={addPlot} className="flex-1 bg-green-600 hover:bg-green-700">{t('save')}</Button>
            <Button onClick={() => setShowAdd(false)} variant="outline" className="flex-1">{t('cancel')}</Button>
          </div>
        </CardContent></Card>
      ) : (
        <Button onClick={() => setShowAdd(true)} variant="outline" className="w-full border-mint/40 text-mint">
          <Plus className="h-4 w-4 mr-1" />{t('addPlot')}
        </Button>
      )}
    </div>
  );
}
