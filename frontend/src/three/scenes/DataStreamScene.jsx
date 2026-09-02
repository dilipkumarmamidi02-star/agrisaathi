import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Spec #54 "Export Data": "clean data export center... data nodes,
 * structured datasets, export animation." `datasetCount` (real number
 * of exportable dataset types wired on the page) sets how many nodes
 * orbit. Kept deliberately calm — this is an admin utility, not a
 * showcase (spec #64 Level 3).
 */
export default function DataStreamScene({ datasetCount = 4, reducedMotion = false }) {
  const groupRef = useRef();
  const nodes = useMemo(
    () =>
      Array.from({ length: Math.max(1, Math.min(8, datasetCount)) }, (_, i) => ({
        angle: (i / Math.max(1, datasetCount)) * Math.PI * 2,
        radius: 0.55 + (i % 2) * 0.15,
        color: ['#22d3ee', '#4ade80', '#facc15', '#f472b6'][i % 4],
      })),
    [datasetCount]
  );

  useFrame((state) => {
    if (!groupRef.current || reducedMotion) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.25;
  });

  return (
    <>
      <color attach="background" args={['#0b1420']} />
      <ambientLight intensity={0.9} color="#e0f2fe" />
      <pointLight position={[0, 0, 1.5]} intensity={0.8} color="#38bdf8" />

      {/* central node = the export action itself */}
      <mesh>
        <icosahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.4} wireframe />
      </mesh>

      <group ref={groupRef}>
        {nodes.map((n, i) => {
          const x = Math.cos(n.angle) * n.radius;
          const z = Math.sin(n.angle) * n.radius;
          return (
            <group key={i}>
              <mesh position={[x, 0, z]}>
                <boxGeometry args={[0.12, 0.12, 0.12]} />
                <meshStandardMaterial color={n.color} emissive={n.color} emissiveIntensity={0.4} />
              </mesh>
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={2}
                    array={new Float32Array([0, 0, 0, x, 0, z])}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial color={n.color} transparent opacity={0.35} />
              </line>
            </group>
          );
        })}
      </group>
    </>
  );
}
