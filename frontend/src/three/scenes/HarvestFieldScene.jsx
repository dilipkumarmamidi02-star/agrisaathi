import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import CropField from './CropField';

/**
 * Spec #39 "Harvest Records": "selected crop should determine the
 * harvest scene ... wheat -> wheat field + harvester, paddy -> rice
 * field + harvesting ... actual records drive the UI." cropName comes
 * from the farmer's real most-recent (or trend-selected) HarvestRecord;
 * the harvester only appears once at least one record exists.
 */
function Harvester({ reducedMotion }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || reducedMotion) return;
    ref.current.position.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.7;
  });
  return (
    <group ref={ref} position={[0, 0.12, 0.6]}>
      <mesh>
        <boxGeometry args={[0.18, 0.12, 0.12]} />
        <meshStandardMaterial color="#d68910" />
      </mesh>
      <mesh position={[0.12, -0.02, 0]}>
        <boxGeometry args={[0.06, 0.16, 0.1]} />
        <meshStandardMaterial color="#c0392b" />
      </mesh>
    </group>
  );
}

export default function HarvestFieldScene({ cropName, hasRecords, reducedMotion = false }) {
  return (
    <>
      <color attach="background" args={['#f4f0e0']} />
      <ambientLight intensity={0.95} color="#fff6df" />
      <directionalLight position={[3, 4, 2]} intensity={0.9} color="#ffe9a8" />

      <CropField cropName={cropName} size={1.8} stageProgress={hasRecords ? 1 : 0.4} />
      {hasRecords && <Harvester reducedMotion={reducedMotion} />}
    </>
  );
}
