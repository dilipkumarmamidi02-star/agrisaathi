import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Spec #61 "Support Tickets": "support/help center. Ticket states
 * (open/pending/resolved) can have subtle visual states. Prioritize
 * readability." A small lamp glows amber while `openCount` (real,
 * unresolved tickets) is > 0 and settles to green once everything the
 * user has filed is resolved.
 */
export default function SupportDeskScene({ openCount = 0, resolvedCount = 0, reducedMotion = false }) {
  const lampRef = useRef();
  const hasOpen = openCount > 0;

  useFrame((state) => {
    if (!lampRef.current || reducedMotion || !hasOpen) return;
    lampRef.current.intensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.25;
  });

  return (
    <>
      <color attach="background" args={['#101a14']} />
      <ambientLight intensity={0.9} color="#eafaf0" />
      <pointLight ref={lampRef} position={[0, 0.5, 0.6]} intensity={0.6} color={hasOpen ? '#f59e0b' : '#22c55e'} />

      {/* help desk */}
      <mesh position={[0, -0.32, 0]}>
        <boxGeometry args={[1.6, 0.05, 0.9]} />
        <meshStandardMaterial color="#3f3226" />
      </mesh>

      {/* ticket stack — open tickets in front, resolved stacked behind, capped for legibility */}
      {Array.from({ length: Math.min(4, Math.max(1, openCount)) }).map((_, i) => (
        <mesh key={`open-${i}`} position={[-0.4 + i * 0.06, -0.2 + i * 0.02, 0.1]} rotation={[0, 0, 0.05 * i]}>
          <boxGeometry args={[0.28, 0.36, 0.01]} />
          <meshStandardMaterial color="#fef3c7" />
        </mesh>
      ))}
      {Array.from({ length: Math.min(4, Math.max(0, resolvedCount)) }).map((_, i) => (
        <mesh key={`done-${i}`} position={[0.4 + i * 0.03, -0.24 + i * 0.015, -0.1]}>
          <boxGeometry args={[0.28, 0.36, 0.01]} />
          <meshStandardMaterial color="#bbf7d0" />
        </mesh>
      ))}
    </>
  );
}
