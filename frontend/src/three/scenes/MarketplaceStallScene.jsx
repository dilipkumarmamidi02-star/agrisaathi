import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { getInputCategoryVisual } from '../config/inputMarketVisuals';

/**
 * Spec #42 "Input Marketplace": "Categories: seeds, fertilizer, crop
 * protection, tools, equipment. Category changes -> environment
 * changes." Reacts to the real `category` filter the farmer taps on
 * InputMarketplace.jsx, and stacks a crate per real matching shop
 * (capped, spec #90 "do not fabricate scale") so an empty filter
 * genuinely looks emptier than a well-stocked one.
 */
function Item({ position, shape, color, bob, reducedMotion }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || reducedMotion) return;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.4 + bob) * 0.02;
  });

  if (shape === 'sack') {
    return (
      <mesh ref={ref} position={position}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }
  if (shape === 'drum') {
    return (
      <mesh ref={ref} position={position}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 10]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }
  if (shape === 'tool') {
    return (
      <group ref={ref} position={position}>
        <mesh>
          <boxGeometry args={[0.03, 0.24, 0.03]} />
          <meshStandardMaterial color="#5a4632" />
        </mesh>
        <mesh position={[0, 0.13, 0]}>
          <boxGeometry args={[0.14, 0.06, 0.03]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    );
  }
  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[0.18, 0.14, 0.18]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

export default function MarketplaceStallScene({ category, shopCount = 0, reducedMotion = false }) {
  const visual = getInputCategoryVisual(category);
  const stackCount = Math.max(1, Math.min(6, shopCount || 1));
  const spacing = 0.24;
  const startX = -(spacing * (stackCount - 1)) / 2;

  return (
    <>
      <color attach="background" args={['#f4f1e8']} />
      <ambientLight intensity={1} color="#fff8ea" />
      <directionalLight position={[2, 3, 2]} intensity={0.9} color="#fff3d6" />

      {/* stall counter */}
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[Math.max(1, spacing * stackCount + 0.4), 0.04, 0.5]} />
        <meshStandardMaterial color="#c9a876" />
      </mesh>

      {Array.from({ length: stackCount }, (_, i) => (
        <Item
          key={i}
          position={[startX + i * spacing, 0.14, 0]}
          shape={visual.shape}
          color={visual.color}
          bob={i}
          reducedMotion={reducedMotion}
        />
      ))}
    </>
  );
}
