import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import CropField from './CropField';

/**
 * A single crop, shown as a small showcase rather than a farm-wide field.
 * Auto-turntables slowly (paused under reduced motion) so the crop reads
 * clearly even without user interaction — callers that want manual
 * rotate/zoom wrap this in <OrbitControls> themselves (see
 * CropEncyclopediaScene3D) since not every caller wants that (e.g. the
 * Crops browse-list preview, which must not fight the page's own scroll).
 */
export default function CropPreviewScene({
  cropName,
  stageProgress = 1,
  reducedMotion = false,
  autoRotateSpeed = 0.25,
}) {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.rotation.y += delta * autoRotateSpeed;
  });

  return (
    <>
      <ambientLight intensity={0.8} color="#eafff0" />
      <directionalLight position={[3, 4, 2]} intensity={0.9} color="#fff6dc" />
      <group ref={groupRef}>
        <CropField cropName={cropName} stageProgress={stageProgress} size={1.6} />
      </group>
    </>
  );
}
