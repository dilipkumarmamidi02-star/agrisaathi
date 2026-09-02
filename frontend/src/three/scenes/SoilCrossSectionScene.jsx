import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Spec #19: interactive soil cross-section with topsoil/subsoil layers
 * and nutrient hotspots (N, P, K, pH, organic carbon — the farmer's own
 * SoilRecord entity doesn't track moisture, so we only visualize what's
 * actually recorded). Selecting a nutrient highlights its bar; nothing
 * here is fabricated — every bar height comes from a real record value.
 */

// Real-world-ish normalization bands so very different readings stay
// legible on a 0..1 bar rather than all maxing out or bottoming out.
const NUTRIENT_BANDS = {
  ph: { max: 14, color: '#a855f7', label: 'pH' },
  nitrogen: { max: 150, color: '#3b82f6', label: 'N' },
  phosphorus: { max: 100, color: '#f59e0b', label: 'P' },
  potassium: { max: 100, color: '#22c55e', label: 'K' },
  organic_carbon: { max: 2, color: '#78350f', label: 'OC' },
};

function NutrientBar({ id, value, x, active, dimmed, onSelect }) {
  const band = NUTRIENT_BANDS[id];
  const height = value == null ? 0.03 : Math.max(0.05, Math.min(1, value / band.max));
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current) return;
    if (active) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.06;
      ref.current.scale.set(s, 1, s);
    } else {
      ref.current.scale.set(1, 1, 1);
    }
  });

  return (
    <group
      position={[x, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh ref={ref} position={[0, height / 2, 0]}>
        <boxGeometry args={[0.22, height, 0.22]} />
        <meshStandardMaterial
          color={band.color}
          transparent
          opacity={value == null ? 0.25 : dimmed ? 0.35 : 1}
        />
      </mesh>
    </group>
  );
}

export default function SoilCrossSectionScene({ record, activeNutrient, onSelectNutrient }) {
  const ids = ['ph', 'nitrogen', 'phosphorus', 'potassium', 'organic_carbon'];
  const spacing = 0.32;
  const startX = -(spacing * (ids.length - 1)) / 2;

  return (
    <>
      <ambientLight intensity={0.85} color="#fff5e6" />
      <directionalLight position={[3, 4, 2]} intensity={0.7} color="#ffffff" />

      {/* topsoil */}
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[2.4, 0.12, 1]} />
        <meshStandardMaterial color="#5b4430" />
      </mesh>
      {/* subsoil */}
      <mesh position={[0, -0.32, 0]}>
        <boxGeometry args={[2.4, 0.4, 1]} />
        <meshStandardMaterial color="#3a2a1c" />
      </mesh>

      {ids.map((id, i) => (
        <NutrientBar
          key={id}
          id={id}
          value={record ? record[id] : null}
          x={startX + i * spacing}
          active={activeNutrient === id}
          dimmed={activeNutrient && activeNutrient !== id}
          onSelect={onSelectNutrient}
        />
      ))}
    </>
  );
}

export { NUTRIENT_BANDS };
