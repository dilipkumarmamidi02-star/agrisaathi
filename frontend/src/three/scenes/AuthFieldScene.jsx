import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Level-3 "subtle depth" scene (spec #65 Authentication Pages).
 * Explicitly NOT a heavy world: one instanced leaf mesh, one soft ground
 * plane, ambient light. No shadows, no post-processing, no textures to
 * download. Pauses drift entirely under prefers-reduced-motion.
 */
const LEAF_COUNT = 26;

function LeafField({ reducedMotion }) {
  const meshRef = useRef();

  const leaves = useMemo(() => {
    return Array.from({ length: LEAF_COUNT }, () => ({
      x: THREE.MathUtils.randFloatSpread(10),
      y: THREE.MathUtils.randFloat(-1, 4),
      z: THREE.MathUtils.randFloat(-4, 2),
      speed: THREE.MathUtils.randFloat(0.15, 0.4),
      spin: THREE.MathUtils.randFloat(0.2, 0.8),
      scale: THREE.MathUtils.randFloat(0.08, 0.18),
      phase: THREE.MathUtils.randFloat(0, Math.PI * 2),
    }));
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    leaves.forEach((leaf, i) => {
      if (!reducedMotion) {
        leaf.y -= leaf.speed * delta;
        if (leaf.y < -2) leaf.y = 4;
        leaf.x += Math.sin(t * 0.5 + leaf.phase) * 0.002;
      }
      dummy.position.set(leaf.x, leaf.y, leaf.z);
      dummy.rotation.set(
        t * leaf.spin * 0.3,
        t * leaf.spin,
        Math.sin(t * 0.4 + leaf.phase)
      );
      dummy.scale.setScalar(leaf.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, LEAF_COUNT]}>
      <circleGeometry args={[1, 5]} />
      <meshStandardMaterial
        color="#4ade80"
        transparent
        opacity={0.35}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

export default function AuthFieldScene({ reducedMotion = false }) {
  return (
    <>
      <ambientLight intensity={0.6} color="#eafff0" />
      <directionalLight position={[3, 5, 2]} intensity={0.5} color="#bff7c8" />
      <LeafField reducedMotion={reducedMotion} />
      {/* Soft ground haze so the field doesn't feel like it's floating in a void */}
      <mesh position={[0, -2.2, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 10]} />
        <meshBasicMaterial color="#0a2b16" transparent opacity={0.25} />
      </mesh>
    </>
  );
}
