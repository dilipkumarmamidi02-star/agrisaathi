export const phase7Scenes = {
  "/sensor-hub": {
    id: "sensor-hub",
    level: "immersive",
    environment: "smart-farm",
    camera: "overview",
    objects: ["field", "sensorNodes", "waterTank", "weatherNode"],
  },

  "/sensor-lab": {
    id: "sensor-lab",
    level: "immersive",
    environment: "agri-laboratory",
    camera: "overview",
    objects: ["soilSample", "waterSample", "sensorDisplay"],
  },

  "/expense-analytics": {
    id: "expense-analytics",
    level: "contextual",
    environment: "farm-finance",
    camera: "overview",
    objects: ["field", "machinery", "inputStorage"],
  },

  "/yield-benchmarks": {
    id: "yield-benchmarks",
    level: "contextual",
    environment: "comparison-fields",
    camera: "overview",
    objects: ["yourYield", "regionalYield", "targetYield"],
  },

  "/harvest-records": {
    id: "harvest-records",
    level: "immersive",
    environment: "harvest-field",
    camera: "overview",
    objects: ["cropField", "harvester", "cropRows"],
  },

  "/equipment-registry": {
    id: "equipment-registry",
    level: "contextual",
    environment: "equipment-yard",
    camera: "overview",
    objects: ["tractor", "harvester", "pump", "sprayer"],
  },
};

export function getPhase7Scene(route) {
  return phase7Scenes[route] || null;
}
