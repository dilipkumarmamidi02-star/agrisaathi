import { useState, useMemo } from 'react'
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { useLang } from '../lib/i18n';

const BASE_YIELD = {
  rice: 2200,
  wheat: 1800,
  cotton: 500,
  maize: 2500,
  sugarcane: 35000,
};

export default function YieldEstimator() {
  const { t } = useLang();
  const [crop, setCrop] = useState('rice');
  const [area, setArea] = useState('');

  const estimate = useMemo(() => {
    const a = parseFloat(area) || 0;
    const perAcre = BASE_YIELD[crop] || 0;
    return a * perAcre;
  }, [crop, area]);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Yield Estimator</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>{t('cropSingular')}</Label>
            <Select value={crop} onValueChange={setCrop}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(BASE_YIELD).map((c) => (
                  <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Area (acres)</Label>
            <Input type="number" value={area} onChange={(e) => setArea(e.target.value)} />
          </div>
        </div>
        <div className="pt-2 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">Estimated yield</p>
          <p className="text-lg font-semibold text-green-600">
            {estimate.toLocaleString('en-IN')} kg
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
