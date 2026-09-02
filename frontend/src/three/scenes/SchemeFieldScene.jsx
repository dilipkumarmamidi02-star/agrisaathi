import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Spec #27 "Government Schemes": Level-2 contextual 3D (spec #64) — a
 * stack of benefit-document cards, not a heavy world. Reacts to the
 * *real* eligibility-check result for the currently open scheme
 * (GovernmentSchemes.jsx `results[s.id].status`), never invents one.
 *
 * status: 'likely_eligible' | 'likely_not_eligible' | 'needs_more_info' | null
 */
const STATUS_ACCENT = {
  likely_eligible: '#22c55e',
  likely_not_eligible: '#ef4444',
  needs_more_info: '#f59e0b',
  default: '#d9a441',
};

export default function SchemeFieldScene({ status = null, schemeCount = 0, reducedMotion = false }) {
  const groupRef = useRef();
  const glowRef = useRef();
  const accent = STATUS_ACCENT[status] || STATUS_ACCENT.default;

  useFrame((state, delta) => {
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y += delta * 0.25;
    }
    if (glowRef.current) {
      const t = state.clock.elapsedTime;
      glowRef.current.material.opacity = 0.25 + Math.sin(t * 2) * 0.1;
    }
  });

  // Stack height loosely reflects how many schemes are on screen
  // (spec #5: data-driven, not hardcoded) — capped so it never looks silly.
  const cardCount = Math.max(2, Math.min(5, schemeCount || 3));

  return (
    <>
      <color attach="background" args={['#eef3ea']} />
      <ambientLight intensity={0.95} color="#fff6df" />
      <directionalLight position={[2, 4, 3]} intensity={0.85} color="#fff2cf" />

      <group ref={groupRef}>
        {Array.from({ length: cardCount }, (_, i) => (
          <mesh key={i} position={[0, i * 0.06, -i * 0.06]} rotation={[0, i * 0.06, 0]}>
            <boxGeometry args={[1.1, 0.04, 1.45]} />
            <meshStandardMaterial color={i === 0 ? '#ffffff' : '#f4efe0'} />
          </mesh>
        ))}
        {/* accent stripe reflects the real eligibility status */}
        <mesh position={[0, cardCount * 0.06 + 0.03, 0.42]}>
          <boxGeometry args={[1.12, 0.012, 0.1]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} />
        </mesh>
        {status && (
          <mesh ref={glowRef} position={[0, cardCount * 0.06 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.62, 0.72, 32]} />
            <meshBasicMaterial color={accent} transparent opacity={0.3} />
          </mesh>
        )}
      </group>
    </>
  );
}
