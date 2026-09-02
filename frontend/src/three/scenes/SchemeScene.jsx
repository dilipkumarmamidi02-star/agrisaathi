import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Subtle government-benefit motif (spec #27/#65: schemes get contextual
 * but not heavy 3D). A small stack of "document" cards with a gold
 * accent stripe, gently rotating — used when a Speak to AgriSaathi
 * question is about schemes/subsidies/loans (spec #14 example: "What
 * schemes are available?" → scheme/benefit context).
 */
export default function SchemeScene({ reducedMotion = false }) {
  const groupRef = useRef();
  useFrame((state, delta) => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.3;
  });

  return (
    <>
      <color attach="background" args={['#eef3ea']} />
      <ambientLight intensity={0.95} color="#fff6df" />
      <directionalLight position={[2, 4, 3]} intensity={0.85} color="#fff2cf" />

      <group ref={groupRef}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, i * 0.06, -i * 0.08]} rotation={[0, i * 0.08, 0]}>
            <boxGeometry args={[1, 0.04, 1.35]} />
            <meshStandardMaterial color={i === 0 ? '#ffffff' : '#f4efe0'} />
          </mesh>
        ))}
        <mesh position={[0, 0.09, 0.4]}>
          <boxGeometry args={[1.02, 0.01, 0.1]} />
          <meshStandardMaterial color="#d9a441" />
        </mesh>
      </group>
    </>
  );
}
