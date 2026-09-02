import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Spec #58 "Sustainability Score": "living farm ecosystem
 * visualization. Score can influence: vegetation density, soil health
 * visualization, water efficiency, energy indicators. Do not visually
 * exaggerate unsupported metrics." `score` is the real 0-100 self-
 * assessment computed from the practices the farmer actually checked —
 * this scene only ever renders that number, never a guess.
 */
const MAX_PLANTS = 14;

export default function EcosystemScene({ score = 0, reducedMotion = false }) {
  const groupRef = useRef();
  const plantCount = Math.max(1, Math.round((score / 100) * MAX_PLANTS));

  const positions = useMemo(
    () =>
      Array.from({ length: MAX_PLANTS }, () => ({
        x: THREE.MathUtils.randFloatSpread(1.8),
        z: THREE.MathUtils.randFloatSpread(0.6),
        h: THREE.MathUtils.randFloat(0.14, 0.26),
        phase: Math.random() * Math.PI * 2,
      })),
    []
  );

  useFrame((state) => {
    if (!groupRef.current || reducedMotion) return;
    groupRef.current.children.forEach((child, i) => {
      child.rotation.z = Math.sin(state.clock.elapsedTime * 0.7 + positions[i]?.phase) * 0.08;
    });
  });

  // soil tone shifts from bare tan (low score) to rich dark loam (high score)
  const soilColor = new THREE.Color('#a3865a').lerp(new THREE.Color('#2b3a1c'), score / 100).getStyle();

  return (
    <>
      <color attach="background" args={['#0f1a14']} />
      <ambientLight intensity={1} color="#eafaf0" />
      <directionalLight position={[2, 3, 2]} intensity={0.6} color="#bff7c8" />

      <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 0.9]} />
        <meshStandardMaterial color={soilColor} />
      </mesh>

      <group ref={groupRef}>
        {positions.slice(0, plantCount).map((p, i) => (
          <mesh key={i} position={[p.x, -0.3 + p.h / 2, p.z]}>
            <coneGeometry args={[0.04, p.h, 6]} />
            <meshStandardMaterial color="#22c55e" />
          </mesh>
        ))}
      </group>

      {/* water droplet indicator — only shown once score reflects at least some practices */}
      {score > 40 && (
        <mesh position={[0.9, 0.15, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.4} />
        </mesh>
      )}
    </>
  );
}
