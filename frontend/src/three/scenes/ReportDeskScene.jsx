import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Spec #53 "Export Reports": "report-generation workspace... subtle
 * animated generation state." `sectionsOn` (0-3, real count of ledger/
 * yield/soil checkboxes the user has ticked) sets how many page sheets
 * are visible. `generating` (real jsPDF in-flight state) speeds the
 * sheet's assembly spin — it stops the moment the real PDF is done.
 */
export default function ReportDeskScene({ sectionsOn = 3, generating = false, reducedMotion = false }) {
  const pageRef = useRef();
  const count = Math.max(1, Math.min(3, sectionsOn));

  useFrame((state, delta) => {
    if (!pageRef.current || reducedMotion) return;
    const speed = generating ? 2.2 : 0.25;
    pageRef.current.rotation.y += delta * speed;
  });

  return (
    <>
      <color attach="background" args={['#f3f0e6']} />
      <ambientLight intensity={1} color="#fffaf0" />
      <directionalLight position={[2, 3, 2]} intensity={0.7} color="#fff2cf" />

      {/* desk */}
      <mesh position={[0, -0.32, 0]}>
        <boxGeometry args={[2, 0.05, 1]} />
        <meshStandardMaterial color="#7a5c3a" />
      </mesh>

      {/* assembling report pages, one per selected section */}
      <group ref={pageRef} position={[0, 0, 0]}>
        {Array.from({ length: count }).map((_, i) => (
          <mesh key={i} position={[Math.cos((i / count) * Math.PI * 2) * 0.32, 0, Math.sin((i / count) * Math.PI * 2) * 0.32]}>
            <boxGeometry args={[0.34, 0.44, 0.01]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        ))}
      </group>

      {/* PDF badge, pulses green while generating */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.22, 0.16, 0.04]} />
        <meshStandardMaterial
          color={generating ? '#16a34a' : '#166534'}
          emissive={generating ? '#22c55e' : '#000000'}
          emissiveIntensity={generating ? 0.6 : 0}
        />
      </mesh>
    </>
  );
}
