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
