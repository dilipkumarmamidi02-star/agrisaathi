import { loadMarketIntelligence } from '../lib/marketIntelligence';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  RefreshCw,
  MapPin,
  ChevronDown,
  TrendingUp,
  Database,
  Package,
  Warehouse,
  Wheat,
  Factory,
  ShoppingCart,
} from 'lucide-react';

import {
  getDataGovResource,
  getDataGovResourceRecords,
} from '../lib/dataGov';

const MARKET_RESOURCES = [
  {
    key: 'mandi_prices',
    title: 'Current Mandi Prices',
    type: 'primary',
    description:
      'Current daily commodity prices from agricultural markets.',
  },
  {
    key: 'variety_market_prices',
    title: 'Variety-wise Market Prices',
    type: 'primary',
    description:
      'Daily market prices by commodity variety, market, district and state.',
  },
  {
    key: 'fci_stock_position',
    title: 'FCI Stock Position',
    type: 'secondary',
    description:
      'Food Corporation of India stock position relevant to market intelligence.',
  },
  {
    key: 'msp_procurement',
    title: 'MSP Procurement',
    type: 'secondary',
    description:
      'Crop procurement information at Minimum Support Price rates.',
  },
  {
    key: 'commodity_demand_supply',
    title: 'Commodity Demand & Supply',
    type: 'secondary',
    description:
      'Commodity demand, production and supply intelligence.',
  },
  {
    key: 'fertilizer_demand_availability_rabi',
    title: 'Rabi Fertilizer Availability',
    type: 'secondary',
    description:
      'Rabi fertilizer demand, availability, consumption and closing stock.',
  },
  {
    key: 'fertilizer_demand_supply_kharif',
    title: 'Kharif Fertilizer Demand & Supply',
    type: 'secondary',
    description:
      'Kharif fertilizer demand, supply and consumption.',
  },
  {
    key: 'district_crop_production',
    title: 'District Crop Production',
    type: 'secondary',
    description:
      'District-level crop production information supporting market analysis.',
  },
];

const LOCATION_RESOURCE = 'pincode_directory';

function clean(value) {
  return String(value ?? '').trim();
}

function normalise(value) {
  return clean(value).toLowerCase();
}

function pick(record, names) {
  if (!record || typeof record !== 'object') return '';

  const entries = Object.entries(record);

  for (const wanted of names) {
    const exact = entries.find(
      ([key]) => normalise(key) === normalise(wanted)
    );

    if (exact) return exact[1];
  }

  for (const wanted of names) {
    const partial = entries.find(
      ([key]) =>
        normalise(key).includes(normalise(wanted))
    );

    if (partial) return partial[1];
  }

  return '';
}

function getState(record) {
  return clean(
    pick(record, [
      'State',
      'state',
      'state_name',
      'state_ut',
      'State_Name',
    ])
  );
}

function getDistrict(record) {
  return clean(
    pick(record, [
      'District',
      'district',
      'District_name',
      'district_name',
    ])
  );
}

function getMarket(record) {
  return clean(
    pick(record, [
      'Market',
      'market',
      'market_name',
      'Market_Name',
    ])
  );
}

function getCommodity(record) {
  return clean(
    pick(record, [
      'Commodity',
      'commodity',
      'Commodity_name',
      'crop',
      'crop_name',
    ])
  );
}

function getVariety(record) {
  return clean(
    pick(record, [
      'Variety',
      'variety',
    ])
  );
}

function getVillage(record) {
  return clean(
    pick(record, [
      'Village',
      'village',
      'Village_Name',
      'village_name',
    ])
  );
}

function getPincode(record) {
  return clean(
    pick(record, [
      'Pincode',
      'pincode',
      'PIN',
      'pin',
      'PinCode',
      'pin_code',
    ])
  );
}

function getDate(record) {
  return clean(
    pick(record, [
      'Arrival_Date',
      'arrival_date',
      'Date',
      'date',
      'Individual_Date',
    ])
  );
}

