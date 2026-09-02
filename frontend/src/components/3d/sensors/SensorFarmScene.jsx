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
