import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import CropField from './CropField';

const NUTRIENT_COLORS = { nitrogen: '#3b82f6', phosphorus: '#f59e0b', potassium: '#22c55e' };

/**
 * Spec #20: crop + fertilizer focus controls the scene. AgriSaathi's
 * calculator doesn't let the farmer pick a fertilizer product directly —
 * it recommends one — so instead of inventing a product selector, the
 * glow color reflects which nutrient the *real* result/soil numbers
 * point to. See Fertilize.jsx's `detectNutrientFocus` for how that's
 * derived; nothing here guesses on its own.
 */
function FocusGlow({ color }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.08;
    ref.current.scale.set(s, 1, s);
    ref.current.material.opacity = 0.35 + Math.sin(state.clock.elapsedTime * 2.5) * 0.15;
  });
  return (
    <mesh ref={ref} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.75, 1, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} />
    </mesh>
  );
}

export default function FertilizerScene({ cropName, nutrientFocus }) {
  return (
    <>
      <ambientLight intensity={0.85} color="#eafff0" />
      <directionalLight position={[3, 4, 2]} intensity={0.85} color="#fff6dc" />
      <CropField cropName={cropName} size={1.7} />
      {nutrientFocus && <FocusGlow color={NUTRIENT_COLORS[nutrientFocus]} />}
    </>
  );
}
