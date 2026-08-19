import { useEffect, useState } from 'react';
import {
  getDataGovFeatureResources,
} from '../lib/dataGov';

function formatValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function ResourceCard({ resource }) {
  const [open, setOpen] = useState(false);

  const records = Array.isArray(resource.records)
    ? resource.records
    : [];

  const columns =
    records.length > 0
      ? Object.keys(records[0])
      : [];

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full p-4 text-left transition hover:bg-gray-50"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700">
                Resource #{resource.id}
              </span>

              {resource.runtime_status === 'LIVE' && (
                <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-700">
                  LIVE
                </span>
              )}

              {resource.runtime_status === 'ERROR' && (
                <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-semibold text-red-700">
                  API ERROR
                </span>
              )}
            </div>

            <h4 className="font-semibold text-gray-900">
              {resource.resource_name ||
                resource.name ||
                resource.resource_key}
            </h4>

            <p className="mt-1 text-xs text-gray-500">
              {resource.resource_key}
            </p>
          </div>

          <div className="whitespace-nowrap text-xs text-gray-500">
            {records.length} records
            <span className="ml-2">
              {open ? '▲' : '▼'}
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {resource.primary_feature && (
            <span className="rounded-full bg-green-50 px-2 py-1 text-[10px] text-green-700">
              Primary: {resource.primary_feature}
            </span>
          )}

          {Array.isArray(resource.secondary_features) &&
            resource.secondary_features.map(
              (feature) => (
                <span
                  key={feature}
                  className="rounded-full bg-blue-50 px-2 py-1 text-[10px] text-blue-700"
                >
                  {feature}
                </span>
              )
            )}

          {Array.isArray(resource.tertiary_features) &&
            resource.tertiary_features.map(
              (feature) => (
                <span
                  key={`tertiary-${feature}`}
                  className="rounded-full bg-purple-50 px-2 py-1 text-[10px] text-purple-700"
                >
                  {feature}
                </span>
              )
            )}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 p-4">
          {resource.error && (
            <div className="mb-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
              {resource.error}
            </div>
          )}

          {records.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
              No records returned by this resource.
            </div>
          ) : (
            <div className="max-h-[420px] overflow-auto">
              <table className="min-w-full text-xs">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="border-b border-gray-200">
                    {columns.map((column) => (
                      <th
                        key={column}
                        className="whitespace-nowrap px-3 py-2 text-left font-semibold text-gray-600"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {records.slice(0, 10).map(
                    (record, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="border-b border-gray-100"
                      >
                        {columns.map((column) => (
                          <td
                            key={column}
                            className="max-w-[280px] truncate whitespace-nowrap px-3 py-2 text-gray-700"
                            title={formatValue(record[column])}
                          >
                            {formatValue(record[column])}
                          </td>
                        ))}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function DataGovFeaturePanel({
  feature,
  compact = false,
}) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const data =
          await getDataGovFeatureResources(feature);

        if (!cancelled) {
          setResources(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.message ||
            'Unable to load Data.gov.in resources.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [feature]);

  if (loading) {
    return (
      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-56 rounded bg-gray-200" />
          <div className="h-3 w-80 rounded bg-gray-100" />
          <div className="h-20 rounded-xl bg-gray-100" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
        <h3 className="font-semibold text-red-800">
          Data.gov.in
        </h3>

        <p className="mt-1 text-sm text-red-700">
          {error}
        </p>
      </section>
    );
  }

  if (resources.length === 0) {
    return null;
  }

  const liveCount = resources.filter(
    (resource) =>
      resource.runtime_status === 'LIVE'
  ).length;

  return (
    <section className="mt-8 rounded-3xl border border-green-100 bg-green-50/40 p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
            Data.gov.in Live Data
          </p>

          <h3 className="mt-1 text-xl font-bold text-gray-900">
            {feature}
          </h3>

          <p className="mt-1 text-sm text-gray-600">
            Live government data connected to this AgriSaathi feature.
          </p>
        </div>

        <div className="rounded-xl border border-green-100 bg-white px-3 py-2 text-xs text-gray-600">
          {liveCount}/{resources.length} live
        </div>
      </div>

      <div className="grid gap-4">
        {resources.map((resource) => (
          <ResourceCard
            key={
              resource.resource_id ||
              resource.id ||
              resource.resource_key
            }
            resource={resource}
          />
        ))}
      </div>
    </section>
  );
}
