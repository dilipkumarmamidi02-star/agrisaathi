const FARMER_ROUTES = new Set([
  "/dashboard",
  "/lots",
  "/my-lots",
  "/my-offers",
  "/offers",
  "/orders",
  "/market-prices",
  "/marketplace",
  "/diagnose",
  "/fertilize",
  "/fertilizer",
  "/government-schemes",
  "/schemes",
  "/crop-planner",
  "/crop-passport",
  "/soil-passport",
  "/quality-checker",
  "/pest-library",
  "/livestock",
  "/livestock-care",
  "/animal-encyclopedia",
  "/near-me",
  "/weather",
  "/weather-analytics",
  "/alerts",
  "/notifications",
  "/logistics",
  "/storage",
  "/resource-marketplace",
  "/document-wallet",
  "/export-data",
  "/export-reports",
  "/profile-settings",
  "/support-tickets"
]);

const SUPPORTER_ROUTES = new Set([
  "/supporter",
  "/supporter-home",
  "/offers",
  "/orders",
  "/logistics",
  "/storage",
  "/near-me",
  "/weather",
  "/alerts",
  "/notifications",
  "/profile-settings",
  "/support-tickets"
]);

const ADMIN_ROUTES = new Set([
  "/admin",
  "/admin/users",
  "/admin/schemes",
  "/admin/data-gov",
  "/admin/alerts",
  "/admin/grievances",
  "/alerts",
  "/notifications",
  "/profile-settings"
]);

const SUPPORTER_TYPE_ROUTES = {
  logistics_provider: new Set([
    "/supporter",
    "/supporter-home",
    "/logistics",
    "/near-me",
    "/weather",
    "/alerts",
    "/notifications",
    "/profile-settings"
  ]),

  cold_storage_provider: new Set([
    "/supporter",
    "/supporter-home",
    "/storage",
    "/near-me",
    "/weather",
    "/alerts",
    "/notifications",
    "/profile-settings"
  ]),

  warehouse_provider: new Set([
    "/supporter",
    "/supporter-home",
    "/storage",
    "/near-me",
    "/weather",
    "/alerts",
    "/notifications",
    "/profile-settings"
  ])
};

function normalizeRole(role) {
  const value = String(role || "").toLowerCase();

  if (value.includes("admin")) {
    return "admin";
  }

  if (value.includes("support")) {
    return "supporter";
  }

  return "farmer";
}

export function normalizeRoute(route) {
  if (!route) {
    return "/";
  }

  let value = String(route).trim();

  if (!value.startsWith("/")) {
    value = "/" + value;
  }

  value = value.replace(/\/+$/, "");

  return value || "/";
}

export function canAgriHelperNavigate({
  role,
  supporterType,
  route
}) {
  const normalizedRole = normalizeRole(role);
  const normalizedRoute = normalizeRoute(route);

  if (normalizedRole === "farmer") {
    return FARMER_ROUTES.has(normalizedRoute);
  }

  if (normalizedRole === "admin") {
    return ADMIN_ROUTES.has(normalizedRoute);
  }

  if (normalizedRole === "supporter") {
    const typedRoutes = SUPPORTER_TYPE_ROUTES[supporterType];

    if (typedRoutes) {
      return typedRoutes.has(normalizedRoute);
    }

    return SUPPORTER_ROUTES.has(normalizedRoute);
  }

  return false;
}

export function roleDeniedMessage({
  role,
  route
}) {
  const normalizedRole = normalizeRole(role);

  const page = normalizeRoute(route)
    .replace(/^\//, "")
    .replace(/-/g, " ") || "this page";

  if (normalizedRole === "supporter") {
    return `Access denied. ${page} is not available in the Supporter Portal.`;
  }

  if (normalizedRole === "admin") {
    return `Access denied. ${page} is not available in the Admin Portal.`;
  }

  return `Access denied. ${page} is not available in the Farmer Portal.`;
}

export function routeFromText(text) {
  const value = String(text || "").toLowerCase();

  const mappings = [
    ["weather analytics", "/weather-analytics"],
    ["weather", "/weather"],
    ["market prices", "/market-prices"],
    ["market price", "/market-prices"],
    ["my lots", "/my-lots"],
    ["my offers", "/my-offers"],
    ["offers", "/offers"],
    ["orders", "/orders"],
    ["diagnose", "/diagnose"],
    ["crop planner", "/crop-planner"],
    ["crop passport", "/crop-passport"],
    ["soil passport", "/soil-passport"],
    ["quality checker", "/quality-checker"],
    ["fertilizer", "/fertilizer"],
    ["fertilize", "/fertilize"],
    ["government schemes", "/government-schemes"],
    ["schemes", "/schemes"],
    ["logistics", "/logistics"],
    ["pickup", "/logistics"],
    ["cold storage", "/storage"],
    ["storage", "/storage"],
    ["near me", "/near-me"],
    ["livestock", "/livestock"],
    ["pest", "/pest-library"],
    ["profile", "/profile-settings"],
    ["settings", "/profile-settings"],
    ["alerts", "/alerts"],
    ["notifications", "/notifications"]
  ];

  for (const [keyword, route] of mappings) {
    if (value.includes(keyword)) {
      return route;
    }
  }

  return null;
}
