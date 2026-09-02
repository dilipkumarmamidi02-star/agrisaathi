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
