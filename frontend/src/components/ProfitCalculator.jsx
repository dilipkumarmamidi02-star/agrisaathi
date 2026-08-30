import { useState, useMemo } from 'react'
import { Card, CardContent } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { useLang } from '../lib/i18n';

export default function ProfitCalculator() {
  const { t } = useLang();
  const [area, setArea] = useState('');
  const [costPerAcre, setCostPerAcre] = useState('');
  const [yieldPerAcre, setYieldPerAcre] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');

  const { revenue, cost, profit } = useMemo(() => {
    const a = parseFloat(area) || 0;
    const c = parseFloat(costPerAcre) || 0;
    const y = parseFloat(yieldPerAcre) || 0;
    const p = parseFloat(pricePerUnit) || 0;
    const revenue = a * y * p;
    const cost = a * c;
    return { revenue, cost, profit: revenue - cost };
  }, [area, costPerAcre, yieldPerAcre, pricePerUnit]);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <h3 className="text-sm font-semibold text-lt-text">Profit Calculator</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Area (acres)</Label>
            <Input type="number" value={area} onChange={(e) => setArea(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Cost / acre (₹)</Label>
            <Input type="number" value={costPerAcre} onChange={(e) => setCostPerAcre(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Yield / acre (units)</Label>
            <Input type="number" value={yieldPerAcre} onChange={(e) => setYieldPerAcre(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Price / unit (₹)</Label>
            <Input type="number" value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} />
          </div>
        </div>
        <div className="pt-2 border-t border-lt-bg grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-lt-text-secondary">{t('revenue')}</p>
            <p className="text-sm font-semibold text-lt-text">₹{revenue.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-xs text-lt-text-secondary">{t('cost')}</p>
            <p className="text-sm font-semibold text-lt-text">₹{cost.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-xs text-lt-text-secondary">{t('profit')}</p>
            <p className={`text-sm font-semibold ${profit >= 0 ? 'text-lt-primary' : 'text-red-600'}`}>
              ₹{profit.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
