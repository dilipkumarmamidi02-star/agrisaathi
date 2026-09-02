import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import CropField from './CropField';

/**
 * Spec #45 "Loan Eligibility": "Use: farm, income, crop, equipment,
 * financial indicators. The actual eligibility result controls the
 * visualization. Do not imply guaranteed approval." So the crop field
 * itself always renders at full, healthy growth (it represents the
 * farmer's *real* registered plot, not a verdict) — only a small
 * status seal above it changes with the real AI eligibility result,
 * and its wording/color is informational, never a promise.
 *
 * status: 'eligible' | 'partially' | 'not_eligible' | null
 */
const SEAL = {
  eligible: '#22c55e',
  partially: '#f59e0b',
  not_eligible: '#94a3b8',
};

function StatusSeal({ color, reducedMotion }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current && !reducedMotion) {
      ref.current.position.y = 1.05 + Math.sin(state.clock.elapsedTime * 1.8) * 0.03;
      ref.current.rotation.y += 0.01;
    }
  });
  return (
    <mesh ref={ref} position={[0, 1.05, 0]}>
      <cylinderGeometry args={[0.16, 0.16, 0.04, 24]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
    </mesh>
  );
}

export default function LoanFieldScene({ cropName, status = null, hasFarm = false, reducedMotion = false }) {
  return (
    <>
      <color attach="background" args={['#eef3ea']} />
      <ambientLight intensity={0.9} color="#fff8ea" />
      <directionalLight position={[3, 4, 2]} intensity={0.85} color="#fff2cf" />

      {hasFarm ? (
        <CropField cropName={cropName} size={1.6} />
      ) : (
        <mesh position={[0, -0.02, 0]}>
          <boxGeometry args={[1.6, 0.05, 1.6]} />
          <meshStandardMaterial color="#3f3123" />
        </mesh>
      )}

      {status && <StatusSeal color={SEAL[status] || SEAL.partially} reducedMotion={reducedMotion} />}
    </>
  );
}
