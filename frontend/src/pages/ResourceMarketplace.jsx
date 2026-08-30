import { useEffect, useMemo, useState } from 'react';
import {
  Store,
  Database,
  Clock3,
} from 'lucide-react';

import {
  getDataGovResources,
} from '../lib/dataGov';

import {
  Card,
  CardContent,
} from '../components/ui/card';

import PageHeader from '../components/PageHeader';
import DataGovFeaturePanel from '../components/DataGovFeaturePanel';
import { useLang } from '../lib/i18n';

const LOCAL_RESOURCES = [
  {
    name: 'Seeds',
    note:
      'Use verified local suppliers and confirm current price and stock before purchase.',
  },
  {
    name: 'Fertilizer',
    note:
      'Confirm current availability, product registration and price with the seller.',
  },
  {
    name: 'Pesticide',
    note:
      'Use only registered products and follow the product label.',
  },
  {
    name: 'Farm Equipment',
    note:
      'Contact local vendors for current rental or sale availability.',
  },
];

export default function ResourceMarketplace() {
  const { t } = useLang();
  const [resources, setResources] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    getDataGovResources()
      .then((result) => {
        const list = Array.isArray(result?.resources)
          ? result.resources
          : Array.isArray(result)
            ? result
            : [];

        setResources(list);
      })
      .catch(() => {
        setResources([]);
      });
  }, []);

  const marketplaceResources = useMemo(
    () =>
      resources.filter(
        (resource) =>
          resource.primary_feature === 'Marketplace' ||
          (resource.secondary_features || []).includes(
            'Marketplace'
          )
      ),
    [resources]
  );

  const filtered = LOCAL_RESOURCES.filter(
    (item) =>
      `${item.name} ${item.note}`
        .toLowerCase()
        .includes(query.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title={t('resourceMarketplaceTitle')}
        icon={Store}
      />

      <p className="text-xs text-gray-500 mb-3">
        Farmer resource directory. This page does not
        claim live seller prices or stock.
      </p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search resources…"
        className="w-full px-4 py-2 border rounded-xl mb-3"
      />

      <div className="space-y-2 mb-4">
        {filtered.map((item) => (
          <Card key={item.name}>
            <CardContent className="pt-3">
              <p className="font-medium text-sm">
                {item.name}
              </p>

              <p className="text-xs text-gray-500">
                {item.note}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-blue-100 bg-blue-50">
        <CardContent className="pt-4">

          <p className="font-semibold text-sm flex items-center gap-1">
            <Database className="h-4 w-4" />
            Data.gov marketplace sources
          </p>

          <p className="text-xs text-gray-600 mt-1">
            {marketplaceResources.length} registered
            source
            {marketplaceResources.length === 1 ? '' : 's'}
            mapped to Marketplace.
          </p>

          <div className="mt-2 space-y-1">
            {marketplaceResources.map((resource) => (
              <div
                key={resource.resource_key}
                className="text-xs"
              >
                <span className="font-medium">
                  {resource.resource_key}
                </span>

                {' · '}

                {resource.temporal_status ===
                'HISTORICAL' ? (
                  <span className="text-amber-700">
                    <Clock3 className="inline h-3 w-3" />
                    {' '}
                    historical
                  </span>
                ) : (
                  <span>
                    {resource.temporal_status?.toLowerCase()}
                  </span>
                )}
              </div>
            ))}
          </div>

        </CardContent>
      </Card>
      <DataGovFeaturePanel feature="Marketplace" />
    </div>
  );
}
