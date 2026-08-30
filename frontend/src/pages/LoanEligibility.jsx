import { ai } from '../api/appClient';
import { useState, useEffect } from 'react'
import { Banknote, CheckCircle2, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { useLang } from '../lib/i18n';
import appClient from '../api/appClient';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import PageHeader from '../components/PageHeader';

export default function LoanEligibility() {
  const { t } = useLang();
  const [loans, setLoans] = useState([]);
  const [farms, setFarms] = useState([]);
  const [results, setResults] = useState({});
  const [checking, setChecking] = useState(null);

  useEffect(() => {
    appClient.entities.GovLoan.list('name', 50).then(setLoans).catch(() => {});
    appClient.entities.Farm.list().then(setFarms).catch(() => {});
  }, []);

  const farmProfile = farms.length
    ? farms.map((f) => `Plot ${f.plot_name}: ${f.state || ''} ${f.district || ''}, ${f.area_value || ''} ${f.area_unit || ''}, crop ${f.current_crop || 'none'}, type ${f.farm_type || ''}.`).join(' ')
    : 'No farm plots registered yet.';

  const check = async (loan) => {
    setChecking(loan.id);
    try {
      const res = await ai.invoke({
        prompt: `You are a farm loan eligibility assistant for Indian government agricultural loans. Given the farmer's profile and loan details, assess eligibility as ELIGIBLE, PARTIALLY, or NOT eligible. List the documents the farmer should prepare. Be conservative; if unsure say PARTIALLY. Simple farmer-friendly language.

Farmer profile: ${farmProfile}

Loan: ${loan.name}
Provider: ${loan.provider || 'N/A'}
Max amount: ₹${loan.max_amount || 'N/A'}
Interest: ${loan.interest_rate || 'N/A'}
Purpose: ${loan.purpose || 'N/A'}
Eligibility: ${loan.eligibility_summary || 'Not specified'}
Known required documents: ${(loan.required_documents || []).join(', ')}`,
        response_json_schema: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['eligible', 'partially', 'not_eligible'] },
            reason: { type: 'string' },
            documents_needed: { type: 'array', items: { type: 'string' } },
            next_steps: { type: 'string' },
          },
          required: ['status', 'reason'],
        },
      });
      setResults((prev) => ({ ...prev, [loan.id]: res }));
    } catch {
      setResults((prev) => ({ ...prev, [loan.id]: { status: 'partially', reason: t('checkFailed'), documents_needed: loan.required_documents || [] } }));
    } finally {
      setChecking(null);
    }
  };

  const statusStyle = (s) =>
    s === 'eligible' ? 'bg-mint/20 text-mint' :
    s === 'partially' ? 'bg-amber-100 text-amber-400' :
    'bg-red-100 text-red-400';
  const statusLabel = (s) =>
    s === 'eligible' ? t('eligible') :
    s === 'partially' ? t('partiallyEligible') :
    t('notEligible');

  return (
    <div>
      <PageHeader titleKey="loanEligibility" icon={Banknote} />
      <p className="text-xs text-text-secondary mb-4">{t('loanIntro')}</p>

      {loans.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-sm text-text-muted">{t('noLoans')}</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {loans.map((l) => {
            const r = results[l.id];
            return (
              <Card key={l.id}><CardContent className="pt-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm leading-tight">{l.name}</h3>
                  {r && <Badge className={statusStyle(r.status)}>{statusLabel(r.status)}</Badge>}
                </div>
                {l.provider && <p className="text-xs text-text-secondary">{l.provider}</p>}
                <div className="flex flex-wrap gap-2 text-xs">
                  {l.max_amount && <Badge variant="secondary">₹{l.max_amount.toLocaleString('en-IN')} max</Badge>}
                  {l.interest_rate && <Badge variant="secondary">{l.interest_rate}</Badge>}
                </div>
                {l.purpose && <p className="text-sm text-text-primary">{l.purpose}</p>}
                {l.eligibility_summary && <p className="text-xs text-text-secondary"><span className="font-medium">Eligibility:</span> {l.eligibility_summary}</p>}
                {r?.reason && <div className="bg-surface-hover rounded-lg p-2 text-xs text-text-secondary">{r.reason}</div>}
                {r?.documents_needed?.length > 0 && (
                  <div className="bg-cyan-500/10 rounded-lg p-2">
                    <p className="text-xs font-semibold text-cyan-400 flex items-center gap-1 mb-1"><FileText className="h-3 w-3" />{t('documentsNeeded')}</p>
                    <ul className="text-xs text-blue-600 list-disc pl-4">
                      {r.documents_needed.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                )}
                {r?.next_steps && <div className="bg-mint/10 rounded-lg p-2 text-xs text-mint">{r.next_steps}</div>}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => check(l)} disabled={checking === l.id} className="flex-1">
                    {checking === l.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                    {t('checkEligibility')}
                  </Button>
                  {l.apply_link && (
                    <Button size="sm" variant="ghost" asChild>
                      <a href={l.apply_link} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3" /></a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
          })}
        </div>
      )}
    </div>
  );
}
