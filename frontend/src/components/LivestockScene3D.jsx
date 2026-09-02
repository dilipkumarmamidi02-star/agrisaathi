import { OrbitControls } from '@react-three/drei';
import SceneStage from '../three/core/SceneStage';
import HerdScene from '../three/scenes/HerdScene';
import { getAnimalVisual } from '../three/config/animalVisuals';

export default function LivestockScene3D({ category, total, districtLabel }) {
  const visual = getAnimalVisual(category);
  return (
    <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-gradient-to-b from-amber-50 to-lime-100 mb-4">
      <SceneStage tone="amber" camera={{ position: [1.4, 1.1, 2], fov: 42 }}>
        {() => (
          <>
            <HerdScene category={category} total={total} />
            <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 3.5} maxPolarAngle={Math.PI / 2.2} />
          </>
        )}
      </SceneStage>
      <span className="pointer-events-none absolute bottom-1.5 left-2 text-[10px] font-mono uppercase tracking-wider text-amber-900/60 bg-white/70 backdrop-blur px-2 py-0.5 rounded">
        {visual.label}{districtLabel ? ` · ${districtLabel}` : ''}
      </span>
    </div>
  );
}
