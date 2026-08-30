import { useState, useEffect } from 'react'
import { Landmark, CheckCircle2, XCircle, HelpCircle, ExternalLink, Loader2, MapPin } from 'lucide-react';
import appClient from '../api/appClient';
import { STATES } from '../lib/indianLocations';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import PageHeader from '../components/PageHeader';
import DataGovFeaturePanel from '../components/DataGovFeaturePanel';
import { useLang } from '../lib/i18n';

// Fields the rules checker can use, per scheme. Keep this small and honest --
// only ask what's actually needed to evaluate that scheme's published rules.
const ELIGIBILITY_QUESTIONS = {
  'pm-kisan': [
    { field: 'owns_land', label: 'Do you own agricultural land?' },
    { field: 'is_institutional_land_holder', label: 'Is the land held by an institution (not you personally)?' },
    { field: 'is_income_tax_payer', label: 'Did you pay income tax last year?' },
    { field: 'is_govt_employee_above_grade', label: 'Are you a serving/retired government employee above the excluded grade?' },
  ],
  pmfby: [
    { field: 'grows_notified_crop', label: 'Are you growing a crop notified for insurance in your area this season?' },
    { field: 'state_participates_pmfby_this_season', label: 'Has your state opted into PMFBY this season?' },
  ],
  kcc: [{ field: 'owns_land', label: 'Do you cultivate land (as owner, tenant, or sharecropper)?' }],
  'rythu-bharosa': [{ field: 'owns_land', label: 'Do you own agricultural land in Telangana?' }],
  'rythu-bima': [{ field: 'owns_land', label: 'Do you own agricultural land in Telangana?' }],
};

export default function GovernmentSchemes() {
  const { t } = useLang();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterState, setFilterState] = useState('');
  const [answers, setAnswers] = useState({}); // { [schemeId]: { field: bool } }
  const [results, setResults] = useState({}); // { [schemeId]: EligibilityCheckResponse }
  const [checking, setChecking] = useState(null);
  const [openScheme, setOpenScheme] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    appClient.call('/api/schemes', { params: filterState ? { state: filterState } : {} })
      .then((res) => setSchemes(Array.isArray(res) ? res : []))
      .catch(() => setError('Could not load schemes. Backend may be unavailable — try again shortly.'))
      .finally(() => setLoading(false));
  }, [filterState]);

  const setAnswer = (schemeId, field, value) => {
    setAnswers((prev) => ({ ...prev, [schemeId]: { ...prev[schemeId], [field]: value } }));
  };

  const runCheck = async (schemeId) => {
    setChecking(schemeId);
    try {
      const payload = answers[schemeId] || {};
      const res = await appClient.call(`/api/schemes/${schemeId}/check-eligibility`, {
        method: 'POST',
        data: payload,
      });
      setResults((prev) => ({ ...prev, [schemeId]: res }));
    } catch {
      setResults((prev) => ({
        ...prev,
        [schemeId]: { status: 'needs_more_info', reason: 'Could not reach the eligibility check service.', missing_info: [] },
      }));
    } finally {
      setChecking(null);
    }
  };

  const statusStyle = (s) =>
    s === 'likely_eligible' ? 'bg-mint/20 text-mint' :
    s === 'likely_not_eligible' ? 'bg-red-100 text-red-400' :
    'bg-amber-100 text-amber-400';
  const statusIcon = (s) =>
    s === 'likely_eligible' ? <CheckCircle2 className="h-3 w-3" /> :
    s === 'likely_not_eligible' ? <XCircle className="h-3 w-3" /> :
    <HelpCircle className="h-3 w-3" />;
  const statusLabel = (s) =>
    s === 'likely_eligible' ? 'Likely eligible' :
    s === 'likely_not_eligible' ? 'Likely not eligible' :
    'Need more info';

  return (
    <div>
      <PageHeader titleKey="govSchemes" icon={Landmark} />
      <p className="text-xs text-text-secondary mb-3">
        Central + state scheme reference. Eligibility is checked against each scheme's published rules — not a live government
        decision. Always confirm on the official portal before relying on a result.
      </p>

      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-4 w-4 text-green-600 shrink-0" />
        <Select value={filterState || 'all'} onValueChange={(v) => setFilterState(v === 'all' ? '' : v)}>
          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder={t('allStates')} /></SelectTrigger>
          <SelectContent className="max-h-72">
            {/* Radix Select.Item rejects value="" at runtime -- use a sentinel instead */}
            <SelectItem value="all">{t('allIndia')}</SelectItem>
            {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-green-600" /></div>
      ) : error ? (
        <Card><CardContent className="pt-6 text-center text-sm text-red-500">{error}</CardContent></Card>
      ) : schemes.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-sm text-text-muted">No schemes found for this state yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {schemes.map((s) => {
            const result = results[s.id];
            const questions = ELIGIBILITY_QUESTIONS[s.id] || [];
            const isOpen = openScheme === s.id;
            return (
              <Card key={s.id}><CardContent className="pt-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm leading-tight">{s.name}</h3>
                  {result && <Badge className={`flex items-center gap-1 ${statusStyle(result.status)}`}>{statusIcon(result.status)}{statusLabel(result.status)}</Badge>}
                </div>
                {s.ministry && <p className="text-xs text-text-secondary">{s.ministry}</p>}
                <p className="text-sm text-text-primary">{s.benefit_summary}</p>
                <p className="text-xs text-text-secondary"><span className="font-medium">Eligibility:</span> {s.eligibility_summary}</p>

                {result?.reason && <div className="bg-surface-hover rounded-lg p-2 text-xs text-text-secondary">{result.reason}</div>}
                {result?.next_steps && <div className="bg-mint/10 rounded-lg p-2 text-xs text-mint">{result.next_steps}</div>}

                {isOpen && questions.length > 0 && (
                  <div className="space-y-2 bg-surface-hover rounded-lg p-3">
                    {questions.map((q) => (
                      <div key={q.field} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-text-primary flex-1">{q.label}</span>
                        <div className="flex gap-1 shrink-0">
                          {[['Yes', true], ['No', false]].map(([label, val]) => (
                            <button
                              key={label}
                              onClick={() => setAnswer(s.id, q.field, val)}
                              className={`px-2 py-1 rounded text-xs border ${
                                answers[s.id]?.[q.field] === val ? 'bg-green-600 text-white border-green-600' : 'bg-surface text-text-secondary border-border'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!isOpen) { setOpenScheme(s.id); return; }
                      runCheck(s.id);
                    }}
                    disabled={checking === s.id}
                    className="flex-1"
                  >
                    {checking === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                    {isOpen ? 'Run eligibility check' : 'Check eligibility'}
                  </Button>
                  {s.official_link && (
                    <Button size="sm" variant="ghost" asChild>
                      <a href={s.official_link} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3" /></a>
                    </Button>
                  )}
                </div>
              </CardContent></Card>
            );
          })}
        </div>
      )}
      <DataGovFeaturePanel feature="Government Schemes" />
    </div>
  );
}

