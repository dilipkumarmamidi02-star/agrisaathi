import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { getInputCategoryVisual } from '../config/inputMarketVisuals';

/**
 * Spec #43 "Resource Marketplace": "Machinery -> tractors/harvesters,
 * Seeds -> seed display, Fertilizers -> fertilizer environment, Tools
 * -> tool display. The selected product should become visually
 * emphasized." Reacts to the real selected category chip. The small
 * floating nodes on the right are the real
 * `marketplaceResources.length` Data.gov source count already shown
 * in the card below (spec #71: use real data, never invent a count).
 */
function SourceNode({ position, reducedMotion, phase }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || reducedMotion) return;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + phase) * 0.03;
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.03, 8, 8]} />
      <meshStandardMaterial color="#0891b2" emissive="#0891b2" emissiveIntensity={0.4} />
    </mesh>
  );
}

export default function ResourceCategoryScene({ category, sourceCount = 0, reducedMotion = false }) {
  const visual = getInputCategoryVisual(category);
  const nodes = Math.max(0, Math.min(6, sourceCount));

  return (
    <>
      <color attach="background" args={['#eef2ee']} />
      <ambientLight intensity={1} color="#f4fff2" />
      <directionalLight position={[2, 3, 2]} intensity={0.85} color="#fff6dc" />

      {/* central emphasized category object */}
      {visual.shape === 'tool' ? (
        <group position={[-0.15, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.035, 0.32, 0.035]} />
            <meshStandardMaterial color="#5a4632" />
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[0.18, 0.08, 0.035]} />
            <meshStandardMaterial color={visual.color} />
          </mesh>
        </group>
      ) : visual.shape === 'drum' ? (
        <mesh position={[-0.15, 0.1, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.24, 12]} />
          <meshStandardMaterial color={visual.color} />
        </mesh>
      ) : (
        <mesh position={[-0.15, 0.12, 0]}>
          <sphereGeometry args={[0.16, 10, 8]} />
          <meshStandardMaterial color={visual.color} />
        </mesh>
      )}

      {Array.from({ length: nodes }, (_, i) => (
        <SourceNode
          key={i}
          position={[0.25 + (i % 3) * 0.12, 0.1 + Math.floor(i / 3) * 0.14, 0]}
          phase={i}
          reducedMotion={reducedMotion}
        />
      ))}
    </>
  );
}
