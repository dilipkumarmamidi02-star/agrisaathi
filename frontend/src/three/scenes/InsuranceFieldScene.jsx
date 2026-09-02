import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import CropField from './CropField';

/**
 * Spec #28 "Insurance Hub": "selected crop -> protected crop field ...
 * insurance protection -> subtle shield/protection visualization ...
 * claims -> claim timeline visualization." Reads the real
 * InsurancePolicy the farmer picked (crop_name, claim_status) — never
 * invents a risk condition, and never implies a guaranteed payout.
 *
 * claimStatus: 'none' | 'filed' | 'under_review' | 'approved' | 'rejected'
 */
const CLAIM_ACCENT = {
  none: { color: '#4a7c59', pulse: false },
  filed: { color: '#f59e0b', pulse: true },
  under_review: { color: '#3b82f6', pulse: true },
  approved: { color: '#22c55e', pulse: false },
  rejected: { color: '#94a3b8', pulse: false },
};

function ShieldRing({ color, pulse, reducedMotion }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    if (pulse && !reducedMotion) {
      ref.current.material.opacity = 0.25 + Math.sin(t * 2.5) * 0.15;
    } else {
      ref.current.material.opacity = 0.28;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0.9, 0]} rotation={[0, 0, 0]}>
      <torusGeometry args={[0.55, 0.03, 12, 40, Math.PI * 1.5]} />
      <meshBasicMaterial color={color} transparent opacity={0.28} />
    </mesh>
  );
}

export default function InsuranceFieldScene({ cropName, claimStatus = 'none', policyCount = 0, reducedMotion = false }) {
  const accent = CLAIM_ACCENT[claimStatus] || CLAIM_ACCENT.none;

  return (
    <>
      <color attach="background" args={['#eaf3ec']} />
      <ambientLight intensity={0.9} color="#f4fff2" />
      <directionalLight position={[3, 4, 2]} intensity={0.9} color="#fff6dc" />

      {policyCount > 0 ? (
        <CropField cropName={cropName} size={1.6} />
      ) : (
        // empty state (spec #74): calm waiting field, no policies yet
        <mesh position={[0, -0.02, 0]}>
          <boxGeometry args={[1.6, 0.05, 1.6]} />
          <meshStandardMaterial color="#3f3123" />
        </mesh>
      )}

      {policyCount > 0 && (
        <ShieldRing color={accent.color} pulse={accent.pulse} reducedMotion={reducedMotion} />
      )}
    </>
  );
}
