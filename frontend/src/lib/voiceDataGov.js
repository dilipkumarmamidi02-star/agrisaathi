import {
  getDataGovResource,
  getDataGovFeatureMetadata,
} from './dataGov';

/*
 * Data.gov bridge for Speak to AgriSaathi and Agri Helper.
 *
 * This layer does NOT replace the existing voice/helper system.
 * It only provides live government-data context when a request
 * needs it.
 */

const FEATURE_RESOURCE_MAP = {
  'Market Prices': [
    'mandi_prices',
    'variety_market_prices',
    'commodity_demand_supply',
    'msp_procurement',
  ],

  'Soil Passport': [
    'soil_moisture',
    'pattern_land_utilisation',
  ],

  Livestock: [
    'livestock_census',
    'livestock_population',
  ],

  Weather: [
    'weather',
  ],

  Crops: [
    'district_crop_production',
  ],

  Fertilizer: [
    'fertilizer_demand_availability_rabi',
    'fertilizer_demand_supply_kharif',
  ],

  'Government Schemes': [
    'pm_kisan',
    'pmfby',
  ],

  'Speak to AgriSaathi': [],

  'Agri Helper': [],
};

// Authority tier per resource_key: lower number = higher authority.
// Used only to break ties when the same feature pulls from multiple
// government resources that may disagree. This does NOT resolve
// conflicts automatically — see buildVoiceDataContext.
const RESOURCE_AUTHORITY_LEVEL = {
  mandi_prices: 1,
  variety_market_prices: 1,
  commodity_demand_supply: 2,
  msp_procurement: 1,
  soil_moisture: 2,
  pattern_land_utilisation: 2,
  livestock_census: 2,
  livestock_population: 2,
  weather: 1,
  district_crop_production: 2,
  fertilizer_demand_availability_rabi: 2,
  fertilizer_demand_supply_kharif: 2,
  pm_kisan: 1,
  pmfby: 1,
};


function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ''
    )
  );
}

/**
 * Load one resource safely.
 */
export async function loadVoiceDataGovResource(
  resourceKey,
  params = {},
) {
  try {
    const data = await getDataGovResource(
      resourceKey,
      {
        ...cleanParams(params),
        limit: 50,
      },
    );

    return {
      resource_key: resourceKey,
      records: Array.isArray(data?.records)
        ? data.records
        : [],
      count: Number(data?.count ?? 0),
      total: Number(data?.total ?? 0),
      live: true,
      error: null,
    };
  } catch (error) {
    return {
      resource_key: resourceKey,
      records: [],
      count: 0,
      total: 0,
      live: false,
      error:
        error?.response?.data?.detail ||
        error?.message ||
        'Resource unavailable',
    };
  }
}

/**
 * Load all resources associated with an AgriSaathi feature.
 *
 * Registry metadata remains authoritative. The hard-coded map is
 * only a fast fallback for known high-value voice/helper intents.
 */
export async function loadVoiceFeatureData(
  feature,
  params = {},
) {
  const explicitKeys =
    FEATURE_RESOURCE_MAP[feature] || [];

  let metadataKeys = [];

  try {
    const metadata = await getDataGovFeatureMetadata(feature);

    metadataKeys = (Array.isArray(metadata) ? metadata : [])
      .map((item) => item?.resource_key)
      .filter(Boolean);
  } catch {
    // Registry metadata unavailable; explicit fallback keys remain usable.
  }

  const resourceKeys = [
    ...new Set([
      ...explicitKeys,
      ...metadataKeys,
    ]),
  ];

  if (!resourceKeys.length) {
    return [];
  }

  const results = await Promise.all(
    resourceKeys.map((resourceKey) =>
      loadVoiceDataGovResource(
        resourceKey,
        params,
      ),
    ),
  );

  return results.filter(
    (item) =>
      item.live ||
      item.records.length > 0,
  );
}

/**
 * Convert live records into compact context suitable for
 * the existing helper backend / answer layer.
 */
export function buildVoiceDataContext(
  resources = [],
) {
  return resources
    .filter(
      (resource) =>
        resource &&
        Array.isArray(resource.records) &&
        resource.records.length,
    )
    .map((resource) => ({
      resource_key:
        resource.resource_key,

      count:
        resource.count,

      records:
        resource.records.slice(0, 20),
    }));
}

/**
 * Detect the feature most likely relevant to a farmer's question.
 *
 * This is intentionally deterministic and lightweight.
 * The existing helper backend can still perform richer reasoning.
 */
export function detectVoiceFeature(text = '') {
  const value = String(text)
    .toLowerCase()
    .trim();

  if (
    /(price|rate|mandi|market|bazaar|sell|selling|भाव|ధర|మార్కెట్)/i
      .test(value)
  ) {
    return 'Market Prices';
  }

  if (
    /(soil|moisture|land|soil health|మట్టి|నేల)/i
      .test(value)
  ) {
    return 'Soil Passport';
  }

  if (
    /(cow|cattle|buffalo|goat|sheep|livestock|animal|పశు|గేదె|ఆవు|మేక)/i
      .test(value)
  ) {
    return 'Livestock';
  }

  if (
    /(fertilizer|urea|dap|npk|fertiliser|ఎరువు|యూరియా)/i
      .test(value)
  ) {
    return 'Fertilizer';
  }

  if (
    /(scheme|subsidy|pm kisan|pm-kisan|insurance|pmfby|పథకం|సబ్సిడీ)/i
      .test(value)
  ) {
    return 'Government Schemes';
  }

  if (
    /(crop production|production|yield|crop|పంట|దిగుబడి)/i
      .test(value)
  ) {
    return 'Crops';
  }

  if (
    /(weather|rain|rainfall|temperature|forecast|వర్షం|వాతావరణం)/i
      .test(value)
  ) {
    return 'Weather';
  }

  return null;
}

/**
 * Main entry point for Speak to AgriSaathi / Agri Helper.
 */
export async function getVoiceGovernmentContext(
  text,
  params = {},
) {
  const feature = detectVoiceFeature(text);

  if (!feature) {
    return {
      feature: null,
      resources: [],
      context: [],
      live: false,
      error: null,
    };
  }

  const resources = await loadVoiceFeatureData(
    feature,
    params,
  );

  const context = buildVoiceDataContext(resources);

  return {
    feature,
    resources,
    context,
    live: resources.some(
      (resource) => resource.live,
    ),
    error:
      resources.length > 0 &&
      resources.every(
        (resource) => resource.error,
      )
        ? 'Government data unavailable'
        : null,
  };
}
