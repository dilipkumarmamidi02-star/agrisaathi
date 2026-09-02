import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Spec #29 "Insurance Vault": "secure digital vault visual language ...
 * subtle rather than distracting." AgriSaathi doesn't have a separate
 * document-upload entity for policies yet, so this reads the *real*
 * count of InsurancePolicy records (each policy IS the securable
 * record — provider, sum insured, dates) rather than inventing a fake
 * file system. recordCount drives how many "locked" cards render.
 */
export default function VaultScene({ recordCount = 0, reducedMotion = false }) {
  const doorRef = useRef();

  useFrame((state) => {
    if (doorRef.current && !reducedMotion) {
      doorRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.06;
    }
  });

  const cards = Math.max(1, Math.min(6, recordCount || 1));

  return (
    <>
      <color attach="background" args={['#eef1f6']} />
      <ambientLight intensity={0.95} color="#f4f7ff" />
      <directionalLight position={[2, 4, 3]} intensity={0.8} color="#e8edff" />

      <group ref={doorRef}>
        {/* vault base */}
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.85, 0.85, 0.06, 40]} />
          <meshStandardMaterial color="#dfe4ee" />
        </mesh>

        {/* stacked secured document cards, one per real policy */}
        {Array.from({ length: cards }, (_, i) => (
          <mesh key={i} position={[0, 0.05 + i * 0.05, 0]} rotation={[0, i * 0.35, 0]}>
            <boxGeometry args={[0.95, 0.03, 0.65]} />
            <meshStandardMaterial color={i === cards - 1 ? '#ffffff' : '#e3e7f0'} />
          </mesh>
        ))}

        {/* lock glyph on top */}
        <mesh position={[0, 0.06 + cards * 0.05, 0]}>
          <torusGeometry args={[0.09, 0.025, 10, 20]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.02 + cards * 0.05, 0]}>
          <boxGeometry args={[0.16, 0.12, 0.05]} />
          <meshStandardMaterial color="#64748b" metalness={0.3} roughness={0.5} />
        </mesh>
      </group>
    </>
  );
}
