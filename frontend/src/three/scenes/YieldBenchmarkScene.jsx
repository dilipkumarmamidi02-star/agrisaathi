import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import CropField from './CropField';

/**
 * Spec #38 "Yield Benchmarks": "your yield vs regional benchmark vs
 * target ... use 3D crop height/density carefully to represent
 * comparative values. Do not visually imply inaccurate real-world
 * scale unless supported by data." Each of the three patches uses the
 * *same* crop visual (so only size differs, never a different crop),
 * scaled by the real ratio to the benchmark — capped so a huge outlier
 * reading never breaks the layout.
 */
function Marker({ position, positive, reducedMotion }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || reducedMotion) return;
    ref.current.position.y = 0.55 + Math.sin(state.clock.elapsedTime * 2) * 0.03;
  });
  return (
    <mesh ref={ref} position={[position[0], 0.55, position[2]]}>
      <coneGeometry args={[0.05, 0.1, 4]} />
      <meshStandardMaterial color={positive ? '#16a34a' : '#f59e0b'} />
    </mesh>
  );
}

export default function YieldBenchmarkScene({ cropName, yourRatio = 1, targetRatio = 1.1, reducedMotion = false }) {
  const clamp = (v) => Math.max(0.35, Math.min(1.3, v));
  const patches = [
    { key: 'yours', x: -0.75, scale: clamp(yourRatio), positive: yourRatio >= 1 },
    { key: 'benchmark', x: 0, scale: 1, positive: true },
    { key: 'target', x: 0.75, scale: clamp(targetRatio), positive: true },
  ];

  return (
    <>
      <color attach="background" args={['#eefaea']} />
      <ambientLight intensity={0.95} color="#f2fff2" />
      <directionalLight position={[3, 4, 2]} intensity={0.9} color="#fff6dc" />

      {patches.map((p) => (
        <group key={p.key} position={[p.x, 0, 0]} scale={[1, p.scale, 1]}>
          <CropField cropName={cropName} size={0.6} stageProgress={1} bladeCount={10} />
        </group>
      ))}

      <Marker position={[-0.75, 0, 0]} positive={patches[0].positive} reducedMotion={reducedMotion} />
    </>
  );
}
