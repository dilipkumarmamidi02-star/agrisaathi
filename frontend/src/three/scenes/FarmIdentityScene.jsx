import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Spec #62 "Profile Settings": "clean farmer profile environment.
 * Subtle: farm identity, location, language, preferences. Do not make
 * settings difficult." A single small plot marker that scales with the
 * real `landSizeAcres` the farmer entered (clamped for legibility) and
 * shows a crop tuft only once they've actually typed a `primaryCrop` —
 * nothing is invented before the form has real values.
 */
export default function FarmIdentityScene({ landSizeAcres = 0, hasCrop = false, reducedMotion = false }) {
  const groupRef = useRef();
  const size = Math.max(0.4, Math.min(1.1, 0.4 + Number(landSizeAcres || 0) * 0.05));

  useFrame((state) => {
    if (!groupRef.current || reducedMotion) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
  });

  return (
    <>
      <color attach="background" args={['#0f1a14']} />
      <ambientLight intensity={1} color="#eafaf0" />
      <directionalLight position={[2, 3, 2]} intensity={0.6} color="#bff7c8" />

      <group ref={groupRef}>
        {/* the plot boundary, sized by real land size */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 0.9, size, 4]} />
          <meshStandardMaterial color="#4ade80" transparent opacity={0.5} side={2} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <circleGeometry args={[size * 0.85, 4]} />
          <meshStandardMaterial color="#166534" transparent opacity={0.6} side={2} />
        </mesh>

        {hasCrop && (
          <mesh position={[0, 0.08, 0]}>
            <coneGeometry args={[0.09, 0.22, 8]} />
            <meshStandardMaterial color="#22c55e" />
          </mesh>
        )}
      </group>
    </>
  );
}
