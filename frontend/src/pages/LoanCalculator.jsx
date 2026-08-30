import { useState, useMemo } from 'react'
import { Calculator, TrendingUp } from 'lucide-react';
import { useLang } from '../lib/i18n';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PageHeader from '../components/PageHeader';

export default function LoanCalculator() {
  const { t } = useLang();
  const [amount, setAmount] = useState('100000');
  const [rate, setRate] = useState('7');
  const [tenure, setTenure] = useState('5');

  const { emi, totalInterest, totalPayable, schedule } = useMemo(() => {
    const P = Number(amount) || 0;
    const r = (Number(rate) || 0) / 12 / 100;
    const n = (Number(tenure) || 0) * 12;
    if (P <= 0 || n <= 0) return { emi: 0, totalInterest: 0, totalPayable: 0, schedule: [] };
    const e = r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = e * n;
    const interest = total - P;
    const yearly = [];
    let bal = P;
    for (let y = 1; y <= Number(tenure); y++) {
      let yrInterest = 0, yrPrincipal = 0;
      for (let m = 0; m < 12; m++) {
        const mi = bal * r;
        const mp = e - mi;
        yrInterest += mi; yrPrincipal += mp; bal -= mp;
      }
      yearly.push({ year: `Y${y}`, principal: Math.round(yrPrincipal), interest: Math.round(yrInterest) });
    }
    return { emi: e, totalInterest: interest, totalPayable: total, schedule: yearly };
  }, [amount, rate, tenure]);

  const fmt = (v) => '₹' + Math.round(v).toLocaleString('en-IN');

  return (
    <div>
      <PageHeader titleKey="loanCalculator" icon={Calculator} />
      <p className="text-xs text-text-secondary mb-3">{t('loanCalcIntro')}</p>

      <Card className="mb-4"><CardContent className="pt-4 space-y-3">
        <div><Label className="mb-1 block text-xs">{t('loanAmount')} (₹)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="mb-1 block text-xs">{t('interestRate')} (%/yr)</Label><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
          <div><Label className="mb-1 block text-xs">{t('tenure')} (years)</Label><Input type="number" value={tenure} onChange={(e) => setTenure(e.target.value)} /></div>
        </div>
      </CardContent></Card>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Card className="bg-mint/10 border-green-100"><CardContent className="pt-3 text-center">
          <div className="text-base font-bold text-mint">{fmt(emi)}</div>
          <div className="text-[10px] text-text-secondary">{t('monthlyEmi')}</div>
        </CardContent></Card>
        <Card className="bg-amber-500/10 border-amber-100"><CardContent className="pt-3 text-center">
          <div className="text-base font-bold text-amber-400">{fmt(totalInterest)}</div>
          <div className="text-[10px] text-text-secondary">{t('totalInterest')}</div>
        </CardContent></Card>
        <Card className="bg-cyan-500/10 border-blue-100"><CardContent className="pt-3 text-center">
          <div className="text-base font-bold text-cyan-400">{fmt(totalPayable)}</div>
          <div className="text-[10px] text-text-secondary">{t('totalPayable')}</div>
        </CardContent></Card>
      </div>

      {schedule.length > 0 && (
        <Card className="mb-4"><CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5 mb-2"><TrendingUp className="h-4 w-4 text-green-600" />{t('repaymentSchedule')}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={schedule} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="principal" stackId="a" fill="#16a34a" name={t('principal')} />
                <Bar dataKey="interest" stackId="a" fill="#f59e0b" name={t('interest')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent></Card>
      )}
      <p className="text-[11px] text-text-muted">{t('loanCalcDisclaimer')}</p>
    </div>
  );
}
