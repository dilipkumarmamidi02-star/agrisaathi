import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import CropField from './CropField';

const TYPE_MARKER_COLOR = { pest: '#ef4444', disease: '#f97316', weed: '#eab308' };

function PestMarker({ color }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = 0.55 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    ref.current.rotation.y = state.clock.elapsedTime;
  });
  return (
    <mesh ref={ref} position={[0.3, 0.55, 0.2]}>
      <octahedronGeometry args={[0.09, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
    </mesh>
  );
}

/**
 * Spec #21: selected pest/disease/weed becomes the focal object over its
 * real affected crop. `cropName` is derived from the item's real
 * `affects` field (see PestLibrary.jsx); the marker color comes from the
 * item's real `type`.
 */
export default function PestScene({ cropName, type }) {
  return (
    <>
      <ambientLight intensity={0.8} color="#eafff0" />
      <directionalLight position={[3, 4, 2]} intensity={0.85} color="#fff6dc" />
      <CropField cropName={cropName} size={1.6} />
      <PestMarker color={TYPE_MARKER_COLOR[type] || '#ef4444'} />
    </>
  );
}
