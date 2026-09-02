import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getCropVisual } from '../config/cropVisuals';

/**
 * The single reusable "a patch of crop X" renderer (spec #4/#84: shared
 * infrastructure instead of a bespoke scene per page). Every module that
 * needs to show "the user's selected crop" mounts this instead of
 * reimplementing blades/soil/water.
 *
 * @param cropName        real crop name/string driving color+shape via cropVisuals
 * @param stageProgress   0..1 growth progress (1 = fully grown). Lets
 *                        Crop Encyclopedia / Crop Planner drive real
 *                        growth-stage interaction without duplicating code.
 * @param size            footprint of the soil bed (world units)
 * @param bladeCount      override density; defaults from crop visual
 */
export default function CropField({
  cropName,
  stageProgress = 1,
  size = 1.7,
  bladeCount,
  position = [0, 0, 0],
}) {
  const visual = getCropVisual(cropName);
  const count = bladeCount ?? (visual.density === 'dense' ? 40 : visual.density === 'medium' ? 24 : 14);

  const blades = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: THREE.MathUtils.randFloatSpread(size * 0.85),
        z: THREE.MathUtils.randFloatSpread(size * 0.85),
        phase: THREE.MathUtils.randFloat(0, Math.PI * 2),
        scale: THREE.MathUtils.randFloat(0.7, 1.15),
      })),
    [count, size]
  );

  const bladeRefs = useRef([]);
  const clampedStage = Math.max(0.08, Math.min(1, stageProgress));

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    bladeRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      mesh.rotation.z = Math.sin(t * 1.4 + blades[i].phase) * 0.12;
    });
  });

  return (
    <group position={position}>
      <mesh position={[0, -0.02, 0]} receiveShadow>
        <boxGeometry args={[size, 0.05, size]} />
        <meshStandardMaterial color="#3f3123" />
      </mesh>

      {visual.water && (
        <mesh position={[0, 0.005, 0]}>
          <boxGeometry args={[size * 0.92, 0.01, size * 0.92]} />
          <meshStandardMaterial color="#6fa8c9" transparent opacity={0.55} />
        </mesh>
      )}

      {blades.map((b, i) => {
        const h = visual.height * b.scale * clampedStage;
        return (
          <mesh
            key={i}
            ref={(el) => (bladeRefs.current[i] = el)}
            position={[b.x, h * 0.5, b.z]}
          >
            <coneGeometry args={[0.05 * b.scale * (0.5 + clampedStage * 0.5), Math.max(h, 0.02), 5]} />
            <meshStandardMaterial color={visual.color} />
          </mesh>
        );
      })}

      {/* a few accent blossoms/bolls once the crop is mostly grown */}
      {clampedStage > 0.7 &&
        blades.slice(0, Math.ceil(blades.length / 3)).map((b, i) => (
          <mesh key={`acc-${i}`} position={[b.x, visual.height * b.scale * clampedStage + 0.04, b.z]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color={visual.accent} />
          </mesh>
        ))}
    </group>
  );
}
