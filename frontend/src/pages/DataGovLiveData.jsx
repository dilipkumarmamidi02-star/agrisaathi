import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLang } from '../lib/i18n';
import {
  getDataGovResources,
  getDataGovResourceRecords,
} from '../lib/dataGov';

const ERROR_STATUS = 'API-ERROR';
const EMPTY_STATUS = 'LIVE-EMPTY';
const LIVE_STATUS = 'LIVE-DATA';

function getResourceKey(resource) {
  return (
    resource?.resource_key ??
    resource?.resourceKey ??
    resource?.key ??
    resource?.id ??
    ''
  );
}

function getResourceTitle(resource) {
  return (
    resource?.title ??
    resource?.name ??
    resource?.resource_name ??
    getResourceKey(resource)
  );
}

function getResourceDescription(resource) {
  return (
    resource?.description ??
    resource?.notes ??
    resource?.about ??
    ''
  );
}

function normalizeRecords(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.records)) {
    return response.records;
  }

  if (Array.isArray(response?.data?.records)) {
    return response.data.records;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

function getHttpStatus(error) {
  return (
    error?.status ??
    error?.response?.status ??
    error?.statusCode ??
    null
  );
}

function classifyError(error) {
  const status = getHttpStatus(error);

  return {
    status: ERROR_STATUS,
    httpStatus: status,
    message:
      error?.message ||
      error?.response?.data?.message ||
      'Data.gov resource is temporarily unavailable.',
  };
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') {
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

function ResourceCard({
  resource,
  result,
  selected,
  onSelect,
  onRetry,
}) {
  const key = getResourceKey(resource);
  const title = getResourceTitle(resource);

  const status = result?.status ?? 'NOT-LOADED';
  const count = result?.records?.length ?? 0;

  let badgeClass =
    'bg-surface-hover text-text-primary border-border';

  if (status === LIVE_STATUS) {
    badgeClass =
      'bg-mint/10 text-mint border-green-200';
  }

  if (status === EMPTY_STATUS) {
    badgeClass =
      'bg-amber-500/10 text-amber-400 border-yellow-200';
  }

  if (status === ERROR_STATUS) {
    badgeClass =
      'bg-red-500/10 text-red-400 border-red-200';
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(key)}
      className={[
        'w-full text-left rounded-xl border p-4 transition',
        'hover:shadow-sm',
        selected
          ? 'border-green-500 ring-2 ring-green-100'
          : 'border-border',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-text-primary break-words">
            {title}
          </h3>

          <p className="mt-1 text-xs text-text-secondary break-all">
            {key}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${badgeClass}`}
        >
          {status}
        </span>
      </div>

      <div className="mt-3 text-sm text-text-secondary">
        {status === LIVE_STATUS && (
          <span>{count} live records</span>
        )}

        {status === EMPTY_STATUS && (
          <span>API available — no records returned</span>
        )}

        {status === ERROR_STATUS && (
          <span>
            HTTP {result?.httpStatus ?? 'ERR'} — click to inspect
          </span>
        )}

        {status === 'NOT-LOADED' && (
          <span>Not loaded</span>
        )}
      </div>

      {status === ERROR_STATUS && (
        <div className="mt-3">
          <span
            onClick={(event) => {
              event.stopPropagation();
              onRetry(key);
            }}
            className="inline-flex rounded-lg border border-red-200 bg-surface px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10"
          >
            Retry
          </span>
        </div>
      )}
    </button>
  );
}

function ResourceTable({ records }) {
  const columns = useMemo(() => {
    const set = new Set();

    records.forEach((record) => {
      if (record && typeof record === 'object') {
        Object.keys(record).forEach((key) => set.add(key));
      }
    });

    return Array.from(set).slice(0, 30);
  }, [records]);

  if (!records.length) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-text-secondary">
        No records available for this resource.
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-xl border border-border bg-surface">
      <table className="min-w-full text-sm">
        <thead className="bg-surface-hover">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="whitespace-nowrap border-b px-4 py-3 text-left font-semibold text-text-primary"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {records.map((record, index) => (
            <tr
              key={record?.id ?? record?._id ?? index}
              className="border-b last:border-b-0 hover:bg-surface-hover"
            >
              {columns.map((column) => (
                <td
                  key={column}
                  className="max-w-[360px] px-4 py-3 align-top text-text-primary"
                >
                  {formatValue(record?.[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DataGovLiveData() {
  const [resources, setResources] = useState([]);
  const [results, setResults] = useState({});
  const [selectedKey, setSelectedKey] = useState('');
  const [loadingResources, setLoadingResources] = useState(true);
  const [loadingKey, setLoadingKey] = useState('');
  const [globalError, setGlobalError] = useState('');

  const loadResources = useCallback(async () => {
    setLoadingResources(true);
    setGlobalError('');

    try {
      const response = await getDataGovResources();

      const list = Array.isArray(response)
        ? response
        : Array.isArray(response?.resources)
          ? response.resources
          : Array.isArray(response?.data)
            ? response.data
            : [];

      setResources(list);

      if (!selectedKey && list.length) {
        setSelectedKey(getResourceKey(list[0]));
      }
    } catch (error) {
      console.error('Failed to load Data.gov resource registry:', error);

      setGlobalError(
        error?.message ||
          'Unable to load the Data.gov resource registry.'
      );
    } finally {
      setLoadingResources(false);
    }
  }, [selectedKey]);

  const loadResource = useCallback(async (key) => {
    if (!key) return;

    setLoadingKey(key);

    try {
      const response = await getDataGovResourceRecords(key);

      const records = normalizeRecords(response);

      setResults((previous) => ({
        ...previous,
        [key]: {
          status: records.length
            ? LIVE_STATUS
            : EMPTY_STATUS,
          records,
          httpStatus: 200,
        },
      }));
    } catch (error) {
      console.error(`Data.gov resource failed: ${key}`, error);

      const classified = classifyError(error);

      setResults((previous) => ({
        ...previous,
        [key]: {
          ...classified,
          records: [],
        },
      }));
    } finally {
      setLoadingKey('');
    }
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  useEffect(() => {
    if (selectedKey && !results[selectedKey]) {
      loadResource(selectedKey);
    }
  }, [selectedKey, results, loadResource]);

  const selectedResource = useMemo(
    () =>
      resources.find(
        (resource) => getResourceKey(resource) === selectedKey
      ),
    [resources, selectedKey]
  );

  const selectedResult = results[selectedKey];

  const summary = useMemo(() => {
    const values = Object.values(results);

    return {
      loaded: values.length,
      live: values.filter(
        (item) => item.status === LIVE_STATUS
      ).length,
      empty: values.filter(
        (item) => item.status === EMPTY_STATUS
      ).length,
      errors: values.filter(
        (item) => item.status === ERROR_STATUS
      ).length,
    };
  }, [results]);

  if (loadingResources) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-surface p-8 text-center">
          Loading Data.gov resources…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Data.gov Live Agriculture Data
        </h1>

        <p className="mt-1 text-sm text-text-secondary">
          Live resource registry and API data from Agrisaathi.
        </p>
      </div>

      {globalError && (
        <div className="rounded-xl border border-red-200 bg-red-500/10 p-4 text-sm text-red-400">
          {globalError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border bg-surface p-4">
          <div className="text-xs text-text-secondary">
            Registered
          </div>
          <div className="mt-1 text-2xl font-bold">
            {resources.length}
          </div>
        </div>

        <div className="rounded-xl border bg-surface p-4">
          <div className="text-xs text-text-secondary">
            Loaded
          </div>
          <div className="mt-1 text-2xl font-bold">
            {summary.loaded}
          </div>
        </div>

        <div className="rounded-xl border bg-surface p-4">
          <div className="text-xs text-text-secondary">
            Live data
          </div>
          <div className="mt-1 text-2xl font-bold text-mint">
            {summary.live}
          </div>
        </div>

        <div className="rounded-xl border bg-surface p-4">
          <div className="text-xs text-text-secondary">
            API errors
          </div>
          <div className="mt-1 text-2xl font-bold text-red-400">
            {summary.errors}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-text-primary">
              All registered resources
            </h2>

            <button
              type="button"
              onClick={loadResources}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-surface-hover"
            >
              Refresh registry
            </button>
          </div>

          <div className="max-h-[750px] space-y-3 overflow-auto pr-1">
            {resources.map((resource) => {
              const key = getResourceKey(resource);

              return (
                <ResourceCard
                  key={key}
                  resource={resource}
                  result={results[key]}
                  selected={selectedKey === key}
                  onSelect={setSelectedKey}
                  onRetry={loadResource}
                />
              );
            })}
          </div>
        </section>

        <section>
          {selectedResource ? (
            <div className="space-y-4">
              <div className="rounded-xl border bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">
                      {getResourceTitle(selectedResource)}
                    </h2>

                    <p className="mt-1 break-all text-xs text-text-secondary">
                      {selectedKey}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => loadResource(selectedKey)}
                    disabled={loadingKey === selectedKey}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {loadingKey === selectedKey
                      ? 'Loading…'
                      : 'Load live data'}
                  </button>
                </div>

                {getResourceDescription(selectedResource) && (
                  <p className="mt-4 text-sm text-text-secondary">
                    {getResourceDescription(selectedResource)}
                  </p>
                )}
              </div>

              {loadingKey === selectedKey && (
                <div className="rounded-xl border bg-surface p-8 text-center text-text-secondary">
                  Loading live Data.gov records…
                </div>
              )}

              {!loadingKey &&
                selectedResult?.status === LIVE_STATUS && (
                  <ResourceTable
                    records={selectedResult.records}
                  />
                )}

              {!loadingKey &&
                selectedResult?.status === EMPTY_STATUS && (
                  <div className="rounded-xl border border-yellow-200 bg-amber-500/10 p-6">
                    <h3 className="font-semibold text-yellow-900">
                      Resource available but currently empty
                    </h3>

                    <p className="mt-2 text-sm text-yellow-800">
                      The API responded successfully, but no records
                      were returned.
                    </p>
                  </div>
                )}

              {!loadingKey &&
                selectedResult?.status === ERROR_STATUS && (
                  <div className="rounded-xl border border-red-200 bg-red-500/10 p-6">
                    <h3 className="font-semibold text-red-900">
                      Data.gov API temporarily unavailable
                    </h3>

                    <p className="mt-2 text-sm text-red-800">
                      HTTP{' '}
                      {selectedResult.httpStatus ?? 'ERROR'}.
                      The resource remains registered and can be
                      retried without removing it from Agrisaathi.
                    </p>

                    <button
                      type="button"
                      onClick={() => loadResource(selectedKey)}
                      className="mt-4 rounded-lg border border-red-300 bg-surface px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-100"
                    >
                      Retry resource
                    </button>
                  </div>
                )}
            </div>
          ) : (
            <div className="rounded-xl border bg-surface p-8 text-center text-text-secondary">
              Select a Data.gov resource.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
