import { OrbitControls } from '@react-three/drei';
import SceneStage from '../three/core/SceneStage';
import AnimalPreviewScene from '../three/scenes/AnimalPreviewScene';

export default function AnimalEncyclopediaScene3D({ category, maturity }) {
  return (
    <div className="relative w-full h-52 rounded-2xl overflow-hidden bg-gradient-to-b from-amber-50 to-lime-100 mb-3">
      <SceneStage tone="amber" camera={{ position: [1, 0.9, 1.6], fov: 42 }}>
        {({ reducedMotion }) => (
          <>
            <AnimalPreviewScene category={category} maturity={maturity} reducedMotion={reducedMotion} autoRotateSpeed={0} />
            <OrbitControls enablePan={false} minDistance={1} maxDistance={3.5} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2.1} />
          </>
        )}
      </SceneStage>
      <span className="pointer-events-none absolute bottom-1.5 right-2 text-[10px] font-mono uppercase tracking-wider text-amber-900/50 bg-white/70 backdrop-blur px-2 py-0.5 rounded">
        Drag to rotate · pinch to zoom
      </span>
    </div>
  );
}
