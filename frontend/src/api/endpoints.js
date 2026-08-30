export const API_ENDPOINTS = {
  health: '/health',

  soilProfiles: '/api/soil-profiles',
  soilRecords: '/api/soil-records',
  soilScan: '/api/soil-records/scan',

  crops: '/api/crops',

  pestLibrary: '/api/pest-library',
  livestockVaccines: '/api/pest-library/livestock-vaccines',

  livestockTypes: '/api/livestock-types',
  livestockCare: '/api/livestock-care',

  schemes: '/api/schemes',
  schemeEligibility: (id) =>
    `/api/schemes/${id}/check-eligibility`,

  fertilizerCalculate: '/api/fertilizer/calculate',

  ledgerLog: '/api/ledger/log',
  ledger: '/api/ledger',

  weatherCurrent: '/api/weather/current',
  weatherForecast: '/api/weather/forecast',

  farms: '/api/farms',

  cropCycles: '/api/crop-cycles',

  diagnoses: '/api/diagnoses',
  diagnosisScan: '/api/diagnoses/scan',

  marketPrices: '/api/market-prices',

  harvestRecords: '/api/harvest-records',

  translate: '/api/translate',
  helperChat: '/api/helper/chat',
};
