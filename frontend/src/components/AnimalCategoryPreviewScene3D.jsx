import SceneStage from '../three/core/SceneStage';
import AnimalPreviewScene from '../three/scenes/AnimalPreviewScene';

export default function AnimalCategoryPreviewScene3D({ category, label }) {
  return (
    <div className="relative w-full h-32 rounded-xl overflow-hidden bg-gradient-to-b from-amber-50 to-lime-100 mb-3">
      <SceneStage tone="amber" camera={{ position: [0.9, 0.8, 1.4], fov: 40 }}>
        {({ reducedMotion }) => (
          <AnimalPreviewScene category={category} reducedMotion={reducedMotion} />
        )}
      </SceneStage>
      {label && (
        <span className="pointer-events-none absolute bottom-1.5 left-2 text-[10px] font-mono uppercase tracking-wider text-amber-900/60 bg-white/70 backdrop-blur px-2 py-0.5 rounded">
          {label}
        </span>
      )}
    </div>
  );
}
