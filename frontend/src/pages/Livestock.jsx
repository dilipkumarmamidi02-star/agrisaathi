import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  RefreshCw,
  MapPin,
  Search,
  Database,
  Beef,
  Bird,
  CircleDot,
  ChevronDown,
} from 'lucide-react';

import {
  getDataGovResource,
} from '../lib/dataGov';

/*
 * ============================================================
 * AgriSaathi - Livestock Census
 * ============================================================
 *
 * The Data.gov.in registry is authoritative.
 *
 * This page discovers every registered resource whose
 * resource_key starts with:
 *
 *   livestock_census_
 *
 * This means the page supports all State / Union Territory
 * livestock census resources without hard-coding Andhra Pradesh.
 *
 * The frontend registry does NOT need a default export.
 *
 * The namespace import below works with:
 *
 *   export const dataGovResources = [...]
 *
 *   export const resources = [...]
 *
 *   export default [...]
 *
 *   module-shaped exports
 *
 * ============================================================
 */

import * as dataGovRegistryModule from '../data/dataGovResources';
import { useLang } from '../lib/i18n';

const LIVESTOCK_KEY_PREFIX =
  'livestock_census_';

const LIVESTOCK_RESOURCE_IDS = new Set([
  'livestock_census_himachal_pradesh',
  'livestock_census_sikkim',
  'livestock_census_haryana',
  'livestock_census_rajasthan',
  'livestock_census_gujarat',
  'livestock_census_punjab',
  'livestock_census_goa',
  'livestock_census_puducherry',
  'livestock_census_daman_diu',
  'livestock_census_odisha',
  'livestock_census_dadra_nagar_haveli',
  'livestock_census_nagaland',
  'livestock_census_chhattisgarh',
  'livestock_census_mizoram',
  'livestock_census_meghalaya',
  'livestock_census_chandigarh',
  'livestock_census_manipur',
  'livestock_census_bihar',
  'livestock_census_maharashtra',
  'livestock_census_assam',
  'livestock_census_madhya_pradesh',
  'livestock_census_west_bengal',
  'livestock_census_arunachal_pradesh',
  'livestock_census_lakshadweep',
  'livestock_census_uttarakhand',
  'livestock_census_andhra_pradesh',
  'livestock_census_kerala',
  'livestock_census_uttar_pradesh',
  'livestock_census_andaman_nicobar',
  'livestock_census_karnataka',
  'livestock_census_tripura',
  'livestock_census_jharkhand',
  'livestock_census_telangana',
  'livestock_census_jammu_kashmir',
  'livestock_census_tamil_nadu',
]);

const ANIMAL_FIELDS = [
  {
    key: 'cattle',
    label: 'Cattle',
  },
  {
    key: 'buffalo',
    label: 'Buffalo',
  },
  {
    key: 'sheep',
    label: 'Sheep',
  },
  {
    key: 'goat',
    label: 'Goat',
  },
  {
    key: 'horse',
    label: 'Horse',
  },
  {
    key: 'pony',
    label: 'Pony',
  },
  {
    key: 'mule',
    label: 'Mule',
  },
  {
    key: 'donkey',
    label: 'Donkey',
  },
  {
    key: 'camel',
    label: 'Camel',
  },
  {
    key: 'pig',
    label: 'Pig',
  },
  {
    key: 'total_poultry',
    label: 'Poultry',
  },
];

function clean(value) {
  return String(value ?? '').trim();
}

function numberValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 0;
  }

  const number = Number(
    String(value)
      .replace(/,/g, '')
      .trim()
  );

  return Number.isFinite(number)
    ? number
    : 0;
}

