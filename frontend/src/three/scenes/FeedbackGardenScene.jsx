import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Spec #60 "Feedback Corner": "friendly farm/community visual. Rating
 * interaction -> subtle response. Do not create unnecessary 3D
 * complexity." Five small "petals" bloom open as the user's real
 * `rating` (1-5, the same stars shown in the form) increases — no
 * separate invented metric.
 */
export default function FeedbackGardenScene({ rating = 0, reducedMotion = false }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current || reducedMotion) return;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
  });

  return (
    <>
      <color attach="background" args={['#0f1a14']} />
      <ambientLight intensity={1} color="#fff7e6" />
      <directionalLight position={[2, 3, 2]} intensity={0.6} color="#fde68a" />

      {/* stem */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.5, 6]} />
        <meshStandardMaterial color="#166534" />
      </mesh>

      <group ref={groupRef} position={[0, 0.05, 0]}>
        {Array.from({ length: 5 }).map((_, i) => {
          const open = i < rating;
          const angle = (i / 5) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * (open ? 0.22 : 0.08), Math.sin(angle) * (open ? 0.22 : 0.08), 0]}
              rotation={[0, 0, angle]}
              scale={open ? 1 : 0.5}
            >
              <circleGeometry args={[0.12, 6]} />
              <meshStandardMaterial
                color={open ? '#fbbf24' : '#4b5563'}
                emissive={open ? '#fbbf24' : '#000000'}
                emissiveIntensity={open ? 0.4 : 0}
                side={2}
              />
            </mesh>
          );
        })}
        <mesh>
          <circleGeometry args={[0.07, 12]} />
          <meshStandardMaterial color="#84cc16" />
        </mesh>
      </group>
    </>
  );
}
