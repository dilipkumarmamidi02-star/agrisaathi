import { useState, useEffect } from 'react'
import { FileSpreadsheet, Plus, ShieldCheck, ShieldAlert, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import appClient from '../api/appClient';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import PageHeader from '../components/PageHeader';
import { useLang } from '../lib/i18n';

const CATEGORIES = {
  income: ['Crop Sale', 'Livestock Sale', 'Government Subsidy', 'Other Income'],
  expense: ['Seeds', 'Fertilizer', 'Pesticide', 'Labour', 'Irrigation', 'Equipment', 'Transport', 'Other Expense'],
};

export default function FarmLedger() {
  const { t } = useLang();
  const [userId, setUserId] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [valid, setValid] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: 'expense', category: 'Seeds', amount: '', note: '' });

  const load = async (uid) => {
    setLoading(true);
    try {
      const res = await appClient.call(`/api/ledger/chain/farm_ledger/${uid}`);
      setBlocks(res.blocks || []);
      setValid(res.valid);
    } catch {
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    appClient.auth.me().then((user) => {
      setUserId(user.id);
      load(user.id);
    });
  }, []);

  const submit = async () => {
    if (!userId || !form.amount || Number(form.amount) <= 0) return;
    setSaving(true);
    try {
      await appClient.call('/api/ledger/log', {
        method: 'POST',
        data: {
          entity_type: 'farm_ledger',
          entity_id: userId,
          event_type: form.type,
          payload: { category: form.category, amount: Number(form.amount), note: form.note },
          actor: userId,
        },
      });
      setForm({ type: 'expense', category: 'Seeds', amount: '', note: '' });
      setShowForm(false);
      await load(userId);
    } finally {
      setSaving(false);
    }
  };

  const totalIncome = blocks.filter((b) => b.event_type === 'income').reduce((s, b) => s + (b.payload?.amount || 0), 0);
  const totalExpense = blocks.filter((b) => b.event_type === 'expense').reduce((s, b) => s + (b.payload?.amount || 0), 0);
  const net = totalIncome - totalExpense;

  return (
    <div>
      <PageHeader title={t('ledger')} icon={FileSpreadsheet} />
      <p className="text-xs text-text-secondary mb-3">
        Every entry is written to a tamper-evident, hash-chained ledger — nothing can be silently edited or deleted after the fact.
      </p>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <Card><CardContent className="pt-3">
          <p className="text-xs text-text-secondary">{t('income')}</p>
          <p className="text-base font-bold text-mint">₹{totalIncome.toLocaleString('en-IN')}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3">
          <p className="text-xs text-text-secondary">{t('expense')}</p>
          <p className="text-base font-bold text-red-600">₹{totalExpense.toLocaleString('en-IN')}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3">
          <p className="text-xs text-text-secondary">{t('net')}</p>
          <p className={`text-base font-bold ${net >= 0 ? 'text-mint' : 'text-red-600'}`}>₹{net.toLocaleString('en-IN')}</p>
        </CardContent></Card>
      </div>

      <div className="flex items-center justify-between mb-3">
        <Badge variant={valid ? 'success' : 'destructive'} className="flex items-center gap-1">
          {valid ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
          {valid ? `Chain verified · ${blocks.length} entries` : 'Chain integrity check failed'}
        </Badge>
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4 mr-1" /> Add entry
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{t('type')}</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v, category: CATEGORIES[v][0] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">{t('income')}</SelectItem>
                    <SelectItem value="expense">{t('expense')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('category')}</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES[form.type].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Amount (₹)</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 5000" />
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. Urea for plot 2" />
            </div>
            <Button className="w-full" onClick={submit} disabled={saving || !form.amount}>
              {saving ? 'Saving to ledger…' : 'Save entry'}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-text-muted text-center py-8">Loading ledger…</p>
      ) : blocks.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-sm text-text-muted">No entries yet. Add your first income or expense above.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {[...blocks].reverse().map((b) => (
            <Card key={b.index}>
              <CardContent className="pt-3 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {b.event_type === 'income'
                    ? <ArrowUpCircle className="h-5 w-5 text-green-600 shrink-0" />
                    : <ArrowDownCircle className="h-5 w-5 text-red-500 shrink-0" />}
                  <div>
                    <p className="text-sm font-medium">{b.payload?.category}</p>
                    <p className="text-[11px] text-text-muted">
                      {new Date(b.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {b.payload?.note ? ` · ${b.payload.note}` : ''}
                    </p>
                  </div>
                </div>
                <p className={`text-sm font-bold ${b.event_type === 'income' ? 'text-mint' : 'text-red-600'}`}>
                  {b.event_type === 'income' ? '+' : '−'}₹{(b.payload?.amount || 0).toLocaleString('en-IN')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
