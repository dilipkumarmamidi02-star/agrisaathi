import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Spec #52 "Document Wallet": "secure digital document environment...
 * document cards, folder depth, subtle 3D paper/document effects. Do
 * NOT create unnecessary animations around sensitive documents."
 *
 * Real data drives this: `docCount` sets how many document "cards" sit
 * in the stack (capped visually at 6), `expiringCount` lights the vault
 * seal amber instead of green when something needs renewal. No invented
 * numbers — both come straight from the page's own doc list.
 */
export default function DocumentVaultScene({ docCount = 0, expiringCount = 0, reducedMotion = false }) {
  const sealRef = useRef();
  const stackCount = Math.min(6, Math.max(1, docCount || 1));
  const warn = expiringCount > 0;

  useFrame((state) => {
    if (!sealRef.current || reducedMotion) return;
    sealRef.current.rotation.y = state.clock.elapsedTime * 0.6;
  });

  return (
    <>
      <color attach="background" args={['#0f1a14']} />
      <ambientLight intensity={0.9} color="#eafaf0" />
      <directionalLight position={[2, 3, 2]} intensity={0.7} color="#bff7c8" />

      {/* vault back plate */}
      <mesh position={[0, 0, -0.3]}>
        <boxGeometry args={[1.9, 1.1, 0.06]} />
        <meshStandardMaterial color="#16311f" />
      </mesh>

      {/* document stack — count reflects real docs saved, capped for legibility */}
      {Array.from({ length: stackCount }).map((_, i) => (
        <mesh key={i} position={[-0.45 + i * 0.02, -0.05 + i * 0.03, -0.1 + i * 0.03]} rotation={[0, 0, (i % 2 ? 1 : -1) * 0.03]}>
          <boxGeometry args={[0.5, 0.62, 0.015]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#f4f1e4' : '#e9e4d0'} />
        </mesh>
      ))}

      {/* security seal — green when nothing expiring, amber when it is */}
      <mesh ref={sealRef} position={[0.55, 0, 0.05]}>
        <torusGeometry args={[0.22, 0.045, 12, 24]} />
        <meshStandardMaterial
          color={warn ? '#f59e0b' : '#22c55e'}
          emissive={warn ? '#f59e0b' : '#22c55e'}
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={[0.55, 0, 0.05]}>
        <circleGeometry args={[0.1, 20]} />
        <meshStandardMaterial color={warn ? '#fde68a' : '#bbf7d0'} />
      </mesh>
    </>
  );
}