function getSafeErrorMessage(error, fallback = 'Unable to load livestock census data.') {
  if (!error) {
    return fallback;
  }

  // Axios / backend response error.
  const responseData = error?.response?.data;

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData.trim();
  }

  if (responseData && typeof responseData === 'object') {
    const detail = responseData.detail;

    if (typeof detail === 'string' && detail.trim()) {
      return detail.trim();
    }

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (typeof item === 'string') {
            return item;
          }

          if (item && typeof item.msg === 'string') {
            const location = Array.isArray(item.loc)
              ? item.loc.join('.')
              : '';

            return location
              ? `${location}: ${item.msg}`
              : item.msg;
          }

          return '';
        })
        .filter(Boolean);

      if (messages.length > 0) {
        return messages.join(' | ');
      }
    }

    if (
      typeof responseData.message === 'string' &&
      responseData.message.trim()
    ) {
      return responseData.message.trim();
    }
  }

  if (
    typeof error?.message === 'string' &&
    error.message.trim()
  ) {
    return error.message.trim();
  }

  return fallback;
}

function formatNumber(value) {
  return numberValue(value).toLocaleString('en-IN');
}

function getDistrict(record) {
  return clean(
    record?.district_name ||
    record?.District ||
    record?.district
  );
}

function getState(record, resource) {
  return clean(
    record?.state_name ||
    record?.State ||
    record?.state ||
    resource?.state_name ||
    resource?.state ||
    ''
  );
}

function getAnimalValue(record, key) {
  return numberValue(
    record?.[key]
  );
}

function getTotalAnimals(record) {
  return ANIMAL_FIELDS
    .filter(
      (animal) =>
        animal.key !== 'total_poultry'
    )
    .reduce(
      (sum, animal) =>
        sum + getAnimalValue(
          record,
          animal.key
        ),
      0
    );
}

function getGrandTotal(records) {
  return records.reduce(
    (sum, record) =>
      sum + getTotalAnimals(record),
    0
  );
}

function getTotalForField(records, key) {
  return records.reduce(
    (sum, record) =>
      sum + getAnimalValue(
        record,
        key
      ),
    0
  );
}

function getLargestAnimal(record) {
  let best = null;

  for (const animal of ANIMAL_FIELDS) {
    const value = getAnimalValue(
      record,
      animal.key
    );

    if (!best || value > best.value) {
      best = {
        ...animal,
        value,
      };
    }
  }

  return best;
}

/*
 * Safely extract the actual registry array regardless of
 * how src/data/dataGovResources.js exports it.
 */
function getRegistryArray(module) {
  if (!module) {
    return [];
  }

  const candidates = [
    module.default,
    module.dataGovResources,
    module.resources,
    module.DATA_GOV_RESOURCES,
    module.registry,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (
      candidate &&
      Array.isArray(candidate.resources)
    ) {
      return candidate.resources;
    }

    if (
      candidate &&
      Array.isArray(candidate.data)
    ) {
      return candidate.data;
    }
  }

  /*
   * Last-resort support for a module where the registry
   * is exported under another named export.
   */
  for (const value of Object.values(module)) {
    if (Array.isArray(value)) {
      const hasRegistryObjects =
        value.some(
          (item) =>
            item &&
            typeof item === 'object' &&
            (
              item.resource_key ||
              item.resource_id
            )
        );

      if (hasRegistryObjects) {
        return value;
      }
    }
  }

  return [];
}

function normalizeStateName(resource) {
  const resourceKey =
    clean(resource?.resource_key);

  if (
    !resourceKey.startsWith(
      LIVESTOCK_KEY_PREFIX
    )
  ) {
    return '';
  }

  const suffix =
    resourceKey.slice(
      LIVESTOCK_KEY_PREFIX.length
    );

  const names = {
    himachal_pradesh:
      'Himachal Pradesh',
    sikkim:
      'Sikkim',
    haryana:
      'Haryana',
    rajasthan:
      'Rajasthan',
    gujarat:
      'Gujarat',
    punjab:
      'Punjab',
    goa:
      'Goa',
    puducherry:
      'Puducherry',
    daman_diu:
      'Daman and Diu',
    odisha:
      'Odisha',
    dadra_nagar_haveli:
      'Dadra and Nagar Haveli',
    nagaland:
      'Nagaland',
    chhattisgarh:
      'Chhattisgarh',
    mizoram:
      'Mizoram',
    meghalaya:
      'Meghalaya',
    chandigarh:
      'Chandigarh',
    manipur:
      'Manipur',
    bihar:
      'Bihar',
    maharashtra:
      'Maharashtra',
    assam:
      'Assam',
    madhya_pradesh:
      'Madhya Pradesh',
    west_bengal:
      'West Bengal',
    arunachal_pradesh:
      'Arunachal Pradesh',
    lakshadweep:
      'Lakshadweep',
    uttarakhand:
      'Uttarakhand',
    andhra_pradesh:
      'Andhra Pradesh',
    kerala:
      'Kerala',
    uttar_pradesh:
      'Uttar Pradesh',
    andaman_nicobar:
      'Andaman and Nicobar Islands',
    karnataka:
      'Karnataka',
    tripura:
      'Tripura',
    jharkhand:
      'Jharkhand',
    telangana:
      'Telangana',
    jammu_kashmir:
      'Jammu and Kashmir',
    tamil_nadu:
      'Tamil Nadu',
  };

  return (
    names[suffix] ||
    suffix
      .split('_')
      .map(
        (part) =>
          part.charAt(0).toUpperCase() +
          part.slice(1)
      )
      .join(' ')
  );
}

