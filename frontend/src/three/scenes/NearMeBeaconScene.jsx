import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Spec #26 "Near Me": the real map (OpenStreetMap iframe + Overpass shop
 * data + KVK/market lists) must stay exactly as-is — this scene never
 * replaces it. It's a small supplementary beacon that visually confirms
 * which category is active and whether a specific place is focused,
 * matching spec's acceptance test ("KVK selected -> KVK markers /
 * pulse / focus camera / contextual card").
 *
 * category: 'all' | 'kvk' | 'market' | 'shop'
 * focused:  true once the user has tapped a specific list item
 * distanceKm: real haversine distance to the focused item, or null
 */
const CATEGORY_COLOR = {
  all: '#4a7c59',
  kvk: '#22c55e',
  market: '#f59e0b',
  shop: '#8b5cf6',
};

function Beacon({ color, focused, reducedMotion }) {
  const ringRef = useRef();
  const coreRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const speed = focused ? 3.2 : 1.4;
    if (ringRef.current) {
      const s = 1 + (Math.sin(t * speed) * 0.5 + 0.5) * (focused ? 0.55 : 0.3);
      ringRef.current.scale.set(s, s, s);
      ringRef.current.material.opacity = focused ? 0.5 - (s - 1) * 0.4 : 0.28;
    }
    if (coreRef.current && !reducedMotion) {
      coreRef.current.position.y = 0.5 + Math.sin(t * 1.6) * 0.04;
    }
  });

  return (
    <group>
      {/* ground pad */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 32]} />
        <meshStandardMaterial color="#e7e2d4" />
      </mesh>
      {/* pulsing pin */}
      <mesh ref={coreRef} position={[0, 0.5, 0]}>
        <coneGeometry args={[0.22, 0.55, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* pulse ring */}
      <mesh ref={ringRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.62, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

export default function NearMeBeaconScene({ category = 'all', focused = false, reducedMotion = false }) {
  const color = CATEGORY_COLOR[category] || CATEGORY_COLOR.all;
  return (
    <>
      <color attach="background" args={['#f4f1e6']} />
      <ambientLight intensity={0.95} color="#fff8ea" />
      <directionalLight position={[2, 4, 2]} intensity={0.8} color="#fff2cf" />
      <Beacon color={color} focused={focused} reducedMotion={reducedMotion} />
    </>
  );
}
