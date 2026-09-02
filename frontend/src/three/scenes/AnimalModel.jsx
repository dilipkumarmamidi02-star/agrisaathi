import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getAnimalVisual } from '../config/animalVisuals';

/**
 * One procedural animal built from the category's visual recipe. Shared
 * by Livestock (herd view), Animal Encyclopedia browse preview, and
 * Animal Encyclopedia detail showcase — one implementation, not three.
 *
 * Special-cased categories that don't read as "a body on legs":
 * fisheries (a fish shape, no legs) and apiculture (a hive + orbiting
 * dots) get their own tiny recipes below instead of forcing the general
 * body+legs recipe onto them.
 */
function GenericBodyAnimal({ visual, idleOffset = 0 }) {
  const groupRef = useRef();
  const [bw, bh, bd] = visual.bodySize;

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.6 + idleOffset) * 0.015;
  });

  const legPositions = [
    [bw * 0.32, bd * 0.32],
    [bw * 0.32, -bd * 0.32],
    [-bw * 0.32, bd * 0.32],
    [-bw * 0.32, -bd * 0.32],
  ];

  return (
    <group ref={groupRef}>
      {/* legs */}
      {visual.legHeight > 0 &&
        legPositions.map(([lx, lz], i) => (
          <mesh key={i} position={[lx, visual.legHeight / 2, lz]}>
            <cylinderGeometry args={[0.02, 0.025, visual.legHeight, 6]} />
            <meshStandardMaterial color={visual.legColor} />
          </mesh>
        ))}

      {/* body */}
      <mesh position={[0, visual.legHeight + bh / 2, 0]}>
        <boxGeometry args={[bw, bh, bd]} />
        <meshStandardMaterial color={visual.bodyColor} />
      </mesh>

      {/* patch/marking accent (spots, comb, snout tint depending on category) */}
      <mesh position={[bw * 0.32, visual.legHeight + bh * 0.7, 0]}>
        <boxGeometry args={[bw * 0.22, bh * 0.35, bd * 0.5]} />
        <meshStandardMaterial color={visual.patchColor} />
      </mesh>

      {/* head */}
      <mesh position={[bw * 0.55, visual.legHeight + bh * 0.8, 0]}>
        <boxGeometry args={[bw * 0.22, bh * 0.5, bd * 0.55]} />
        <meshStandardMaterial color={visual.bodyColor} />
      </mesh>

      {/* horns, if this category has them */}
      {visual.hasHorns && (
        <>
          <mesh position={[bw * 0.6, visual.legHeight + bh * 1.15, bd * 0.15]} rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.02, 0.12, 5]} />
            <meshStandardMaterial color="#d9cba8" />
          </mesh>
          <mesh position={[bw * 0.6, visual.legHeight + bh * 1.15, -bd * 0.15]} rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.02, 0.12, 5]} />
            <meshStandardMaterial color="#d9cba8" />
          </mesh>
        </>
      )}
    </group>
  );
}

function FishAnimal({ visual, idleOffset = 0 }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + idleOffset;
    ref.current.position.y = 0.05 + Math.sin(t * 1.5) * 0.03;
    ref.current.rotation.y = Math.sin(t * 0.8) * 0.4;
  });
  const [bw, bh] = visual.bodySize;
  return (
    <group ref={ref}>
      <mesh>
        <coneGeometry args={[bh, bw, 6]} />
        <meshStandardMaterial color={visual.bodyColor} />
      </mesh>
      <mesh position={[-bw * 0.55, 0, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[bh * 0.7, bw * 0.4, 4]} />
        <meshStandardMaterial color={visual.patchColor} />
      </mesh>
    </group>
  );
}

function HiveAnimal({ visual }) {
  const bees = useMemo(
    () =>
      Array.from({ length: 5 }, () => ({
        r: THREE.MathUtils.randFloat(0.12, 0.22),
        speed: THREE.MathUtils.randFloat(0.8, 1.6),
        phase: THREE.MathUtils.randFloat(0, Math.PI * 2),
        y: THREE.MathUtils.randFloat(0.15, 0.3),
      })),
    []
  );
  const beeRefs = useRef([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    bees.forEach((b, i) => {
      const mesh = beeRefs.current[i];
      if (!mesh) return;
      mesh.position.set(Math.cos(t * b.speed + b.phase) * b.r, b.y, Math.sin(t * b.speed + b.phase) * b.r);
    });
  });

  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.06 + i * 0.09, 0]}>
          <boxGeometry args={[0.24 - i * 0.02, 0.08, 0.24 - i * 0.02]} />
          <meshStandardMaterial color={visual.bodyColor} />
        </mesh>
      ))}
      {bees.map((b, i) => (
        <mesh key={i} ref={(el) => (beeRefs.current[i] = el)}>
          <sphereGeometry args={[0.015, 6, 6]} />
          <meshStandardMaterial color={visual.patchColor} />
        </mesh>
      ))}
    </group>
  );
}

export default function AnimalModel({ category, idleOffset = 0, position = [0, 0, 0], maturity = 1 }) {
  const visual = getAnimalVisual(category);
  const s = Math.max(0.35, Math.min(1, maturity));
  return (
    <group position={position} scale={[s, s, s]}>
      {visual.hive ? (
        <HiveAnimal visual={visual} />
      ) : visual.water ? (
        <FishAnimal visual={visual} idleOffset={idleOffset} />
      ) : (
        <GenericBodyAnimal visual={visual} idleOffset={idleOffset} />
      )}
    </group>
  );
}
