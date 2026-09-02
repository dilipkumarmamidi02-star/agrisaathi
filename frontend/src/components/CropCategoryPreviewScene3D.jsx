import SceneStage from '../three/core/SceneStage';
import CropPreviewScene from '../three/scenes/CropPreviewScene';

export default function CropCategoryPreviewScene3D({ cropName, label }) {
  return (
    <div className="relative w-full h-32 rounded-xl overflow-hidden bg-gradient-to-b from-green-50 to-green-100 mb-3">
      <SceneStage tone="green" camera={{ position: [0, 1.1, 3.4], fov: 40 }}>
        {({ reducedMotion }) => (
          <CropPreviewScene cropName={cropName} reducedMotion={reducedMotion} />
        )}
      </SceneStage>
      {label && (
        <span className="pointer-events-none absolute bottom-1.5 left-2 text-[10px] font-mono uppercase tracking-wider text-green-900/60 bg-white/70 backdrop-blur px-2 py-0.5 rounded">
          {label}
        </span>
      )}
    </div>
  );
}
