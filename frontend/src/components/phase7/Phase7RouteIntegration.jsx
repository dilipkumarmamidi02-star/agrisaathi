import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Grid } from "@react-three/drei";

import SensorFarmScene from "../3d/sensors/SensorFarmScene";
import IrrigationField from "../3d/irrigation/IrrigationField";
import HarvestField from "../3d/harvest/HarvestField";
import StorageObject from "../3d/inventory/StorageObject";
import EquipmentObject from "../3d/equipment/EquipmentObject";

function SceneContent({ route }) {
  switch (route) {
    case "/sensor-hub":
    case "/sensor-lab":
      return <SensorFarmScene />;

    case "/irrigation-planner":
      return <IrrigationField moisture={65} waterFlow={75} />;

    case "/harvest-records":
      return <HarvestField maturity={80} />;

    case "/inventory-tracker":
      return (
        <group>
          <StorageObject position={[-1.5, 0.5, 0]} />
          <StorageObject position={[0, 0.5, 0]} />
          <StorageObject position={[1.5, 0.5, 0]} selected />
        </group>
      );

    case "/equipment-registry":
      return (
        <group>
          <EquipmentObject position={[0, 0.5, 0]} selected />
          <EquipmentObject position={[2, 0.5, 0]} />
        </group>
      );

    case "/farm-ledger":
    case "/expense-analytics":
    case "/yield-benchmarks":
    default:
      return (
        <group>
          <Grid
            args={[10, 10]}
            cellSize={0.5}
            cellThickness={0.5}
            sectionSize={2}
          />
        </group>
      );
  }
}

export function Phase7RouteIntegration({
  route = "/sensor-hub",
  height = 500,
}) {
  return (
    <div
      style={{
        width: "100%",
        height,
        minHeight: 400,
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
        background: "#0b1510",
      }}
    >
      <Canvas
        camera={{
          position: [8, 6, 8],
          fov: 45,
        }}
        shadows
      >
        <ambientLight intensity={1.2} />

        <directionalLight
          position={[5, 10, 5]}
          intensity={2}
          castShadow
        />

        <pointLight
          position={[-5, 4, -5]}
          intensity={1}
        />

        <Environment preset="park" />

        <SceneContent route={route} />

        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={3}
          maxDistance={25}
        />
      </Canvas>

      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          padding: "8px 12px",
          borderRadius: 10,
          background: "rgba(0,0,0,0.55)",
          color: "white",
          fontSize: 13,
          pointerEvents: "none",
        }}
      >
        🌾 AgriSaathi 3D • {route}
      </div>
    </div>
  );
}

export function publishPhase7Context(context = {}) {
  window.dispatchEvent(
    new CustomEvent("agrisaathi:phase7-context", {
      detail: context,
    }),
  );
}
