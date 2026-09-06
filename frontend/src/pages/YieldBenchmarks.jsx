import { useState, useEffect, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import { useLang } from '../lib/i18n';
import appClient from '../api/appClient';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../components/PageHeader';
import DynamicScenePhoto from '../components/DynamicScenePhoto';
import { getRegionalBenchmark } from '../three/config/yieldBenchmarks';

/**
 * Spec #38 "Yield Benchmarks": "your yield vs regional benchmark vs
 * target." Every "your yield" number below is computed from the
 * farmer's own real HarvestRecord entries (quantity / area_harvested,
 * quintal per acre) — nothing here is a live/invented number. The
 * regional figure is a labelled, static reference average; the target
 * is the farmer's own best-ever harvest for that crop, never a
 * guessed or promised outcome.
 */
export default function YieldBenchmarks() {
  const { t } = useLang();
  const [records, setRecords] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('');

  useEffect(() => {
    appClient.entities.HarvestRecord.list('-harvest_date', 300).then(setRecords).catch(() => []);
  }, []);

  const perCrop = useMemo(() => {
    const groups = {};
    records
      .filter((r) => r.crop_name && r.quantity != null && (r.quantity_unit === 'quintal' || !r.quantity_unit) && r.area_harvested)
      .forEach((r) => {
        const key = r.crop_name.trim();
        if (!groups[key]) groups[key] = { totalQty: 0, totalArea: 0, best: 0, count: 0 };
        const g = groups[key];
        const thisYield = r.quantity / r.area_harvested;
        g.totalQty += r.quantity;
        g.totalArea += r.area_harvested;
        g.best = Math.max(g.best, thisYield);
        g.count += 1;
      });
    return Object.entries(groups).map(([crop, g]) => {
      const yourYield = g.totalArea > 0 ? g.totalQty / g.totalArea : 0;
      const benchmark = getRegionalBenchmark(crop);
      const target = Math.max(g.best, benchmark);
      return { crop, yourYield, benchmark, target, count: g.count };
    }).sort((a, b) => b.count - a.count);
  }, [records]);

  useEffect(() => {
    if (perCrop.length && !perCrop.find((c) => c.crop === selectedCrop)) {
      setSelectedCrop(perCrop[0].crop);
    }
  }, [perCrop, selectedCrop]);

  const active = perCrop.find((c) => c.crop === selectedCrop);
  const chartData = active
    ? [
        { name: t('yourYield'), value: Math.round(active.yourYield * 10) / 10 },
        { name: t('regionalAvg'), value: active.benchmark },
        { name: t('target'), value: Math.round(active.target * 10) / 10 },
      ]
    : [];

  return (
    <div>
      <PageHeader title={t('yieldBenchmarksTitle')} icon={BarChart3} />
      <p className="text-xs text-lt-text-secondary mb-3">{t('yieldBenchmarksIntro')}</p>

      {perCrop.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-sm text-lt-text-muted">
          {t('yieldBenchmarksEmpty')}
        </CardContent></Card>
      ) : (
        <>
          {perCrop.length > 1 && (
            <Select value={selectedCrop} onValueChange={setSelectedCrop}>
              <SelectTrigger className="mb-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                {perCrop.map((c) => <SelectItem key={c.crop} value={c.crop}>{c.crop}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <DynamicScenePhoto fallbackQuery="wheat harvest yield field"
            cropName={active?.crop}
            yourRatio={active && active.benchmark > 0 ? active.yourYield / active.benchmark : 1}
            targetRatio={active && active.benchmark > 0 ? active.target / active.benchmark : 1.1}
          />

          <Card className="mb-3"><CardContent className="pt-4">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => `${v} q/acre`} />
                  <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent></Card>

          <p className="text-[11px] text-lt-text-muted">{t('yieldBenchmarksDisclaimer')}</p>
        </>
      )}
    </div>
  );
}
