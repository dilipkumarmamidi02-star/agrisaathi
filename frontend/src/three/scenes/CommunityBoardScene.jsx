import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { getCommunityVisual } from '../config/communityVisuals';

/**
 * Spec #50 "Community Forum": "Category selection -> contextual
 * agricultural environment where appropriate ... 3D remains subtle."
 * A single small floating marker, colored by the real category of
 * whichever post is open or being composed -- never a full farm
 * scene, since spec #50 explicitly asks for a readable board first.
 */
export default function CommunityBoardScene({ category, reducedMotion = false }) {
  const visual = getCommunityVisual(category);
  const ref = useRef();

  useFrame((state) => {
    if (!ref.current || reducedMotion) return;
    ref.current.position.y = 0.05 + Math.sin(state.clock.elapsedTime * 1.6) * 0.03;
    ref.current.rotation.y = state.clock.elapsedTime * 0.5;
  });

  let shapeEl = <boxGeometry args={[0.22, 0.22, 0.22]} />;
  if (visual.shape === 'leaf') shapeEl = <coneGeometry args={[0.14, 0.3, 5]} />;
  if (visual.shape === 'animal') shapeEl = <sphereGeometry args={[0.16, 8, 8]} />;
  if (visual.shape === 'layer') shapeEl = <boxGeometry args={[0.3, 0.14, 0.14]} />;
  if (visual.shape === 'cloud') shapeEl = <sphereGeometry args={[0.17, 10, 8]} />;
  if (visual.shape === 'stall') shapeEl = <boxGeometry args={[0.26, 0.18, 0.18]} />;
  if (visual.shape === 'shield') shapeEl = <coneGeometry args={[0.15, 0.24, 4]} />;
  if (visual.shape === 'tool') shapeEl = <cylinderGeometry args={[0.03, 0.03, 0.3, 6]} />;
  if (visual.shape === 'dot') shapeEl = <sphereGeometry args={[0.12, 8, 8]} />;

  return (
    <>
      <ambientLight intensity={1.1} color="#ffffff" />
      <directionalLight position={[1.5, 2, 2]} intensity={0.7} />
      <mesh ref={ref}>
        {shapeEl}
        <meshStandardMaterial color={visual.color} />
      </mesh>
    </>
  );
}
