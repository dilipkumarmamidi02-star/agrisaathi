// ----------------------------------------------------------
// SHARED LOCATION DATA (State -> District -> Village)
//
// Backed by public/data/locations.json (India Post pincode
// directory, ~162k villages/offices across 754 districts).
// Fetched once and cached in memory for the whole app —
// every page that needs a State/District/Village selector
// should use this instead of loading its own copy.
// ----------------------------------------------------------

let cachedTree = null;
let inFlightPromise = null;

export async function loadLocationTree() {
  if (cachedTree) return cachedTree;
  if (inFlightPromise) return inFlightPromise;

  inFlightPromise = fetch('/data/locations.json')
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to load locations.json: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      cachedTree = data;
      return data;
    })
    .finally(() => {
      inFlightPromise = null;
    });

  return inFlightPromise;
}

export function getStates(tree) {
  if (!tree) return [];
  return Object.keys(tree).sort();
}

export function getDistricts(tree, state) {
  if (!tree || !state || !tree[state]) return [];
  return Object.keys(tree[state]).sort();
}

export function getVillages(tree, state, district) {
  if (!tree || !state || !district) return [];
  const districts = tree[state];
  if (!districts || !districts[district]) return [];
  return districts[district];
}