function getLivestockResources() {
  const registry =
    getRegistryArray(
      dataGovRegistryModule
    );

  const resources = registry.filter(
    (resource) => {
      const key =
        clean(resource?.resource_key);

      return (
        key.startsWith(
          LIVESTOCK_KEY_PREFIX
        ) ||
        LIVESTOCK_RESOURCE_IDS.has(key)
      );
    }
  );

  /*
   * Remove duplicates while preserving registry order.
   */
  const seen = new Set();

  return resources
    .filter((resource) => {
      const key =
        clean(resource?.resource_key);

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .map((resource) => ({
      ...resource,
      state_name:
        clean(resource?.state_name) ||
        normalizeStateName(resource),
    }))
    .sort((a, b) =>
      clean(a.state_name).localeCompare(
        clean(b.state_name)
      )
    );
}

export default function Livestock() {
  const { t } = useLang();
  const livestockResources =
    useMemo(
      () =>
        getLivestockResources(),
      []
    );

  const [selectedResourceKey, setSelectedResourceKey] =
    useState('');

  const [records, setRecords] =
    useState([]);

  const [total, setTotal] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [districtFilter, setDistrictFilter] =
    useState('');

  const [search, setSearch] =
    useState('');

  /*
   * Select the first State / UT automatically.
   */
  useEffect(() => {
    if (
      !selectedResourceKey &&
      livestockResources.length > 0
    ) {
      setSelectedResourceKey(
        livestockResources[0].resource_key
      );
    }
  }, [
    livestockResources,
    selectedResourceKey,
  ]);

  const selectedResource =
    useMemo(
      () =>
        livestockResources.find(
          (resource) =>
            resource.resource_key ===
            selectedResourceKey
        ) || null,
      [
        livestockResources,
        selectedResourceKey,
      ]
    );

  const loadLivestock = useCallback(
    async (isRefresh = false) => {
      if (!selectedResourceKey) {
        setRecords([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      try {
        const result =
          await getDataGovResource(
            selectedResourceKey,
            {
              limit: 100,
            }
          );

        const loadedRecords =
          Array.isArray(result?.records)
            ? result.records
            : [];

        setRecords(
          loadedRecords
        );

        setTotal(
          Number(result?.total) ||
          loadedRecords.length
        );

        setDistrictFilter('');
      } catch (loadError) {
        console.error(
          'Livestock resource error:',
          loadError
        );

        setError(
          loadError?.response?.data?.detail ||
          loadError?.message ||
          'Unable to load livestock census data.'
        );

        setRecords([]);
        setTotal(0);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedResourceKey]
  );

  useEffect(() => {
    loadLivestock(false);
  }, [loadLivestock]);

  const districts = useMemo(() => {
    return [
      ...new Set(
        records
          .map(getDistrict)
          .filter(Boolean)
      ),
    ].sort();
  }, [records]);

  const displayRecords = useMemo(() => {
    const query =
      clean(search).toLowerCase();

    return records.filter(
      (record) => {
        const district =
          getDistrict(record);

        if (
          districtFilter &&
          district.toLowerCase() !==
            districtFilter.toLowerCase()
        ) {
          return false;
        }

        if (
          query &&
          !district
            .toLowerCase()
            .includes(query)
        ) {
          return false;
        }

        return true;
      }
    );
  }, [
    records,
    districtFilter,
    search,
  ]);

  const totalCattle =
    useMemo(
      () =>
        getTotalForField(
          displayRecords,
          'cattle'
        ),
      [displayRecords]
    );

  const totalBuffalo =
    useMemo(
      () =>
        getTotalForField(
          displayRecords,
          'buffalo'
        ),
      [displayRecords]
    );

  const totalSheep =
    useMemo(
      () =>
        getTotalForField(
          displayRecords,
          'sheep'
        ),
      [displayRecords]
    );

  const totalGoat =
    useMemo(
      () =>
        getTotalForField(
          displayRecords,
          'goat'
        ),
      [displayRecords]
    );

  const totalPoultry =
    useMemo(
      () =>
        getTotalForField(
          displayRecords,
          'total_poultry'
        ),
      [displayRecords]
    );

  const grandTotal =
    useMemo(
      () =>
        getGrandTotal(
          displayRecords
        ),
      [displayRecords]
    );

  const stateName =
    selectedResource?.state_name ||
    'State / Union Territory';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Beef
              className="h-7 w-7"
              aria-hidden="true"
            />

            <h1 className="text-2xl font-bold">
              Livestock
            </h1>

            <span className="rounded-full border px-2 py-0.5 text-xs">
              LIVE
            </span>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Data.gov.in · 20th Livestock Census 2019
            district-wise livestock population across
            all available Indian States and Union Territories.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadLivestock(true)
          }
          disabled={
            loading ||
            refreshing ||
            !selectedResourceKey
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              refreshing
                ? 'animate-spin'
                : ''
            }`}
          />

          Refresh
        </button>
      </div>

      {/* Location selector */}
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <MapPin
            className="h-5 w-5"
            aria-hidden="true"
          />

          <div>
            <h2 className="font-semibold">
              Livestock Location
            </h2>

            <p className="text-sm text-muted-foreground">
              Select a State or Union Territory to load
              its official livestock census resource.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium">
              State / Union Territory
            </span>

            <div className="relative">
              <select
                value={
                  selectedResourceKey
                }
                onChange={(event) =>
                  setSelectedResourceKey(
                    event.target.value
                  )
                }
                className="w-full appearance-none rounded-lg border bg-background px-3 py-2.5 pr-10 text-sm"
              >
                <option value="">
                  Select a State or Union Territory
                </option>

                {livestockResources.map(
                  (resource) => (
                    <option
                      key={
                        resource.resource_key
                      }
                      value={
                        resource.resource_key
                      }
                    >
                      {resource.state_name ||
                        normalizeStateName(
                          resource
                        )}
                    </option>
                  )
                )}
              </select>

              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                aria-hidden="true"
              />
            </div>
          </label>

          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Database
                className="h-4 w-4"
                aria-hidden="true"
              />

              Census Resource
            </div>

            {selectedResource ? (
              <>
                <p className="mt-2 text-sm font-semibold">
                  {selectedResource.resource_name ||
                    `20th Livestock Census - ${stateName}`}
                </p>

                <p className="mt-1 break-all text-xs text-muted-foreground">
                  {selectedResource.resource_key}
                </p>

                {selectedResource.resource_id && (
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {selectedResource.resource_id}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Select a State / Union Territory
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          {livestockResources.length}{' '}
          livestock census resources available in the
          frontend Data.gov.in registry.
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-500/10 p-4 text-sm text-red-400">
          <strong>
            Livestock data error
          </strong>

          <p className="mt-1">
            {typeof error === 'string' ? error : getSafeErrorMessage(error)}
          </p>
        </div>
      )}

      {/* Summary */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <SummaryCard
          label={t('districts')}
          value={displayRecords.length}
        />

        <SummaryCard
          label={t('cattle')}
          value={formatNumber(totalCattle)}
        />

        <SummaryCard
          label={t('buffalo')}
          value={formatNumber(totalBuffalo)}
        />

        <SummaryCard
          label={t('sheep')}
          value={formatNumber(totalSheep)}
        />

        <SummaryCard
          label={t('goat')}
          value={formatNumber(totalGoat)}
        />

        <SummaryCard
          label={t('poultry')}
          value={formatNumber(totalPoultry)}
        />
      </section>

      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Total Livestock
        </p>

        <p className="mt-1 text-2xl font-bold">
          {formatNumber(grandTotal)}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Cattle + Buffalo + Sheep + Goat + Horse +
          Pony + Mule + Donkey + Camel + Pig
        </p>
      </div>

      {/* Filters */}
      <section className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium">
              District
            </span>

            <div className="relative">
              <select
                value={districtFilter}
                onChange={(event) =>
                  setDistrictFilter(
                    event.target.value
                  )
                }
                className="w-full appearance-none rounded-lg border bg-background px-3 py-2.5 pr-10 text-sm"
              >
                <option value="">
                  All Districts
                </option>

                {districts.map(
                  (district) => (
                    <option
                      key={district}
                      value={district}
                    >
                      {district}
                    </option>
                  )
                )}
              </select>

              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
                aria-hidden="true"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">
              Search District
            </span>

            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder={t('searchDistrict')}
                className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-3 text-sm"
              />
            </div>
          </label>
        </div>
      </section>

      {/* Table */}
      <section className="rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">
              Livestock Population
            </h2>

            <p className="text-sm text-muted-foreground">
              District-level population from the 20th
              Livestock Census 2019.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadLivestock(true)
            }
            disabled={
              loading ||
              refreshing ||
              !selectedResourceKey
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? 'animate-spin'
                  : ''
              }`}
            />

            Refresh Data
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading Data.gov.in livestock census data...
          </div>
        ) : displayRecords.length === 0 ? (
          <div className="p-8 text-center">
            <CircleDot
              className="mx-auto h-8 w-8 text-muted-foreground"
              aria-hidden="true"
            />

            <p className="mt-3 font-medium">
              No records found
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Try another State / Union Territory or
              clear the district search.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1250px] w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-semibold">
                    District
                  </th>

                  {ANIMAL_FIELDS.map(
                    (animal) => (
                      <th
                        key={animal.key}
                        className="px-4 py-3 text-right font-semibold"
                      >
                        {animal.label}
                      </th>
                    )
                  )}

                  <th className="px-4 py-3 text-right font-semibold">
                    Livestock Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {displayRecords.map(
                  (record, index) => {
                    const district =
                      getDistrict(
                        record
                      );

                    const largest =
                      getLargestAnimal(
                        record
                      );

                    return (
                      <tr
                        key={
                          record?.ref_district_id ||
                          record?.district_id ||
                          district ||
                          index
                        }
                        className="border-b last:border-0 hover:bg-muted/20"
                      >
                        <td className="px-4 py-3 font-medium">
                          {district ||
                            'Unknown District'}

                          {largest &&
                            largest.value > 0 && (
                              <div className="mt-0.5 text-[11px] text-muted-foreground">
                                Highest: {largest.label}
                              </div>
                            )}
                        </td>

                        {ANIMAL_FIELDS.map(
                          (animal) => (
                            <td
                              key={
                                animal.key
                              }
                              className="px-4 py-3 text-right tabular-nums"
                            >
                              {formatNumber(
                                record?.[
                                  animal.key
                                ]
                              )}
                            </td>
                          )
                        )}

                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          {formatNumber(
                            getTotalAnimals(
                              record
                            )
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t p-4 text-xs text-muted-foreground">
          Showing {displayRecords.length} of{' '}
          {records.length} records
          {total
            ? ` · API total: ${formatNumber(total)}`
            : ''}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Bird
          className="h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />

        <p className="text-sm text-muted-foreground">
          {label}
        </p>
      </div>

      <p className="mt-2 text-xl font-bold tabular-nums">
        {value}
      </p>
    </div>
  );
}
