import { getAnimalVisual } from '../config/animalVisuals';
import AnimalModel from './AnimalModel';

/**
 * Spec #22: category controls the environment, not just a label.
 * `count` is the real aggregate census total for the dominant category
 * in the currently filtered view (see Livestock.jsx) — log-scaled into
 * a small instance count (1-6) so a herd of 40,000 buffalo doesn't try
 * to render 40,000 meshes, while still visibly differing from a herd of
 * 40.
 */
function instanceCountFor(total) {
  if (!total || total <= 0) return 1;
  return Math.min(6, 1 + Math.floor(Math.log10(total + 1)));
}

export default function HerdScene({ category, total }) {
  const visual = getAnimalVisual(category);
  const count = instanceCountFor(total);
  const positions = Array.from({ length: count }, (_, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    return [(col - 1) * 0.55, 0, row * 0.5 - (count > 3 ? 0.25 : 0)];
  });

  return (
    <>
      <ambientLight intensity={0.85} color="#fff6dc" />
      <directionalLight position={[3, 4, 2]} intensity={0.85} color="#fff6dc" />

      {visual.water ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[2, 1.4]} />
          <meshStandardMaterial color={visual.groundColor} />
        </mesh>
      ) : (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[2.4, 1.6]} />
          <meshStandardMaterial color={visual.groundColor} />
        </mesh>
      )}

      {positions.map((pos, i) => (
        <AnimalModel key={i} category={category} position={pos} idleOffset={i} />
      ))}
    </>
  );
}
