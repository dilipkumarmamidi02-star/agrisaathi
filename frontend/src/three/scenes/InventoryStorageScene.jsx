import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Spec #40 "Inventory Tracker": "digital farm storage environment...
 * seed bags, fertilizer, tools, equipment. Inventory selection ->
 * object highlighted. Low stock -> subtle visual indicator. Do not
 * make alerts distracting." Reads the farmer's real current-stock
 * ledger snapshot (one crate per real item, grouped by real category)
 * — never invents stock levels.
 */
const CATEGORY_COLOR = {
  Seed: '#8d6e3f', Fertilizer: '#5d8a3f', Pesticide: '#c0392b',
  Equipment: '#5d6d7e', Fuel: '#7d6608', Other: '#8e8e8e',
};

function Crate({ position, color, low, reducedMotion }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || !low || reducedMotion) return;
    ref.current.material.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.25;
  });
  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[0.22, 0.22, 0.22]} />
      <meshStandardMaterial
        color={color}
        emissive={low ? '#f59e0b' : '#000000'}
        emissiveIntensity={low ? 0.3 : 0}
      />
    </mesh>
  );
}

export default function InventoryStorageScene({ items = [], reducedMotion = false }) {
  const spacing = 0.32;
  const startX = -(spacing * Math.max(0, items.length - 1)) / 2;

  return (
    <>
      <color attach="background" args={['#f2f0e6']} />
      <ambientLight intensity={1} color="#fffaf0" />
      <directionalLight position={[2, 3, 2]} intensity={0.8} color="#fff2cf" />

      {/* storage shelf */}
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[Math.max(1, spacing * items.length + 0.3), 0.04, 0.4]} />
        <meshStandardMaterial color="#6b4f2e" />
      </mesh>

      {items.length === 0 ? (
        // empty storage per spec #74
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.25, 0.02, 0.25]} />
          <meshStandardMaterial color="#93a68a" transparent opacity={0.5} />
        </mesh>
      ) : (
        items.map((it, i) => (
          <Crate
            key={it.item}
            position={[startX + i * spacing, 0.11, 0]}
            color={CATEGORY_COLOR[it.category] || CATEGORY_COLOR.Other}
            low={it.low}
            reducedMotion={reducedMotion}
          />
        ))
      )}
    </>
  );
}
