import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import CropField from './CropField';

/**
 * Spec #12: the diagnosis scene must reflect the real crop selected in
 * step 2, and once a real result comes back, show an affected-region
 * highlight — sized by the API's own confidence score, never a made-up
 * severity. `severity` is null before a result exists (renders no
 * highlight, not a fabricated one).
 */
function AffectedHighlight({ severity }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 2.4) * 0.25;
    ref.current.material.opacity = 0.25 + pulse * 0.35 * severity;
  });
  return (
    <mesh ref={ref} position={[0, 0.3, 0]}>
      <sphereGeometry args={[0.22 + severity * 0.18, 12, 12]} />
      <meshBasicMaterial color="#ef4444" transparent opacity={0.4} />
    </mesh>
  );
}

export default function DiagnosisScene({ cropName, severity = null }) {
  return (
    <>
      <ambientLight intensity={0.8} color="#eafff0" />
      <directionalLight position={[3, 4, 2]} intensity={0.85} color="#fff6dc" />
      <CropField cropName={cropName} size={1.6} />
      {severity != null && <AffectedHighlight severity={severity} />}
    </>
  );
}
