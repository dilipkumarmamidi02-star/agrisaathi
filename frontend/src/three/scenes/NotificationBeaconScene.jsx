import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Spec #56 "Farm Notifications": "notifications should connect to
 * actual farm events." This page's real events are the reminders the
 * farmer set (spraying/harvest/vaccination dates). A bell beacon pulses
 * red when a real reminder is overdue, amber when one is due within 2
 * days, and sits calm green otherwise — driven by `dueSoonCount` /
 * `overdueCount`, both computed from the real reminder list.
 */
export default function NotificationBeaconScene({ dueSoonCount = 0, overdueCount = 0, reducedMotion = false }) {
  const beaconRef = useRef();
  const state = overdueCount > 0 ? 'overdue' : dueSoonCount > 0 ? 'soon' : 'calm';
  const color = { overdue: '#ef4444', soon: '#f59e0b', calm: '#22c55e' }[state];

  useFrame((s) => {
    if (!beaconRef.current || reducedMotion) return;
    const speed = state === 'overdue' ? 4 : state === 'soon' ? 2 : 0.8;
    beaconRef.current.intensity = 0.6 + Math.sin(s.clock.elapsedTime * speed) * 0.35;
  });

  return (
    <>
      <color attach="background" args={['#0f1a14']} />
      <ambientLight intensity={0.9} color="#eafaf0" />
      <pointLight ref={beaconRef} position={[0, 0.3, 0.8]} intensity={0.7} color={color} />

      {/* bell body */}
      <mesh position={[0, 0, 0]}>
        <coneGeometry args={[0.32, 0.4, 16, 1, true]} />
        <meshStandardMaterial color="#78350f" side={2} />
      </mesh>
      <mesh position={[0, -0.22, 0]}>
        <torusGeometry args={[0.32, 0.03, 8, 24]} />
        <meshStandardMaterial color="#a16207" />
      </mesh>
      <mesh position={[0, -0.32, 0]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>
    </>
  );
}
