import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Spec #48 "Training Academy": "progression-based learning
 * environment ... Courses -> different agricultural learning scenes,
 * Progress -> visual field/growth metaphor." The real backend has a
 * TrainingResource list (category/type/difficulty) but no per-farmer
 * course-completion tracking, so this does NOT fabricate a "progress"
 * percentage — instead it honestly represents each category's real
 * resource *count* as a growth-stage marker (more real resources
 * available in a category -> a taller sprout), same "real ratio, never
 * an invented one" rule Phase 7's Yield Benchmarks used.
 */
function Sprout({ position, height, color, active, reducedMotion }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || reducedMotion) return;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.05;
  });
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} ref={ref}>
        <coneGeometry args={[0.05, height, 6]} />
        <meshStandardMaterial
          color={color}
          emissive={active ? color : '#000000'}
          emissiveIntensity={active ? 0.35 : 0}
        />
      </mesh>
    </group>
  );
}

export default function TrainingAcademyScene({ categories = [], activeCategory, reducedMotion = false }) {
  const spacing = 0.34;
  const startX = -(spacing * Math.max(0, categories.length - 1)) / 2;
  const maxCount = Math.max(1, ...categories.map((c) => c.count));

  return (
    <>
      <color attach="background" args={['#eefaea']} />
      <ambientLight intensity={0.95} color="#f2fff2" />
      <directionalLight position={[3, 4, 2]} intensity={0.9} color="#fff6dc" />

      <mesh position={[0, -0.01, 0]}>
        <boxGeometry args={[Math.max(1, spacing * categories.length + 0.3), 0.02, 0.5]} />
        <meshStandardMaterial color="#8a9a6b" />
      </mesh>

      {categories.map((c, i) => (
        <Sprout
          key={c.category}
          position={[startX + i * spacing, 0, 0]}
          height={0.12 + 0.35 * (c.count / maxCount)}
          color={c.category === activeCategory ? '#16a34a' : '#65a30d'}
          active={c.category === activeCategory}
          reducedMotion={reducedMotion}
        />
      ))}
    </>
  );
}
