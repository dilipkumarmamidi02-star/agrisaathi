import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import CropField from './CropField';

/**
 * Spec #11: "layered presentation: Field → Crop → Soil → Growth →
 * Records → Recommendations. Allow users to inspect different layers."
 *
 * We collapse this into three inspectable layers that map cleanly onto
 * what CropPassport.jsx actually has real data for: the crop/field
 * itself, its real soil N/P/K/pH requirements, and its real ledger
 * verification chain. No layer shows invented numbers.
 */

function SoilLayer({ requirements }) {
  // Normalize real kg/ha figures onto a 0..1 bar height so very different
  // crops (rice's ~100kg/ha N vs a pulse's ~20kg/ha) stay legible.
  const n = Math.min(1, (requirements.nitrogen_kg_ha || 0) / 150);
  const p = Math.min(1, (requirements.phosphorus_kg_ha || 0) / 100);
  const k = Math.min(1, (requirements.potassium_kg_ha || 0) / 100);

  const bars = [
    { label: 'N', value: n, color: '#3b82f6', x: -0.5 },
    { label: 'P', value: p, color: '#f59e0b', x: 0 },
    { label: 'K', value: k, color: '#a855f7', x: 0.5 },
  ];

  return (
    <group>
      {/* soil cross-section */}
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[2, 0.5, 1.2]} />
        <meshStandardMaterial color="#4a3524" />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[2, 0.06, 1.2]} />
        <meshStandardMaterial color="#5d4530" />
      </mesh>
      {bars.map((b) => (
        <group key={b.label} position={[b.x, 0, 0]}>
          <mesh position={[0, Math.max(b.value, 0.04) / 2, 0]}>
            <boxGeometry args={[0.28, Math.max(b.value, 0.04), 0.28]} />
            <meshStandardMaterial color={b.color} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function RecordsLayer({ blockCount, valid }) {
  const shieldRef = useRef();
  useFrame((state) => {
    if (shieldRef.current) {
      shieldRef.current.rotation.y = state.clock.elapsedTime * 0.6;
    }
  });

  const count = Math.max(1, Math.min(blockCount, 6));

  return (
    <group>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[0, -0.5 + i * 0.16, 0]}>
          <boxGeometry args={[1.4 - i * 0.03, 0.1, 0.9 - i * 0.02]} />
          <meshStandardMaterial color={valid ? '#22c55e' : '#ef4444'} transparent opacity={0.85} />
        </mesh>
      ))}
      {valid && (
        <mesh ref={shieldRef} position={[0, 0.55, 0]}>
          <coneGeometry args={[0.22, 0.4, 4]} />
          <meshStandardMaterial color="#16a34a" />
        </mesh>
      )}
    </group>
  );
}

export default function CropPassportScene({ layer, cropName, requirements, chain }) {
  return (
    <>
      <ambientLight intensity={0.85} color="#eafff0" />
      <directionalLight position={[3, 4, 2]} intensity={0.8} color="#fff6dc" />
      {layer === 'field' && <CropField cropName={cropName} size={1.6} />}
      {layer === 'soil' && requirements && <SoilLayer requirements={requirements} />}
      {layer === 'records' && (
        <RecordsLayer blockCount={chain?.blocks?.length || 0} valid={!!chain?.valid} />
      )}
    </>
  );
}
