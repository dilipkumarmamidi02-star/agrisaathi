import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Spec #36 "Farm Ledger": "Do NOT turn financial records into excessive
 * 3D. Use a farm document desk / field-ledger metaphor, subtle 3D
 * crops/machinery, animated financial cards. Focus on usability." This
 * is intentionally small and calm: a document-stack that tilts green
 * when the real hash chain is valid, amber if it fails integrity, plus
 * two thin bars for real income/expense proportions — no invented
 * numbers, everything is the same net/valid the page already computed.
 */
export default function LedgerDeskScene({ valid = true, incomeRatio = 0.5, reducedMotion = false }) {
  const stackRef = useRef();
  useFrame((state) => {
    if (!stackRef.current || reducedMotion) return;
    stackRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
  });

  const clamped = Math.max(0, Math.min(1, incomeRatio));

  return (
    <>
      <color attach="background" args={['#f3f0e6']} />
      <ambientLight intensity={1} color="#fffaf0" />
      <directionalLight position={[2, 3, 2]} intensity={0.8} color="#fff2cf" />

      {/* desk */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[1.6, 0.05, 0.9]} />
        <meshStandardMaterial color="#7a5c3a" />
      </mesh>

      {/* document stack, tilts by chain validity */}
      <group ref={stackRef} position={[-0.35, 0.05, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, i * 0.02, 0]} rotation={[0, i * 0.05, 0]}>
            <boxGeometry args={[0.4, 0.015, 0.55]} />
            <meshStandardMaterial color={valid ? '#f5f5ea' : '#f7e6c8'} />
          </mesh>
        ))}
        <mesh position={[0, 0.075, 0]}>
          <boxGeometry args={[0.06, 0.01, 0.06]} />
          <meshStandardMaterial
            color={valid ? '#16a34a' : '#f59e0b'}
            emissive={valid ? '#16a34a' : '#f59e0b'}
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {/* income/expense bars, real proportion */}
      <mesh position={[0.35, clamped * 0.25, -0.15]}>
        <boxGeometry args={[0.14, Math.max(0.02, clamped * 0.5), 0.14]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>
      <mesh position={[0.55, (1 - clamped) * 0.25, -0.15]}>
        <boxGeometry args={[0.14, Math.max(0.02, (1 - clamped) * 0.5), 0.14]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
    </>
  );
}
