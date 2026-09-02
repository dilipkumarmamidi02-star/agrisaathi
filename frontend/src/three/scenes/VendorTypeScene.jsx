import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { getVendorVisual } from '../config/vendorVisuals';

/**
 * Spec #45: "subtle supplier/contact environment ... do NOT create
 * unnecessary heavy 3D." A single small rotating shape reflecting the
 * real vendor `type` — meant for a ~48px badge next to the type
 * selector/card, never a full scene.
 */
export default function VendorTypeScene({ type, reducedMotion = false }) {
  const visual = getVendorVisual(type);
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current || reducedMotion) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.6;
  });

  let geometry = <boxGeometry args={[0.3, 0.3, 0.3]} />;
  if (visual.shape === 'sack') geometry = <sphereGeometry args={[0.2, 8, 6]} />;
  if (visual.shape === 'drum') geometry = <cylinderGeometry args={[0.15, 0.15, 0.32, 10]} />;
  if (visual.shape === 'cart') geometry = <boxGeometry args={[0.36, 0.18, 0.22]} />;
  if (visual.shape === 'truck') geometry = <boxGeometry args={[0.4, 0.2, 0.2]} />;

  return (
    <>
      <ambientLight intensity={1.1} color="#ffffff" />
      <directionalLight position={[1, 2, 2]} intensity={0.7} />
      <mesh ref={ref}>
        {geometry}
        <meshStandardMaterial color={visual.color} />
      </mesh>
    </>
  );
}