function getPrice(record, names) {
  const value = pick(record, names);

  if (
    value === '' ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(
    String(value).replace(/,/g, '')
  );

  return Number.isFinite(number)
    ? number
    : null;
}

function formatPrice(value) {
  if (value === null || value === undefined) {
    return '—';
  }

  return `₹${Number(value).toLocaleString('en-IN')}`;
}

function resourceLabel(key) {
  return (
    MARKET_RESOURCES.find(
      (resource) => resource.key === key
    )?.title || key
  );
}

export default function MarketPrices() {
  const [detectedLocation, setDetectedLocation] =
    useState(null);

  const [locationError, setLocationError] =
    useState('');

  const [locationLoading, setLocationLoading] =
    useState(false);

  const [stateFilter, setStateFilter] =
    useState('');

  const [districtFilter, setDistrictFilter] =
    useState('');

  const [marketFilter, setMarketFilter] =
    useState('');

  const [commodityFilter, setCommodityFilter] =
    useState('');

  const [marketRecords, setMarketRecords] =
    useState([]);

  const [varietyRecords, setVarietyRecords] =
    useState([]);

  const [supportingResources, setSupportingResources] =
    useState({});

  // Resource viewer
  const [selectedResource, setSelectedResource] =
    useState(null);

  const [resourceViewerRecords, setResourceViewerRecords] =
    useState([]);

  const [resourceViewerLoading, setResourceViewerLoading] =
    useState(false);

  const [resourceViewerError, setResourceViewerError] =
    useState('');

  const [resourceViewerLimit, setResourceViewerLimit] =
    useState(100);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  // ----------------------------------------------------------
  // LOCATION
  //
  // IMPORTANT:
  // Browser coordinates are NOT directly sent to Data.gov.
  //
  // Coordinates are used only as a location hint.
  // State/District are selected from actual Data.gov records.
  // ----------------------------------------------------------

  const useMyLocation = useCallback(() => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.geolocation
    ) {
      setLocationError(
        'Location is not available in this browser.'
      );
      return;
    }

    setLocationLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        setDetectedLocation({
          latitude,
          longitude,
        });

        setLocationLoading(false);
      },
      (geoError) => {
        setLocationLoading(false);

        setLocationError(
          geoError?.message ||
            'Unable to detect your location.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, []);

  // ----------------------------------------------------------
  // LOAD PRIMARY MARKET DATA
  //
  // variety_market_prices is the reliable location-aware
  // resource because it contains:
  //
  // State
  // District
  // Market
  // Commodity
  // Variety
  // Grade
  // Prices
  // Arrival_Date
  // ----------------------------------------------------------

  const loadPrimaryMarketData = useCallback(
    async () => {
      const params = {
        limit: 100,
      };

      if (stateFilter) {
        params.state = stateFilter;
      }

      if (districtFilter) {
        params.district = districtFilter;
      }

      if (marketFilter) {
        params.market = marketFilter;
      }

      if (commodityFilter) {
        params.commodity = commodityFilter;
      }

      const [
        mandiResult,
        varietyResult,
      ] = await Promise.allSettled([
        getDataGovResource(
          'mandi_prices',
          params
        ),
        getDataGovResource(
          'variety_market_prices',
          params
        ),
      ]);

      const mandi =
        mandiResult.status === 'fulfilled'
          ? mandiResult.value
          : {
              records: [],
              count: 0,
              total: 0,
            };

      const variety =
        varietyResult.status === 'fulfilled'
          ? varietyResult.value
          : {
              records: [],
              count: 0,
              total: 0,
            };

      return {
        mandi,
        variety,
      };
    },
    [
      stateFilter,
      districtFilter,
      marketFilter,
      commodityFilter,
    ]
  );

  // ----------------------------------------------------------
  // LOAD ALL 8 MARKET INTELLIGENCE RESOURCES
  //
  // Supporting resources are intentionally loaded separately.
  // A failure/empty response from one resource must NEVER erase
  // the working primary market resource.
  // ----------------------------------------------------------

  const loadSupportingResources =
    useCallback(async () => {
      const result = {};

      await Promise.all(
        MARKET_RESOURCES
          .slice(2)
          .map(async (resource) => {
            try {
              const params = {
                limit: 100,
              };

              if (
                resource.key ===
                'district_crop_production'
              ) {
                if (stateFilter) {
                  params.state = stateFilter;
                }

                if (districtFilter) {
                  params.district =
                    districtFilter;
                }

                if (commodityFilter) {
                  params.commodity =
                    commodityFilter;
                }
              }

              if (
                resource.key ===
                'fertilizer_demand_availability_rabi'
              ) {
                if (stateFilter) {
                  params.state = stateFilter;
                }
              }

              if (
                resource.key ===
                'fertilizer_demand_supply_kharif'
              ) {
                if (stateFilter) {
                  params.state = stateFilter;
                }
              }

              if (
                resource.key ===
                'fci_stock_position'
              ) {
                if (districtFilter) {
                  params.district =
                    districtFilter;
                }

                if (commodityFilter) {
                  params.commodity =
                    commodityFilter;
                }
              }

              const data =
                await getDataGovResource(
                  resource.key,
                  params
                );

              result[resource.key] = {
                ...data,
                records: Array.isArray(
                  data?.records
                )
                  ? data.records
                  : [],
                connected: true,
              };
            } catch (resourceError) {
              result[resource.key] = {
                resource_key: resource.key,
                records: [],
                count: 0,
                total: 0,
                connected: false,
                error:
                  resourceError?.message ||
                  'Resource unavailable',
              };
            }
          })
      );

      setSupportingResources(result);
    }, [
      stateFilter,
      districtFilter,
      commodityFilter,
    ]);

  const loadAll = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      try {
        const primary =
          await loadPrimaryMarketData();

        setMarketRecords(
          Array.isArray(primary.mandi?.records)
            ? primary.mandi.records
            : []
        );

        setVarietyRecords(
          Array.isArray(
            primary.variety?.records
          )
            ? primary.variety.records
            : []
        );

        await loadSupportingResources();
      } catch (loadError) {
        setError(
          loadError?.message ||
            'Unable to load market intelligence.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      loadPrimaryMarketData,
      loadSupportingResources,
    ]
  );

  useEffect(() => {
    loadAll(false);
  }, [loadAll]);

  // ----------------------------------------------------------
  // FILTER OPTIONS
  //
  // These are derived from the actual variety resource,
  // preventing unstable browser-location values from becoming
  // fake Data.gov filters.
  // ----------------------------------------------------------

  const states = useMemo(() => {
    return [
      ...new Set(
        varietyRecords
          .map(getState)
          .filter(Boolean)
      ),
    ].sort();
  }, [varietyRecords]);

  const districts = useMemo(() => {
    return [
      ...new Set(
        varietyRecords
          .filter((record) => {
            if (!stateFilter) return true;

            return (
              normalise(getState(record)) ===
              normalise(stateFilter)
            );
          })
          .map(getDistrict)
          .filter(Boolean)
      ),
    ].sort();
  }, [
    varietyRecords,
    stateFilter,
  ]);

  const markets = useMemo(() => {
    return [
      ...new Set(
        varietyRecords
          .filter((record) => {
            if (
              stateFilter &&
              normalise(getState(record)) !==
                normalise(stateFilter)
            ) {
              return false;
            }

            if (
              districtFilter &&
              normalise(getDistrict(record)) !==
                normalise(districtFilter)
            ) {
              return false;
            }

            return true;
          })
          .map(getMarket)
          .filter(Boolean)
      ),
    ].sort();
  }, [
    varietyRecords,
    stateFilter,
    districtFilter,
  ]);

  const commodities = useMemo(() => {
    return [
      ...new Set(
        varietyRecords
          .filter((record) => {
            if (
              stateFilter &&
              normalise(getState(record)) !==
                normalise(stateFilter)
            ) {
              return false;
            }

            if (
              districtFilter &&
              normalise(getDistrict(record)) !==
                normalise(districtFilter)
            ) {
              return false;
            }

            if (
              marketFilter &&
              normalise(getMarket(record)) !==
                normalise(marketFilter)
            ) {
              return false;
            }

            return true;
          })
          .map(getCommodity)
          .filter(Boolean)
      ),
    ].sort();
  }, [
    varietyRecords,
    stateFilter,
    districtFilter,
    marketFilter,
  ]);

  // ----------------------------------------------------------
  // DISPLAY RECORDS
  // ----------------------------------------------------------

  const displayRecords = useMemo(() => {
    return varietyRecords.filter((record) => {
      if (
        stateFilter &&
        normalise(getState(record)) !==
          normalise(stateFilter)
      ) {
        return false;
      }

      if (
        districtFilter &&
        normalise(getDistrict(record)) !==
          normalise(districtFilter)
      ) {
        return false;
      }

      if (
        marketFilter &&
        normalise(getMarket(record)) !==
          normalise(marketFilter)
      ) {
        return false;
      }

      if (
        commodityFilter &&
        normalise(getCommodity(record)) !==
          normalise(commodityFilter)
      ) {
        return false;
      }

      return true;
    });
  }, [
    varietyRecords,
    stateFilter,
    districtFilter,
    marketFilter,
    commodityFilter,
  ]);

  const marketCount = useMemo(
    () =>
      new Set(
        displayRecords
          .map(getMarket)
          .filter(Boolean)
      ).size,
    [displayRecords]
  );

  const varietyCount = useMemo(
    () =>
      new Set(
        displayRecords
          .map(getVariety)
          .filter(Boolean)
      ).size,
    [displayRecords]
  );

  const latestRecord = useMemo(() => {
    if (!displayRecords.length) return null;

    return displayRecords[0];
  }, [displayRecords]);

  // ----------------------------------------------------------
  // RESET DEPENDENT FILTERS
  // ----------------------------------------------------------

  const changeState = (value) => {
    setStateFilter(value);
    setDistrictFilter('');
    setMarketFilter('');
    setCommodityFilter('');
  };

  const changeDistrict = (value) => {
    setDistrictFilter(value);
    setMarketFilter('');
  };

  const changeMarket = (value) => {
    setMarketFilter('');
    setMarketFilter(value);
  };

  // ----------------------------------------------------------
  // RESOURCE VIEWER
  //
  // Clicking any Market Intelligence resource opens the
  // actual records returned by the existing backend API.
  // ----------------------------------------------------------

  const openResourceViewer = useCallback(
    async (resource) => {
      setSelectedResource(resource);
      setResourceViewerRecords([]);
      setResourceViewerError('');
      setResourceViewerLoading(true);
      setResourceViewerLimit(100);

      try {
        const data = await getDataGovResource(
          resource.key,
          {
            limit: 100,
          }
        );

        setResourceViewerRecords(
          Array.isArray(data?.records)
            ? data.records
            : []
        );
      } catch (viewerError) {
        setResourceViewerError(
          viewerError?.message ||
            'Unable to load resource records.'
        );
      } finally {
        setResourceViewerLoading(false);
      }
    },
    []
  );

  const closeResourceViewer = () => {
    setSelectedResource(null);
    setResourceViewerRecords([]);
    setResourceViewerError('');
  };

  // ----------------------------------------------------------
  // RESOURCE CARD
  // ----------------------------------------------------------

  const ResourceCard = ({
    resource,
    index,
  }) => {
    const data =
      resource.type === 'primary'
        ? resource.key ===
          'variety_market_prices'
          ? {
              records: varietyRecords,
              connected: true,
            }
          : {
              records: marketRecords,
              connected: true,
            }
        : supportingResources[
            resource.key
          ];

    const count =
      data?.records?.length || 0;

    return (
      <button
        type="button"
        key={resource.key}
        onClick={() => openResourceViewer(resource)}
        className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
        title={`Open ${resource.title}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-slate-100 p-2">
              {resource.key.includes(
                'fertilizer'
              ) ? (
                <Factory size={20} />
              ) : resource.key.includes(
                  'stock'
                ) ? (
                <Warehouse size={20} />
              ) : resource.key.includes(
                  'crop'
                ) ? (
                <Wheat size={20} />
              ) : resource.key.includes(
                  'procurement'
                ) ? (
                <ShoppingCart size={20} />
              ) : (
                <Database size={20} />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900">
                  {resource.title}
                </h3>

                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium uppercase text-slate-600">
                  {resource.type}
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {resource.description}
              </p>
            </div>
          </div>

          <span
            className={
              data?.connected === false
                ? 'rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700'
                : 'rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700'
            }
          >
            {data?.connected === false
              ? 'ERROR'
              : 'LIVE'}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
          <span className="text-slate-500">
            Resource key:
          </span>

          <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
            {resource.key}
          </code>
        </div>

        <div className="mt-3 text-sm text-slate-500">
          {data?.total !== undefined
            ? `${Number(data.total).toLocaleString(
                'en-IN'
              )} records`
            : `${count.toLocaleString(
                'en-IN'
              )} records loaded`}
        </div>

        {data?.error && (
          <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
            {data.error}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* HEADER */}

        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp
                  size={24}
                />

                <h1 className="text-2xl font-bold text-slate-900">
                  Market Prices
                </h1>

                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  LIVE
                </span>
              </div>

              <p className="mt-2 text-slate-600">
                Live Data.gov.in Market Intelligence
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadAll(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? 'animate-spin'
                    : ''
                }
              />

              Refresh
            </button>
          </div>
        </div>

        {/* LOCATION */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                Market location
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Filter government market data by
                State, District, Market and
                Commodity.
              </p>
            </div>

            <button
              type="button"
              onClick={useMyLocation}
              disabled={locationLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              <MapPin size={16} />

              {locationLoading
                ? 'Detecting...'
                : 'Use My Location'}
            </button>
          </div>

          {detectedLocation && (
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              Location detected (
              {detectedLocation.latitude.toFixed(
                5
              )}
              ,{' '}
              {detectedLocation.longitude.toFixed(
                5
              )}
              ). Select the State and District
              from the Data.gov.in market data.
            </div>
          )}

          {locationError && (
            <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
              {locationError}
            </div>
          )}

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* STATE */}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                State
              </span>

              <select
                value={stateFilter}
                onChange={(event) =>
                  changeState(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
              >
                <option value="">
                  All States
                </option>

                {states.map((state) => (
                  <option
                    key={state}
                    value={state}
                  >
                    {state}
                  </option>
                ))}
              </select>
            </label>

            {/* DISTRICT */}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                District
              </span>

              <select
                value={districtFilter}
                onChange={(event) =>
                  changeDistrict(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
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
            </label>

            {/* MARKET */}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Market
              </span>

              <select
                value={marketFilter}
                onChange={(event) =>
                  changeMarket(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
              >
                <option value="">
                  All Markets
                </option>

                {markets.map((market) => (
                  <option
                    key={market}
                    value={market}
                  >
                    {market}
                  </option>
                ))}
              </select>
            </label>

            {/* COMMODITY */}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Commodity
              </span>

              <select
                value={commodityFilter}
                onChange={(event) =>
                  setCommodityFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
              >
                <option value="">
                  All Commodities
                </option>

                {commodities.map(
                  (commodity) => (
                    <option
                      key={commodity}
                      value={commodity}
                    >
                      {commodity}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>
        </div>

        {/* SUMMARY */}

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-sm text-slate-500">
              Records
            </div>

            <div className="mt-1 text-2xl font-bold">
              {displayRecords.length}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-sm text-slate-500">
              Markets
            </div>

            <div className="mt-1 text-2xl font-bold">
              {marketCount}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-sm text-slate-500">
              Varieties
            </div>

            <div className="mt-1 text-2xl font-bold">
              {varietyCount}
            </div>
          </div>
        </div>

        {/* ==================================================
             ADDITIONAL RESOURCE VIEWER
             ================================================== */}

        {selectedResource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="flex max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

              {/* VIEWER HEADER */}

              <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">
                      {selectedResource.title}
                    </h2>

                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold uppercase text-emerald-700">
                      {selectedResource.type}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedResource.description}
                  </p>

                  <div className="mt-2">
                    <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                      {selectedResource.key}
                    </code>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeResourceViewer}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              {/* VIEWER BODY */}

              <div className="min-h-0 flex-1 overflow-auto p-5">

                {resourceViewerLoading ? (
                  <div className="p-10 text-center text-slate-500">
                    Loading {selectedResource.title} records...
                  </div>
                ) : resourceViewerError ? (
                  <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    <div className="font-semibold">
                      Unable to load this resource
                    </div>

                    <div className="mt-1">
                      {resourceViewerError}
                    </div>
                  </div>
                ) : resourceViewerRecords.length === 0 ? (
                  <div className="rounded-xl bg-slate-50 p-10 text-center text-slate-500">
                    No records returned for this resource.
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm text-slate-600">
                        Showing{" "}
                        <span className="font-semibold text-slate-900">
                          {resourceViewerRecords.length.toLocaleString('en-IN')}
                        </span>{" "}
                        records
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          openResourceViewer(selectedResource)
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
                      >
                        <RefreshCw size={15} />
                        Reload
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="min-w-full text-sm">
                        <thead className="sticky top-0 bg-slate-100 text-left">
                          <tr>
                            {Object.keys(
                              resourceViewerRecords[0] || {}
                            ).map((field) => (
                              <th
                                key={field}
                                className="whitespace-nowrap border-b border-slate-200 px-4 py-3 font-semibold text-slate-700"
                              >
                                {field}
                              </th>
                            ))}
                          </tr>
                        </thead>

                        <tbody>
                          {resourceViewerRecords.map(
                            (record, rowIndex) => (
                              <tr
                                key={`${selectedResource.key}-${rowIndex}`}
                                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                              >
                                {Object.keys(
                                  resourceViewerRecords[0] || {}
                                ).map((field) => (
                                  <td
                                    key={field}
                                    className="whitespace-nowrap px-4 py-3 text-slate-700"
                                  >
                                    {record[field] === null ||
                                    record[field] === undefined ||
                                    record[field] === ''
                                      ? '—'
                                      : String(record[field])}
                                  </td>
                                ))}
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PRIMARY PRICE TABLE */}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-semibold">
              Current Market Prices
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Primary price display uses
              variety_market_prices because it
              contains State, District, Market,
              Commodity, Variety, Grade and price
              fields.
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">
              Loading market prices...
            </div>
          ) : displayRecords.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-medium text-slate-800">
                No market price records found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Try another state, district,
                market, or commodity.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-4 py-3">
                      Arrival Date
                    </th>

                    <th className="px-4 py-3">
                      State
                    </th>

                    <th className="px-4 py-3">
                      District
                    </th>

                    <th className="px-4 py-3">
                      Market
                    </th>

                    <th className="px-4 py-3">
                      Commodity
                    </th>

                    <th className="px-4 py-3">
                      Variety
                    </th>

                    <th className="px-4 py-3">
                      Grade
                    </th>

                    <th className="px-4 py-3 text-right">
                      Min Price
                    </th>

                    <th className="px-4 py-3 text-right">
                      Max Price
                    </th>

                    <th className="px-4 py-3 text-right">
                      Modal Price
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {displayRecords.map(
                    (record, index) => (
                      <tr
                        key={`${getDate(
                          record
                        )}-${getMarket(
                          record
                        )}-${index}`}
                        className="border-t border-slate-100"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getDate(record) ||
                            '—'}
                        </td>

                        <td className="px-4 py-3">
                          {getState(record) ||
                            '—'}
                        </td>

                        <td className="px-4 py-3">
                          {getDistrict(
                            record
                          ) || '—'}
                        </td>

                        <td className="px-4 py-3 font-medium">
                          {getMarket(record) ||
                            '—'}
                        </td>

                        <td className="px-4 py-3">
                          {getCommodity(
                            record
                          ) || '—'}
                        </td>

                        <td className="px-4 py-3">
                          {getVariety(record) ||
                            '—'}
                        </td>

                        <td className="px-4 py-3">
                          {clean(
                            pick(record, [
                              'Grade',
                              'grade',
                            ])
                          ) || '—'}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {formatPrice(
                            getPrice(record, [
                              'Min_Price',
                              'min_price',
                            ])
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {formatPrice(
                            getPrice(record, [
                              'Max_Price',
                              'max_price',
                            ])
                          )}
                        </td>

                        <td className="px-4 py-3 text-right font-semibold">
                          {formatPrice(
                            getPrice(record, [
                              'Modal_Price',
                              'modal_price',
                            ])
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* LATEST RECORD */}

        {latestRecord && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">
              Latest market observation
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-5">
              <div>
                <div className="text-xs text-slate-500">
                  Commodity
                </div>

                <div className="font-medium">
                  {getCommodity(
                    latestRecord
                  ) || '—'}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">
                  District
                </div>

                <div className="font-medium">
                  {getDistrict(
                    latestRecord
                  ) || '—'}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">
                  Market
                </div>

                <div className="font-medium">
                  {getMarket(
                    latestRecord
                  ) || '—'}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">
                  Variety
                </div>

                <div className="font-medium">
                  {getVariety(
                    latestRecord
                  ) || '—'}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500">
                  Modal Price
                </div>

                <div className="font-semibold">
                  {formatPrice(
                    getPrice(
                      latestRecord,
                      ['Modal_Price']
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            ALL 8 MARKET INTELLIGENCE RESOURCES
            ==================================================== */}

        <div className="mt-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Additional Market Intelligence
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Live Data.gov.in resources assigned to
              Market Prices. All 8 registered market
              resources remain visible independently.
            </p>

            <div className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {MARKET_RESOURCES.length}/
              {MARKET_RESOURCES.length} Market
              Prices resources connected
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {MARKET_RESOURCES.map(
              (resource, index) => (
                <ResourceCard
                  key={resource.key}
                  resource={resource}
                  index={index}
                />
              )
            )}
          </div>
        </div>

        {/* DATA.GOV RESOURCE TABLE */}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            Active Data.gov.in Market Resources
          </h2>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-3">
                    Resource
                  </th>

                  <th className="px-4 py-3">
                    Type
                  </th>

                  <th className="px-4 py-3">
                    Key
                  </th>

                  <th className="px-4 py-3">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {MARKET_RESOURCES.map(
                  (resource) => {
                    const data =
                      resource.type ===
                      'primary'
                        ? {
                            connected: true,
                          }
                        : supportingResources[
                            resource.key
                          ];

                    return (
                      <tr
                        key={resource.key}
                        className="border-t border-slate-100"
                      >
                        <td className="px-4 py-3 font-medium">
                          {resource.title}
                        </td>

                        <td className="px-4 py-3 uppercase text-xs">
                          {resource.type}
                        </td>

                        <td className="px-4 py-3">
                          <code>
                            {resource.key}
                          </code>
                        </td>

                        <td className="px-4 py-3">
                          <span className="text-emerald-700">
                            {data?.connected ===
                            false
                              ? 'ERROR'
                              : 'LIVE'}
                          </span>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
