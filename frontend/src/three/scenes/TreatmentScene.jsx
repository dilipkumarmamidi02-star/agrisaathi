import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import CropField from './CropField';

function TreatmentRing({ color, radius }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.material.opacity = 0.35 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
  });
  return (
    <mesh ref={ref} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius, radius + 0.12, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.45} />
    </mesh>
  );
}

/**
 * Spec #13: treatments must connect visually to the diagnosis/crop
 * context. Organic gets a green ring, chemical a blue ring — both can
 * show together when the real result recommends both.
 */
export default function TreatmentScene({ cropName, hasOrganic, hasChemical }) {
  return (
    <>
      <ambientLight intensity={0.8} color="#eafff0" />
      <directionalLight position={[3, 4, 2]} intensity={0.85} color="#fff6dc" />
      <CropField cropName={cropName} size={1.6} />
      {hasOrganic && <TreatmentRing color="#22c55e" radius={0.7} />}
      {hasChemical && <TreatmentRing color="#3b82f6" radius={0.9} />}
    </>
  );
}
