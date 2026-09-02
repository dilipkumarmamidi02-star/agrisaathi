import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getWeatherVisual } from '../config/cropVisuals';

/**
 * Compact, card-sized weather diorama (spec #30). Shares WEATHER_VISUALS
 * with HomeHeroScene so a "rain" condition looks the same whether it's
 * on Home or here, but this one is sized/composed for the smaller
 * cards on Weather / Weather Alerts / Weather Analytics rather than a
 * full-bleed hero, and it also reacts to real wind speed (grass sway +
 * cloud drift speed), which Home's hero doesn't currently receive.
 */
function Sun() {
  return (
    <mesh position={[2.1, 2.2, -2]}>
      <sphereGeometry args={[0.4, 16, 16]} />
      <meshBasicMaterial color="#ffdd7a" />
    </mesh>
  );
}

function Clouds({ count = 4, drift = 0.05 }) {
  const groupRef = useRef();
  const puffs = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: THREE.MathUtils.randFloatSpread(6),
        y: THREE.MathUtils.randFloat(1.5, 2.3),
        z: THREE.MathUtils.randFloatSpread(3) - 2,
        scale: THREE.MathUtils.randFloat(0.55, 1.05),
      })),
    [count]
  );

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((c) => {
      c.position.x += delta * drift;
      if (c.position.x > 4.5) c.position.x = -4.5;
    });
  });

  return (
    <group ref={groupRef}>
      {puffs.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} scale={p.scale}>
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function GroundGrass({ reducedMotion, windSpeed = 0 }) {
  const count = 20;
  const blades = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: THREE.MathUtils.randFloatSpread(4.4),
        z: THREE.MathUtils.randFloat(-1, 1.4),
        phase: THREE.MathUtils.randFloat(0, Math.PI * 2),
        scale: THREE.MathUtils.randFloat(0.6, 1.1),
      })),
    []
  );
  const refs = useRef([]);
  const sway = 0.15 + Math.min(windSpeed, 15) * 0.03;

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.rotation.z = Math.sin(t * (1 + windSpeed * 0.05) + blades[i].phase) * sway;
    });
  });

  return (
    <group position={[0, -0.9, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9, 4]} />
        <meshStandardMaterial color="#1c4028" />
      </mesh>
      {blades.map((b, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} position={[b.x, 0.18 * b.scale, b.z]}>
          <coneGeometry args={[0.035, 0.36 * b.scale, 5]} />
          <meshStandardMaterial color="#4f8c3f" />
        </mesh>
      ))}
    </group>
  );
}

function Rain({ intensity = 40, reducedMotion }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(intensity * 3);
    for (let i = 0; i < intensity; i++) {
      arr[i * 3] = THREE.MathUtils.randFloatSpread(9);
      arr[i * 3 + 1] = THREE.MathUtils.randFloat(0, 3.4);
      arr[i * 3 + 2] = THREE.MathUtils.randFloatSpread(5);
    }
    return arr;
  }, [intensity]);

  useFrame((state, delta) => {
    if (reducedMotion || !ref.current) return;
    const arr = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < intensity; i++) {
      arr[i * 3 + 1] -= delta * 4;
      if (arr[i * 3 + 1] < -1) arr[i * 3 + 1] = 3.4;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#cfe0e8" size={0.028} transparent opacity={0.65} />
    </points>
  );
}

export default function WeatherScene({ condition = 'default', windSpeed = 0, reducedMotion = false }) {
  const wv = getWeatherVisual(condition);
  const raining = condition === 'rain' || condition === 'storm';
  const showSun = (condition === 'sunny' || condition === 'default') && !raining;
  const showClouds = condition === 'cloudy' || raining;

  return (
    <>
      <color attach="background" args={[wv.sky]} />
      {wv.fog && <fog attach="fog" args={[wv.fog, 4, 11]} />}
      <ambientLight intensity={wv.intensity * 0.85} color={wv.light} />
      <directionalLight position={[3, 5, 2]} intensity={wv.intensity} color={wv.light} />
      {showSun && <Sun />}
      {showClouds && (
        <Clouds count={condition === 'storm' ? 6 : 4} drift={(condition === 'storm' ? 0.12 : 0.05) + windSpeed * 0.01} />
      )}
      <GroundGrass reducedMotion={reducedMotion} windSpeed={windSpeed} />
      {raining && !reducedMotion && (
        <Rain intensity={condition === 'storm' ? 65 : 30} reducedMotion={reducedMotion} />
      )}
    </>
  );
}
