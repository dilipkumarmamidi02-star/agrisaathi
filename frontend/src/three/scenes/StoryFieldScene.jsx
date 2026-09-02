import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Spec #59 "Success Stories": "immersive agricultural story gallery...
 * farm imagery, subtle 3D depth, farmer stories, results. Keep
 * storytelling primary." A small cluster of crop plants, one per real
 * story shared (capped at 8 for legibility), each topped with a
 * trophy-gold bud — nothing invented beyond the actual story count.
 */
export default function StoryFieldScene({ storyCount = 0, reducedMotion = false }) {
  const groupRef = useRef();
  const plants = Math.max(1, Math.min(8, storyCount || 1));

  useFrame((state) => {
    if (!groupRef.current || reducedMotion) return;
    groupRef.current.children.forEach((child, i) => {
      child.rotation.z = Math.sin(state.clock.elapsedTime * 0.8 + i) * 0.06;
    });
  });

  return (
    <>
      <color attach="background" args={['#0f1a14']} />
      <ambientLight intensity={1} color="#fff7e6" />
      <directionalLight position={[2, 3, 2]} intensity={0.6} color="#fde68a" />

      {/* ground */}
      <mesh position={[0, -0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 1]} />
        <meshStandardMaterial color="#3f6212" />
      </mesh>

      <group ref={groupRef}>
        {Array.from({ length: plants }).map((_, i) => {
          const x = (i - (plants - 1) / 2) * 0.22;
          return (
            <group key={i} position={[x, -0.12, 0]}>
              <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.015, 0.02, 0.22, 5]} />
                <meshStandardMaterial color="#166534" />
              </mesh>
              <mesh position={[0, 0.24, 0]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.3} />
              </mesh>
            </group>
          );
        })}
      </group>
    </>
  );
}
