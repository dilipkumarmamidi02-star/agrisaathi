import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Spec #57 "Alerts Center": "Every alert type should have a
 * corresponding contextual environment... Weather alert -> weather.
 * Pest alert -> crop/pest. Market alert -> market." This page pulls
 * three real categories (low stock, rain-risk forecast, price swings).
 * Three small watchtower lamps map 1:1 to those three real arrays —
 * lit only when that category actually has entries, calm otherwise.
 */
export default function AlertWatchtowerScene({ stockAlerts = 0, weatherAlerts = 0, priceAlerts = 0, reducedMotion = false }) {
  const lampsRef = useRef([]);
  const zones = [
    { count: stockAlerts, color: '#f59e0b', x: -0.55 },
    { count: weatherAlerts, color: '#38bdf8', x: 0 },
    { count: priceAlerts, color: '#22c55e', x: 0.55 },
  ];

  useFrame((state) => {
    if (reducedMotion) return;
    lampsRef.current.forEach((lamp, i) => {
      if (!lamp || !zones[i].count) return;
      lamp.intensity = 0.5 + Math.sin(state.clock.elapsedTime * 2.5 + i) * 0.3;
    });
  });

  return (
    <>
      <color attach="background" args={['#0b1420']} />
      <ambientLight intensity={0.8} color="#e0f2fe" />

      {/* watchtower base */}
      <mesh position={[0, -0.35, -0.1]}>
        <boxGeometry args={[1.9, 0.06, 0.5]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {zones.map((z, i) => (
        <group key={i} position={[z.x, 0, 0]}>
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.02, 0.03, 0.5, 6]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <pointLight ref={(el) => (lampsRef.current[i] = el)} position={[0, 0.2, 0.1]} intensity={z.count ? 0.6 : 0.15} color={z.color} />
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshStandardMaterial
              color={z.color}
              emissive={z.color}
              emissiveIntensity={z.count ? 0.7 : 0.1}
              transparent
              opacity={z.count ? 1 : 0.35}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}
