import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getCommodityVisual } from '../config/marketVisuals';

/**
 * A produce heap for one stall. Shape reads as "sack" (rounded mound),
 * "crate" (grid of small piles), or "bale"/"bundle" (stacked cylinders)
 * per the commodity's real shape from marketVisuals — same spirit as
 * CropField's blade recipe, but for harvested/sold produce rather than
 * a growing plant.
 */
function ProduceHeap({ color, accent, shape, active }) {
  const bits = useMemo(() => {
    const count = shape === 'crate' ? 9 : 12;
    return Array.from({ length: count }, () => ({
      x: THREE.MathUtils.randFloatSpread(shape === 'crate' ? 0.55 : 0.4),
      z: THREE.MathUtils.randFloatSpread(shape === 'crate' ? 0.55 : 0.4),
      y: THREE.MathUtils.randFloat(0.05, 0.2),
      r: THREE.MathUtils.randFloat(0.06, 0.12),
    }));
  }, [shape]);

  if (shape === 'bale' || shape === 'bundle') {
    return (
      <group>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[0, 0.1 + i * 0.16, 0]}>
            <cylinderGeometry args={[0.28 - i * 0.03, 0.28 - i * 0.03, 0.14, 10]} />
            <meshStandardMaterial color={i % 2 === 0 ? color : accent} />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group>
      {bits.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, b.z]}>
          <sphereGeometry args={[b.r * (active ? 1 : 0.85), 8, 8]} />
          <meshStandardMaterial color={i % 4 === 0 ? accent : color} />
        </mesh>
      ))}
    </group>
  );
}

function MandiStall({ commodityName, position = [0, 0, 0], active = false }) {
  const visual = getCommodityVisual(commodityName);
  const scale = active ? 1 : 0.72;

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <boxGeometry args={[1, 0.06, 0.9]} />
        <meshStandardMaterial color="#7a5c3a" />
      </mesh>

      {[
        [-0.42, 0.38, -0.38],
        [0.42, 0.38, -0.38],
        [-0.42, 0.38, 0.38],
        [0.42, 0.38, 0.38],
      ].map((p, i) => (
        <mesh key={i} position={p}>
          <cylinderGeometry args={[0.02, 0.02, 0.76, 6]} />
          <meshStandardMaterial color="#5a4530" />
        </mesh>
      ))}

      <mesh position={[0, 0.78, 0]} rotation={[0.04, 0, 0]}>
        <boxGeometry args={[1.1, 0.05, 1]} />
        <meshStandardMaterial color={visual.accent} />
      </mesh>

      <ProduceHeap color={visual.color} accent={visual.accent} shape={visual.shape} active={active} />
    </group>
  );
}

/**
 * Real 3D mandi (spec #17). `commodities` is a small (<=3) real list the
 * page derives from its own fetched market records — this component
 * never invents a commodity or a price, it only renders what it's given.
 */
export default function MandiScene({ commodities = [], reducedMotion = false }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.05;
  });

  const list = commodities.slice(0, 3);
  const spacing = 1.3;
  const offset = ((list.length - 1) * spacing) / 2;

  return (
    <>
      <color attach="background" args={['#f4e8cf']} />
      <ambientLight intensity={0.9} color="#fff6df" />
      <directionalLight position={[3, 4, 2]} intensity={0.85} color="#fff2cf" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]} receiveShadow>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color="#c9b183" />
      </mesh>

      <group ref={groupRef}>
        {list.length === 0 ? (
          <MandiStall commodityName={null} active />
        ) : (
          list.map((c, i) => (
            <MandiStall
              key={c.name + i}
              commodityName={c.name}
              active={!!c.active}
              position={[i * spacing - offset, 0, c.active ? 0.15 : 0]}
            />
          ))
        )}
      </group>
    </>
  );
}
