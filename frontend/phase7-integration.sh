set -e

echo "=============================================================="
echo "🌾 AGRISAATHI — PHASE 7 FULL INTEGRATION"
echo "Sensors • Irrigation • Ledger • Analytics"
echo "Yield • Harvest • Inventory • Equipment"
echo "=============================================================="

if [ ! -f package.json ]; then
  echo "❌ ERROR: package.json not found."
  echo "Run this script from the frontend directory."
  exit 1
fi

echo "✅ Frontend project detected."

echo ""
echo "[1/12] Checking/installing dependencies..."

npm install three @react-three/fiber @react-three/drei @react-three/postprocessing framer-motion

echo ""
echo "[2/12] Creating Phase 7 directories..."

mkdir -p src/components/3d/core
mkdir -p src/components/3d/sensors
mkdir -p src/components/3d/irrigation
mkdir -p src/components/3d/finance
mkdir -p src/components/3d/harvest
mkdir -p src/components/3d/inventory
mkdir -p src/components/3d/equipment
mkdir -p src/components/3d/phase7
mkdir -p src/config/scenes
mkdir -p src/hooks
mkdir -p src/styles

echo "✅ Directories ready."

echo ""
echo "[3/12] Creating Phase 7 scene registry..."

cat > src/config/scenes/phase7Scenes.js <<'EOF'
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

  "/irrigation-planner": {
    id: "irrigation-planner",
    level: "immersive",
    environment: "irrigated-field",
    camera: "overview",
    objects: ["cropField", "channels", "waterZones", "pump"],
  },

  "/farm-ledger": {
    id: "farm-ledger",
    level: "subtle",
    environment: "farm-office",
    camera: "overview",
    objects: ["desk", "ledger", "fieldModel"],
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

  "/inventory-tracker": {
    id: "inventory-tracker",
    level: "contextual",
    environment: "farm-storage",
    camera: "overview",
    objects: ["seedBags", "fertilizerBags", "tools", "equipment"],
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
EOF

echo "✅ Scene registry created."

echo ""
echo "[4/12] Creating Phase 7 context hook..."

cat > src/hooks/usePhase7Scene.js <<'EOF'
import { useMemo } from "react";
import { getPhase7Scene } from "../config/scenes/phase7Scenes";

export function usePhase7Scene(route, context = {}) {
  return useMemo(() => {
    const scene = getPhase7Scene(route);

    if (!scene) {
      return {
        scene: null,
        context,
        active: false,
      };
    }

    return {
      scene,
      context,
      active: true,
      isImmersive: scene.level === "immersive",
      isContextual: scene.level === "contextual",
      isSubtle: scene.level === "subtle",
    };
  }, [route, context]);
}
EOF

echo "✅ Context hook created."

echo ""
echo "[5/12] Creating interactive Sensor Node..."

cat > src/components/3d/sensors/SensorNode.jsx <<'EOF'
import { Html } from "@react-three/drei";
import { useState } from "react";

export default function SensorNode({
  position = [0, 0.25, 0],
  label = "Sensor",
  value = null,
  unit = "",
  status = "normal",
  selected = false,
  onSelect,
}) {
  const [hovered, setHovered] = useState(false);

  const active = hovered || selected;

  const statusColor =
    status === "critical"
      ? "#ff3b30"
      : status === "warning"
        ? "#ffb020"
        : "#38d996";

  return (
    <group
      position={position}
      scale={active ? 1.15 : 1}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
    >
      <mesh castShadow>
        <cylinderGeometry args={[0.09, 0.12, 0.38, 20]} />
        <meshStandardMaterial
          color="#25352d"
          emissive={statusColor}
          emissiveIntensity={active ? 1.5 : 0.55}
          roughness={0.55}
        />
      </mesh>

      <mesh position={[0, 0.23, 0]}>
        <sphereGeometry args={[0.065, 20, 20]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={2}
        />
      </mesh>

      {active && (
        <Html distanceFactor={7}>
          <div
            style={{
              minWidth: 150,
              padding: "10px 12px",
              borderRadius: 12,
              background: "rgba(15, 24, 20, 0.92)",
              color: "white",
              fontFamily: "system-ui",
              fontSize: 12,
              boxShadow: "0 10px 35px rgba(0,0,0,.25)",
              pointerEvents: "none",
            }}
          >
            <strong>{label}</strong>
            <div style={{ marginTop: 4 }}>
              {value === null || value === undefined ? "No reading" : value}{" "}
              {unit}
            </div>
            <div style={{ marginTop: 3, opacity: 0.7 }}>
              Status: {status}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
EOF

echo "✅ Sensor node created."

echo ""
echo "[6/12] Creating smart farm sensor environment..."

cat > src/components/3d/sensors/SensorFarmScene.jsx <<'EOF'
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import SensorNode from "./SensorNode";

function FarmGround() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      position={[0, 0, 0]}
    >
      <planeGeometry args={[12, 8]} />
      <meshStandardMaterial color="#5f4934" roughness={1} />
    </mesh>
  );
}

function FarmRows() {
  return (
    <group>
      {Array.from({ length: 7 }).map((_, row) => (
        <group key={row} position={[0, 0.04, -2.7 + row * 0.85]}>
          {Array.from({ length: 15 }).map((__, plant) => (
            <mesh
              key={plant}
              position={[-5.5 + plant * 0.78, 0.35, 0]}
            >
              <coneGeometry args={[0.11, 0.7, 7]} />
              <meshStandardMaterial color="#4f8f43" roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export default function SensorFarmScene({
  sensors = [],
  onSensorSelect,
}) {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: 420 }}>
      <Canvas
        shadows
        camera={{
          position: [7, 5, 8],
          fov: 45,
        }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.65} />

        <directionalLight
          position={[5, 8, 5]}
          intensity={1.4}
          castShadow
        />

        <Environment preset="park" />

        <FarmGround />
        <FarmRows />

        {sensors.length > 0
          ? sensors.map((sensor, index) => (
              <SensorNode
                key={sensor.id ?? index}
                position={
                  sensor.position ?? [
                    -3 + index * 1.5,
                    0.25,
                    0,
                  ]
                }
                label={sensor.name ?? `Sensor ${index + 1}`}
                value={sensor.value}
                unit={sensor.unit ?? ""}
                status={sensor.status ?? "normal"}
                selected={sensor.selected}
                onSelect={() => onSensorSelect?.(sensor)}
              />
            ))
          : [0, 1, 2, 3].map((index) => (
              <SensorNode
                key={index}
                position={[-2.5 + index * 1.7, 0.25, 0]}
                label={`Sensor ${index + 1}`}
                value={null}
                status="normal"
              />
            ))}

        <OrbitControls
          enablePan={false}
          minDistance={5}
          maxDistance={16}
        />
      </Canvas>
    </div>
  );
}
EOF

echo "✅ Smart farm scene created."

echo ""
echo "[7/12] Creating irrigation field..."

cat > src/components/3d/irrigation/IrrigationField.jsx <<'EOF'
import { useMemo } from "react";

function CropRow({
  z,
  moisture,
}) {
  const plants = useMemo(
    () => Array.from({ length: 15 }),
    []
  );

  const height = 0.25 + Math.max(0, Math.min(100, moisture)) / 150;

  return (
    <group position={[0, 0, z]}>
      {plants.map((_, index) => (
        <mesh
          key={index}
          position={[-4.9 + index * 0.7, height / 2, 0]}
          castShadow
        >
          <coneGeometry args={[0.1, height, 7]} />
          <meshStandardMaterial
            color="#4e8c42"
            roughness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function IrrigationField({
  moisture = 50,
  waterFlow = 50,
  crop = "crop",
}) {
  const rows = useMemo(
    () => Array.from({ length: 8 }),
    []
  );

  const safeMoisture = Math.max(
    0,
    Math.min(100, Number(moisture) || 0)
  );

  const safeWater = Math.max(
    0,
    Math.min(100, Number(waterFlow) || 0)
  );

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial
          color="#654832"
          roughness={1}
        />
      </mesh>

      {rows.map((_, index) => (
        <CropRow
          key={index}
          z={-3 + index * 0.85}
          moisture={safeMoisture}
        />
      ))}

      <mesh position={[0, 0.07, 3.45]}>
        <boxGeometry args={[10.8, 0.12, 0.22]} />
        <meshStandardMaterial
          color="#4d7180"
          metalness={0.1}
          roughness={0.45}
        />
      </mesh>

      <mesh
        position={[
          -5.2 + (safeWater / 100) * 5.2,
          0.14,
          3.45,
        ]}
      >
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color="#9de7ff"
          emissive="#55cfff"
          emissiveIntensity={1.4}
        />
      </mesh>
    </group>
  );
}
EOF

echo "✅ Irrigation field created."

echo ""
echo "[8/12] Creating harvest field..."

cat > src/components/3d/harvest/HarvestField.jsx <<'EOF'
import { useMemo } from "react";

export default function HarvestField({
  crop = "crop",
  maturity = 70,
}) {
  const rows = useMemo(
    () => Array.from({ length: 10 }),
    []
  );

  const safeMaturity = Math.max(
    0,
    Math.min(100, Number(maturity) || 0)
  );

  const plantHeight =
    0.25 + safeMaturity / 80;

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[13, 8]} />
        <meshStandardMaterial
          color="#664a32"
          roughness={1}
        />
      </mesh>

      {rows.map((_, row) => (
        <group
          key={row}
          position={[0, 0, -3 + row * 0.62]}
        >
          {Array.from({ length: 19 }).map(
            (__, plant) => (
              <mesh
                key={plant}
                position={[
                  -5.5 + plant * 0.6,
                  plantHeight / 2,
                  0,
                ]}
                castShadow
              >
                <coneGeometry
                  args={[
                    0.09,
                    plantHeight,
                    7,
                  ]}
                />
                <meshStandardMaterial
                  color={
                    safeMaturity > 80
                      ? "#b99b42"
                      : "#5b9844"
                  }
                  roughness={0.85}
                />
              </mesh>
            )
          )}
        </group>
      ))}
    </group>
  );
}
EOF

echo "✅ Harvest field created."

echo ""
echo "[9/12] Creating inventory visualization..."

cat > src/components/3d/inventory/StorageObject.jsx <<'EOF'
export default function StorageObject({
  position = [0, 0.5, 0],
  label = "Storage",
  quantity = null,
  selected = false,
  lowStock = false,
  onSelect,
}) {
  return (
    <group
      position={position}
      scale={selected ? 1.12 : 1}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
    >
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.9, 0.8]} />
        <meshStandardMaterial
          color="#8b6845"
          emissive={selected ? "#d8a85b" : "#000000"}
          emissiveIntensity={selected ? 0.35 : 0}
        />
      </mesh>

      {lowStock && (
        <mesh position={[0, 0.55, 0]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial
            color="#ff9f43"
            emissive="#ff7a00"
            emissiveIntensity={1.5}
          />
        </mesh>
      )}
    </group>
  );
}
EOF

echo "✅ Inventory object created."

echo ""
echo "[10/12] Creating equipment visualization..."

cat > src/components/3d/equipment/EquipmentObject.jsx <<'EOF'
export default function EquipmentObject({
  position = [0, 0.5, 0],
  type = "tractor",
  selected = false,
  onSelect,
}) {
  return (
    <group
      position={position}
      scale={selected ? 1.1 : 1}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
    >
      <mesh castShadow>
        <boxGeometry args={[1.7, 0.65, 0.9]} />
        <meshStandardMaterial
          color="#59665c"
          roughness={0.55}
          emissive={selected ? "#d5ad5d" : "#000000"}
          emissiveIntensity={selected ? 0.35 : 0}
        />
      </mesh>

      <mesh
        position={[-0.55, -0.42, 0.48]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.25, 0.25, 0.18, 20]} />
        <meshStandardMaterial
          color="#202522"
          roughness={0.85}
        />
      </mesh>

      <mesh
        position={[-0.55, -0.42, -0.48]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.25, 0.25, 0.18, 20]} />
        <meshStandardMaterial
          color="#202522"
          roughness={0.85}
        />
      </mesh>

      <mesh
        position={[0.62, -0.35, 0.48]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.18, 0.18, 0.15, 20]} />
        <meshStandardMaterial
          color="#202522"
          roughness={0.85}
        />
      </mesh>

      <mesh
        position={[0.62, -0.35, -0.48]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.18, 0.18, 0.15, 20]} />
        <meshStandardMaterial
          color="#202522"
          roughness={0.85}
        />
      </mesh>
    </group>
  );
}
EOF

echo "✅ Equipment object created."

echo ""
echo "[11/12] Creating reusable Phase 7 scene wrapper..."

cat > src/components/3d/core/Phase7Scene.jsx <<'EOF'
import { Canvas } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
} from "@react-three/drei";

export default function Phase7Scene({
  children,
  cameraPosition = [7, 5, 8],
  minDistance = 4,
  maxDistance = 18,
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 420,
        position: "relative",
        overflow: "hidden",
        borderRadius: 24,
      }}
    >
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{
          position: cameraPosition,
          fov: 45,
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
        }}
      >
        <ambientLight intensity={0.65} />

        <directionalLight
          position={[6, 9, 6]}
          intensity={1.25}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <Environment preset="park" />

        {children}

        <OrbitControls
          enablePan={false}
          minDistance={minDistance}
          maxDistance={maxDistance}
        />
      </Canvas>
    </div>
  );
}
EOF

echo "✅ Phase 7 scene wrapper created."

echo ""
echo "[12/12] Creating Phase 7 component exports..."

cat > src/components/3d/phase7/index.js <<'EOF'
export { default as Phase7Scene } from "../core/Phase7Scene";

export { default as SensorNode } from "../sensors/SensorNode";
export { default as SensorFarmScene } from "../sensors/SensorFarmScene";

export { default as IrrigationField } from "../irrigation/IrrigationField";

export { default as HarvestField } from "../harvest/HarvestField";

export { default as StorageObject } from "../inventory/StorageObject";

export { default as EquipmentObject } from "../equipment/EquipmentObject";
EOF

echo "✅ Phase 7 exports created."

echo ""
echo "=============================================================="
echo "RUNNING VALIDATION"
echo "=============================================================="

if npm run lint; then
  echo "✅ Lint passed."
else
  echo "⚠️ Existing lint errors detected."
  echo "Continuing to build validation."
fi

npm run build

echo ""
echo "=============================================================="
echo "✅ PHASE 7 FULL 3D FOUNDATION INSTALLED"
echo "=============================================================="
echo ""
echo "Created:"
echo ""
echo "  src/config/scenes/phase7Scenes.js"
echo "  src/hooks/usePhase7Scene.js"
echo ""
echo "  src/components/3d/core/Phase7Scene.jsx"
echo ""
echo "  src/components/3d/sensors/SensorNode.jsx"
echo "  src/components/3d/sensors/SensorFarmScene.jsx"
echo ""
echo "  src/components/3d/irrigation/IrrigationField.jsx"
echo "  src/components/3d/harvest/HarvestField.jsx"
echo "  src/components/3d/inventory/StorageObject.jsx"
echo "  src/components/3d/equipment/EquipmentObject.jsx"
echo ""
echo "=============================================================="
echo "IMPORTANT"
echo "=============================================================="
echo "Existing application pages/API/state were NOT overwritten."
echo ""
echo "Next integration targets:"
echo ""
echo "  /sensor-hub"
echo "  /sensor-lab"
echo "  /irrigation-planner"
echo "  /farm-ledger"
echo "  /expense-analytics"
echo "  /yield-benchmarks"
echo "  /harvest-records"
echo "  /inventory-tracker"
echo "  /equipment-registry"
echo ""
echo "Real application data must be connected to these scenes."
echo "=============================================================="
