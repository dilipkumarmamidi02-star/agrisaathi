import {
  useState,
  useEffect
} from 'react'
import {
  BarChart3,
  TrendingDown
} from 'lucide-react';
import {
  useLang
} from '../lib/i18n';
import appClient from '../api/appClient';
import {
  Card,
  CardContent
} from '../components/ui/card';
;
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import PageHeader from '../components/PageHeader';

const PIE_COLORS = ['#16a34a', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#64748b'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ExpenseAnalytics() {
  const { t } = useLang();
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    appClient.entities.FarmLedgerEntry.list('-entry_date', 200).then(setEntries).catch(() => []);
  }, []);

  const expenses = entries.filter((e) => e.kind === 'expense');
  const byCategory = {};
  expenses.forEach((e) => { const c = e.category || 'Other'; byCategory[c] = (byCategory[c] || 0) + (e.amount || 0); });
  const pieData = Object.entries(byCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const byMonth = {};
  expenses.forEach((e) => {
    if (!e.entry_date) return;
    const m = e.entry_date.slice(0, 7);
    byMonth[m] = (byMonth[m] || 0) + (e.amount || 0);
  });
  const monthData = Object.entries(byMonth).sort().map(([k, v]) => ({ month: MONTHS[Number(k.slice(5)) - 1] || k, amount: v }));

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const avgMonth = monthData.length ? total / monthData.length : 0;
  const topCategory = pieData[0];

  return (
    <div>
      <PageHeader titleKey="expenseAnalytics" icon={BarChart3} />
      <p className="text-xs text-text-secondary mb-3">{t('expenseAnalyticsIntro')}</p>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Card className="bg-red-500/10 border-red-100"><CardContent className="pt-3 text-center">
          <div className="text-base font-bold text-red-600">₹{total.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-text-secondary">{t('totalSpent')}</div>
        </CardContent></Card>
        <Card className="bg-amber-500/10 border-amber-100"><CardContent className="pt-3 text-center">
          <div className="text-base font-bold text-amber-600">₹{Math.round(avgMonth).toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-text-secondary">{t('avgPerMonth')}</div>
        </CardContent></Card>
        <Card className="bg-cyan-500/10 border-blue-100"><CardContent className="pt-3 text-center">
          <div className="text-base font-bold text-cyan-400 truncate">{topCategory ? topCategory.name : '—'}</div>
          <div className="text-[10px] text-text-secondary">{t('topCategory')}</div>
        </CardContent></Card>
      </div>

      {pieData.length > 0 && (
        <Card className="mb-4"><CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">{t('spendingByCategory')}</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={{ fontSize: 10 }}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => '₹' + Number(v).toLocaleString('en-IN')} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent></Card>
      )}

      {monthData.length > 0 && (
        <Card className="mb-4"><CardContent className="pt-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5 mb-2"><TrendingDown className="h-4 w-4 text-red-500" />{t('monthlyTrend')}</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => '₹' + Number(v).toLocaleString('en-IN')} />
                <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}
