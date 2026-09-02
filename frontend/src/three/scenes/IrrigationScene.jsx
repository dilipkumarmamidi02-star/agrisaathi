import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Lightweight irrigation/water diorama — used when a Speak to AgriSaathi
 * question is about irrigation/watering (spec #14 example: "When should
 * I irrigate?" → irrigation/water environment) and by any future module
 * that needs a generic "watering a field" visual without committing to
 * one specific crop.
 */
function Droplets({ count = 10, reducedMotion }) {
  const ref = useRef();
  const drops = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: THREE.MathUtils.randFloatSpread(1.2),
        z: THREE.MathUtils.randFloatSpread(1.2),
        y: THREE.MathUtils.randFloat(0.3, 1.1),
        speed: THREE.MathUtils.randFloat(0.6, 1.1),
      })),
    [count]
  );
  const refs = useRef([]);

  useFrame((state, delta) => {
    if (reducedMotion) return;
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.position.y -= delta * drops[i].speed;
      if (m.position.y < 0.02) m.position.y = 1.1;
    });
  });

  return (
    <group ref={ref}>
      {drops.map((d, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} position={[d.x, d.y, d.z]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color="#6fa8c9" transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}

export default function IrrigationScene({ reducedMotion = false }) {
  const waterRef = useRef();
  useFrame((state) => {
    if (reducedMotion || !waterRef.current) return;
    waterRef.current.material.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 1.4) * 0.08;
  });

  return (
    <>
      <color attach="background" args={['#bfe3ff']} />
      <ambientLight intensity={0.9} color="#eafff0" />
      <directionalLight position={[3, 4, 2]} intensity={0.9} color="#fff6dc" />

      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[2.2, 0.08, 1.6]} />
        <meshStandardMaterial color="#3f3123" />
      </mesh>

      {/* irrigation channel */}
      <mesh position={[0, -0.09, 0]}>
        <boxGeometry args={[2.2, 0.03, 0.35]} />
        <meshStandardMaterial ref={waterRef} color="#6fa8c9" transparent opacity={0.55} />
      </mesh>

      {[-0.8, -0.3, 0.2, 0.7].map((x, i) => (
        <mesh key={i} position={[x, 0.05, 0.5]}>
          <coneGeometry args={[0.05, 0.3, 5]} />
          <meshStandardMaterial color="#4f8c3f" />
        </mesh>
      ))}

      <Droplets reducedMotion={reducedMotion} />
    </>
  );
}
