import { useState, useEffect } from 'react';
import { ShieldCheck, Lock, FileText } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import DataGovFeaturePanel from '../components/DataGovFeaturePanel';
import { useLang } from '../lib/i18n';
import appClient from '../api/appClient';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import DynamicScenePhoto from '../components/DynamicScenePhoto';

/**
 * Spec #29 "Insurance Vault": secure digital vault visual language,
 * subtle rather than distracting. AgriSaathi doesn't have a separate
 * document-upload entity yet, so this is a read-only, secured view of
 * the farmer's real InsurancePolicy records (the same data managed on
 * /insurance-hub) — not a fake file system, per spec #71/#90/#91.
 */
const CLAIM_STATUS_LABEL = {
  none: 'No claim',
  filed: 'Filed',
  under_review: 'Under review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function InsuranceVault() {
  const { t } = useLang();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    appClient.entities.InsurancePolicy.list('-created_date')
      .then(setPolicies)
      .catch(() => setPolicies([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title={t('insuranceVaultTitle')} icon={ShieldCheck} />
      <p className="text-xs text-lt-text-secondary mb-3">
        A secured, read-only view of your policy records. To add or edit a policy, use Insurance Hub.
      </p>

      <DynamicScenePhoto fallbackQuery="insurance documents safe" recordCount={policies.length} />

      {loading ? (
        <p className="text-sm text-lt-text-muted">{t('loading')}</p>
      ) : policies.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-sm text-lt-text-muted">
          Nothing in your vault yet — policies you add on Insurance Hub will appear here, secured.
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {policies.map((p) => (
            <Card key={p.id}><CardContent className="pt-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-lt-text-muted shrink-0" />
                  <p className="text-sm font-medium truncate">{p.policy_name}</p>
                </div>
                <Badge variant="secondary" className="shrink-0 flex items-center gap-1">
                  <FileText className="h-3 w-3" />{CLAIM_STATUS_LABEL[p.claim_status] || 'No claim'}
                </Badge>
              </div>
              <p className="text-xs text-lt-text-muted">
                {p.provider}{p.crop_name ? ` · ${p.crop_name}` : ''}{p.plot_name ? ` · ${p.plot_name}` : ''}
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                {p.sum_insured && <Badge variant="outline">₹{p.sum_insured.toLocaleString('en-IN')} covered</Badge>}
                {p.start_date && p.end_date && <Badge variant="outline">{p.start_date} → {p.end_date}</Badge>}
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
      <DataGovFeaturePanel feature="Insurance Vault" />
    </div>
  );
}
