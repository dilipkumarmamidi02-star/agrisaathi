import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Spec #37 "Expense Analytics": "field, farm expenses, machinery,
 * inputs ... charts remain 2D and readable, 3D should provide context,
 * not replace the charts." A small row of bars mirroring the same
 * top-3 category totals the 2D pie/bar charts already render (no
 * separate numbers), so hovering the 3D accent never disagrees with
 * the chart below it.
 */
function ExpenseBar({ position, height, color, reducedMotion }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || reducedMotion) return;
    ref.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 1.4 + position[0]) * 0.03;
  });
  return (
    <mesh ref={ref} position={[position[0], height / 2, position[2]]}>
      <boxGeometry args={[0.22, Math.max(0.03, height), 0.22]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

export default function ExpenseFieldScene({ topCategories = [], reducedMotion = false }) {
  const maxVal = Math.max(1, ...topCategories.map((c) => c.value));
  const spacing = 0.32;
  const startX = -(spacing * (topCategories.length - 1)) / 2;

  return (
    <>
      <color attach="background" args={['#fdf1ef']} />
      <ambientLight intensity={0.95} color="#fff5f0" />
      <directionalLight position={[2, 3, 2]} intensity={0.8} color="#fff2cf" />

      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[1.6, 0.04, 0.7]} />
        <meshStandardMaterial color="#3f3123" />
      </mesh>

      {topCategories.length === 0 ? (
        // empty state: calm bare field, no expenses logged yet
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[0.3, 0.01, 0.3]} />
          <meshStandardMaterial color="#93a68a" transparent opacity={0.5} />
        </mesh>
      ) : (
        topCategories.map((c, i) => (
          <ExpenseBar
            key={c.name}
            position={[startX + i * spacing, 0, 0]}
            height={0.15 + (c.value / maxVal) * 0.45}
            color={c.color}
            reducedMotion={reducedMotion}
          />
        ))
      )}
    </>
  );
}
