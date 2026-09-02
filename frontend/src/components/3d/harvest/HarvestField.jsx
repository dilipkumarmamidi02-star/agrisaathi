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
