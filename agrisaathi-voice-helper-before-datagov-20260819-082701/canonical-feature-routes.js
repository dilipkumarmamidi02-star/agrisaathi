/*
 * AGRISAATHI CANONICAL FEATURE ROUTES
 *
 * These are destinations in the EXISTING application.
 *
 * Multiple Data.gov.in resources may feed the same feature.
 * They must NOT create duplicate application pages.
 */

export const CANONICAL_FEATURE_ROUTES = {
  home: "/",
  crops: "/crops",
  diagnose: "/diagnose",
  nearMe: "/near-me",
  fertilizer: "/fertilizer",
  soilPassport: "/soil-passport",
  cropPlanner: "/crop-planner",
  livestock: "/livestock-care",
  marketPrices: "/market-prices",
  dataGov: "/data-gov",
  schemes: "/schemes",
  irrigation: "/irrigation-planner",
  harvest: "/harvest-records",
  profile: "/profile-settings",
  weather: "/weather",
  marketplace: "/marketplace",
  training: "/training-center",
  insurance: "/insurance-hub",
  pesticideLibrary: "/pest-library",
  alerts: "/alerts-center",
  animalEncyclopedia: "/animal-encyclopedia",
  community: "/community",

  /*
   * KCC Resource #26 is a knowledge source for
   * SPEAK TO AGRISAATHI.
   *
   * It is intentionally NOT converted into a new page.
   */
  speakToAgriSaathi: "/"
};

export default CANONICAL_FEATURE_ROUTES;
