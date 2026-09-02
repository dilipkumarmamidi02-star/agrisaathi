import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import CropField from './CropField';

/**
 * Spec #35 "Irrigation Planner": "crop field, irrigation channels, water
 * movement, moisture zones ... changing crop -> crop changes, changing
 * method -> irrigation animation changes." Driven by the farmer's real
 * next-upcoming IrrigationSession (plot_name/crop_name/method) — falls
 * back to a calm unwatered field when nothing is scheduled yet (spec
 * #74 empty state), never invents a session.
 */
function DripLines({ reducedMotion }) {
  const refs = useRef([]);
  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.material.opacity = 0.4 + Math.sin(t * 2.2 + i) * 0.25;
    });
  });
  const lines = [-0.6, -0.2, 0.2, 0.6];
  return (
    <>
      {lines.map((x, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} position={[x, 0.02, 0]}>
          <boxGeometry args={[0.03, 0.01, 1.6]} />
          <meshStandardMaterial color="#3b82f6" transparent opacity={0.6} />
        </mesh>
      ))}
    </>
  );
}

function SprinklerArc({ reducedMotion }) {
  const groupRef = useRef();
  const dropsRef = useRef([]);
  const drops = useMemo(
    () => Array.from({ length: 14 }, () => ({
      angle: THREE.MathUtils.randFloat(0, Math.PI * 2),
      radius: THREE.MathUtils.randFloat(0.15, 0.75),
      speed: THREE.MathUtils.randFloat(0.5, 0.9),
      phase: THREE.MathUtils.randFloat(0, 1),
    })),
    []
  );
  useFrame((state, delta) => {
    if (groupRef.current && !reducedMotion) groupRef.current.rotation.y += delta * 0.6;
    dropsRef.current.forEach((m, i) => {
      if (!m || reducedMotion) return;
      const d = drops[i];
      m.position.y = 0.5 - ((state.clock.elapsedTime * d.speed + d.phase) % 0.5);
    });
  });
  return (
    <group ref={groupRef} position={[0, 0.3, 0]}>
      <mesh>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
        <meshStandardMaterial color="#5d6d7e" />
      </mesh>
      {drops.map((d, i) => (
        <mesh
          key={i}
          ref={(el) => (dropsRef.current[i] = el)}
          position={[Math.cos(d.angle) * d.radius, 0.5, Math.sin(d.angle) * d.radius]}
        >
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial color="#6fa8c9" transparent opacity={0.75} />
        </mesh>
      ))}
    </group>
  );
}

function FloodSheet({ reducedMotion }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || reducedMotion) return;
    ref.current.material.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 1.2) * 0.1;
  });
  return (
    <mesh ref={ref} position={[0, 0.015, 0]}>
      <boxGeometry args={[1.75, 0.015, 1.75]} />
      <meshStandardMaterial color="#6fa8c9" transparent opacity={0.55} />
    </mesh>
  );
}

function FurrowRows() {
  const rows = [-0.7, -0.35, 0, 0.35, 0.7];
  return (
    <>
      {rows.map((z, i) => (
        <mesh key={i} position={[0, 0.005, z]}>
          <boxGeometry args={[1.7, 0.015, 0.08]} />
          <meshStandardMaterial color="#6fa8c9" transparent opacity={0.5} />
        </mesh>
      ))}
    </>
  );
}

function RainCloud({ reducedMotion }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || reducedMotion) return;
    ref.current.position.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.3;
  });
  return (
    <mesh ref={ref} position={[0, 1.1, 0]}>
      <sphereGeometry args={[0.25, 10, 10]} />
      <meshStandardMaterial color="#c7cfd1" />
    </mesh>
  );
}

export default function IrrigationFieldScene({ cropName, method = 'drip', hasSession, reducedMotion = false }) {
  return (
    <>
      <color attach="background" args={['#eaf5ea']} />
      <ambientLight intensity={0.95} color="#f2fff2" />
      <directionalLight position={[3, 4, 2]} intensity={0.9} color="#fff6dc" />

      <CropField cropName={cropName} size={1.8} stageProgress={hasSession ? 1 : 0.55} />

      {hasSession && method === 'drip' && <DripLines reducedMotion={reducedMotion} />}
      {hasSession && method === 'sprinkler' && <SprinklerArc reducedMotion={reducedMotion} />}
      {hasSession && method === 'flood' && <FloodSheet reducedMotion={reducedMotion} />}
      {hasSession && method === 'furrow' && <FurrowRows />}
      {hasSession && method === 'rainfed' && <RainCloud reducedMotion={reducedMotion} />}
    </>
  );
}
