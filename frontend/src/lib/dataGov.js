import apiClient from '../api/client';

/*
 * AgriSaathi Data.gov.in integration.
 *
 * The backend registry is authoritative.
 *
 * The frontend must NOT restrict resources based only on
 * primary_feature. Secondary/tertiary usage is also allowed.
 */

export async function getDataGovResources() {
  const response = await apiClient.dataGovResources();

  return response?.data || {};
}

export async function getDataGovResource(
  resourceKey,
  params = {}
) {
  const response = await apiClient.dataGovResource(
    resourceKey,
    params
  );

  return response?.data || {};
}

export async function getDataGovHealth() {
  const response = await apiClient.dataGovHealth();

  return response?.data || {};
}


/*
 * Backward-compatible helper used by existing frontend pages.
 *
 * Existing pages such as MarketPrices.jsx and DataGovLiveData.jsx
 * depend on this export, so it must remain available.
 */
export async function getDataGovResourceRecords(
  resourceKey,
  params = {}
) {
  const data = await getDataGovResource(resourceKey, params);

  return Array.isArray(data?.records)
    ? data.records
    : [];
}

export async function getDataGovRegistry() {
  const data = await getDataGovResources();

  return Array.isArray(data?.resources)
    ? data.resources
    : [];
}

function featureMatches(resource, feature) {
  if (!resource || !feature) {
    return false;
  }

  if (resource.primary_feature === feature) {
    return true;
  }

  if (
    Array.isArray(resource.secondary_features) &&
    resource.secondary_features.includes(feature)
  ) {
    return true;
  }

  if (
    Array.isArray(resource.tertiary_features) &&
    resource.tertiary_features.includes(feature)
  ) {
    return true;
  }

  return false;
}

export async function getDataGovFeatureMetadata(feature) {
  const resources = await getDataGovRegistry();

  return resources.filter(
    (resource) => featureMatches(resource, feature)
  );
}

export async function getDataGovFeatureResources(
  feature,
  options = {}
) {
  const {
    limit = 100,
    concurrency = 5,
  } = options;

  const resources =
    await getDataGovFeatureMetadata(feature);

  const results = new Array(resources.length);

  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex++;

      if (index >= resources.length) {
        return;
      }

      const resource = resources[index];

      try {
        const data =
          await getDataGovResource(
            resource.resource_key,
            { limit }
          );

        results[index] = {
          ...resource,
          ...data,
          resource_key:
            resource.resource_key,
          records:
            Array.isArray(data?.records)
              ? data.records
              : [],
          runtime_status: 'LIVE',
        };
      } catch (error) {
        results[index] = {
          ...resource,
          resource_key:
            resource.resource_key,
          records: [],
          count: 0,
          total: 0,
          runtime_status: 'ERROR',
          error:
            error?.response?.data?.detail ||
            error?.message ||
            'Resource unavailable',
        };
      }
    }
  }

  const workerCount = Math.min(
    Math.max(Number(concurrency) || 1, 1),
    Math.max(resources.length, 1)
  );

  await Promise.all(
    Array.from(
      { length: workerCount },
      () => worker()
    )
  );

  return results.filter(Boolean);
}

export const DATAGOV_FEATURES = [
  'Market Prices',
  'Soil Passport',
  'Fertilizer',
  'Pesticide Library',
  'Near Me',
  'Livestock',
  'Government Schemes',
  'Insurance',
  'Weather',
  'Crops',
  'Training',
  'Harvest',
  'Marketplace',
  'Speak to AgriSaathi',
  'Animal Encyclopedia',
];

// ============================================================
// Evidence conflict resolution
// ============================================================
// When two evidence items disagree, resolve deterministically:
//   1. Prefer higher authority_level (government > ICAR > SAU > KVK > research org > institution > educational reference)
//   2. If authority is equal, prefer the more recently published item
//   3. If neither resolves the conflict, surface it explicitly rather than silently merging
export function resolveEvidenceConflict(evidenceA, evidenceB) {
  if (!evidenceA) return evidenceB;
  if (!evidenceB) return evidenceA;

  if (evidenceA.authority_level !== evidenceB.authority_level) {
    return evidenceA.authority_level < evidenceB.authority_level ? evidenceA : evidenceB;
  }

  const dateA = new Date(evidenceA.published_at || 0);
  const dateB = new Date(evidenceB.published_at || 0);
  if (dateA.getTime() !== dateB.getTime()) {
    return dateA > dateB ? evidenceA : evidenceB;
  }

  return {
    conflict: true,
    reason: 'source conflict: equal authority and date, evidence disagrees',
    candidates: [evidenceA, evidenceB],
  };
}
