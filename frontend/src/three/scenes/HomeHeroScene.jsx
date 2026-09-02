import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getWeatherVisual } from '../config/cropVisuals';

/**
 * Home hero (spec #7). Cinematic but cheap: three flattened cones for
 * distant mountains, one grass plane with a handful of swaying blades, a
 * sky-color driven by the *real* weather fetched on Home (not invented),
 * and light rain particles only when the real condition says it's
 * raining. No OrbitControls — the hero must stay fast and not compete
 * with the page's own voice button and quick-link grid below it.
 */
function Mountains() {
  return (
    <group position={[0, -0.1, -6]}>
      <mesh position={[-2.4, 0.6, 0]}>
        <coneGeometry args={[2, 1.6, 4]} />
        <meshStandardMaterial color="#5b7a6a" />
      </mesh>
      <mesh position={[0.6, 0.9, -1]}>
        <coneGeometry args={[2.6, 2.1, 4]} />
        <meshStandardMaterial color="#4a6858" />
      </mesh>
      <mesh position={[3, 0.5, 0.5]}>
        <coneGeometry args={[1.8, 1.4, 4]} />
        <meshStandardMaterial color="#5b7a6a" />
      </mesh>
    </group>
  );
}

function GrassField({ reducedMotion }) {
  const count = 30;
  const blades = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: THREE.MathUtils.randFloatSpread(9),
        z: THREE.MathUtils.randFloat(-1, 2.5),
        phase: THREE.MathUtils.randFloat(0, Math.PI * 2),
        scale: THREE.MathUtils.randFloat(0.6, 1.2),
      })),
    []
  );
  const refs = useRef([]);

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.rotation.z = Math.sin(t * 0.9 + blades[i].phase) * 0.18;
    });
  });

  return (
    <group position={[0, -1.3, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial color="#1c4028" />
      </mesh>
      {blades.map((b, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} position={[b.x, 0.2 * b.scale, b.z]}>
          <coneGeometry args={[0.04, 0.4 * b.scale, 5]} />
          <meshStandardMaterial color="#4f8c3f" />
        </mesh>
      ))}
    </group>
  );
}

function Rain({ intensity = 40 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(intensity * 3);
    for (let i = 0; i < intensity; i++) {
      arr[i * 3] = THREE.MathUtils.randFloatSpread(10);
      arr[i * 3 + 1] = THREE.MathUtils.randFloat(0, 4);
      arr[i * 3 + 2] = THREE.MathUtils.randFloatSpread(6);
    }
    return arr;
  }, [intensity]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < intensity; i++) {
      arr[i * 3 + 1] -= delta * 3.5;
      if (arr[i * 3 + 1] < -1) arr[i * 3 + 1] = 4;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#cfe0e8" size={0.03} transparent opacity={0.6} />
    </points>
  );
}

export default function HomeHeroScene({ condition = 'default', reducedMotion = false }) {
  const wv = getWeatherVisual(condition);
  const raining = condition === 'rain' || condition === 'storm';

  return (
    <>
      <color attach="background" args={[wv.sky]} />
      {wv.fog && <fog attach="fog" args={[wv.fog, 5, 14]} />}
      <ambientLight intensity={wv.intensity * 0.8} color={wv.light} />
      <directionalLight position={[3, 5, 2]} intensity={wv.intensity} color={wv.light} />
      <Mountains />
      <GrassField reducedMotion={reducedMotion} />
      {raining && !reducedMotion && <Rain intensity={condition === 'storm' ? 70 : 35} />}
    </>
  );
}
