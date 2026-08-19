import { getDataGovResource } from './dataGov';

export const MARKET_INTELLIGENCE_RESOURCES = [
  {
    resource_key: 'mandi_prices',
    title: 'Current Mandi Prices',
    type: 'primary',
    description:
      'Current daily commodity prices from agricultural markets.',
  },
  {
    resource_key: 'variety_market_prices',
    title: 'Variety-wise Market Prices',
    type: 'primary',
    description:
      'Daily market prices by commodity variety, market, district and state.',
  },
  {
    resource_key: 'fci_stock_position',
    title: 'FCI Stock Position',
    type: 'secondary',
    description:
      'Food Corporation of India stock position relevant to market intelligence.',
  },
  {
    resource_key: 'msp_procurement',
    title: 'MSP Procurement',
    type: 'secondary',
    description:
      'Crop procurement information at Minimum Support Price rates.',
  },
  {
    resource_key: 'commodity_demand_supply',
    title: 'Commodity Demand & Supply',
    type: 'secondary',
    description:
      'Commodity demand, production and supply intelligence.',
  },
  {
    resource_key: 'fertilizer_demand_availability_rabi',
    title: 'Rabi Fertilizer Availability',
    type: 'secondary',
    description:
      'Rabi fertilizer demand, availability, consumption and closing stock.',
  },
  {
    resource_key: 'fertilizer_demand_supply_kharif',
    title: 'Kharif Fertilizer Demand & Supply',
    type: 'secondary',
    description:
      'Kharif fertilizer demand, supply and consumption.',
  },
  {
    resource_key: 'district_crop_production',
    title: 'District Crop Production',
    type: 'secondary',
    description:
      'District-level crop production information supporting market analysis.',
  },
];

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

export async function loadMarketIntelligence(params = {}) {
  const filters = cleanParams(params);

  const results = await Promise.all(
    MARKET_INTELLIGENCE_RESOURCES.map(async (resource) => {
      try {
        const data = await getDataGovResource(
          resource.resource_key,
          {
            ...filters,
            limit: 100,
          }
        );

        return {
          ...resource,
          ...data,
          resource_key: resource.resource_key,
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
          ...resource,
          resource_key: resource.resource_key,
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
    })
  );

  return results;
}
