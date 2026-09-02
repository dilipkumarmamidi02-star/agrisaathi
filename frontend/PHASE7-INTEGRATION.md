# AgriSaathi Phase 7 Integration

## Phase 7 routes

- /sensor-hub
- /sensor-lab
- /irrigation-planner
- /farm-ledger
- /expense-analytics
- /yield-benchmarks
- /harvest-records
- /inventory-tracker
- /equipment-registry

## Import

Use this inside a React page:

import {
  Phase7RouteIntegration,
  publishPhase7Context,
} from "../components/phase7";

## Example

export default function SensorHub() {
  const selectedCrop = "paddy";

  function handleCropChange(crop) {
    publishPhase7Context({
      page: "/sensor-hub",
      crop: crop,
    });
  }

  return (
    <div>
      <button onClick={() => handleCropChange(selectedCrop)}>
        Select Paddy
      </button>

      <Phase7RouteIntegration route="/sensor-hub" />
    </div>
  );
}

## Irrigation

publishPhase7Context({
  page: "/irrigation-planner",
  crop: selectedCrop,
  moisture: moistureValue,
  waterFlow: waterFlowValue,
  irrigationSchedule: schedule,
});

Then:

<Phase7RouteIntegration route="/irrigation-planner" />

## Harvest

publishPhase7Context({
  page: "/harvest-records",
  crop: selectedCrop,
  harvest: selectedHarvest,
});

Then:

<Phase7RouteIntegration route="/harvest-records" />

## Inventory

publishPhase7Context({
  page: "/inventory-tracker",
  inventoryItem: selectedItem,
  inventoryQuantity: quantity,
  selectedObject: selectedItem?.id,
});

Then:

<Phase7RouteIntegration route="/inventory-tracker" />

## Equipment

publishPhase7Context({
  page: "/equipment-registry",
  equipment: selectedEquipment,
  equipmentType: selectedEquipment?.type,
  selectedObject: selectedEquipment?.id,
});

Then:

<Phase7RouteIntegration route="/equipment-registry" />
