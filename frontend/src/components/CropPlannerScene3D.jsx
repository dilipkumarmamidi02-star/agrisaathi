import SceneStage from '../three/core/SceneStage';
import CropPreviewScene from '../three/scenes/CropPreviewScene';

const STAGES = ['Prep', 'Sowing', 'Germ.', 'Vegetative', 'Flowering', 'Harvest'];

export default function CropPlannerScene3D({ cropName, stageIndex, onStageChange }) {
  return (
    <div className="mb-4">
      <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-gradient-to-b from-green-50 to-lime-100">
        <SceneStage tone="green" camera={{ position: [0, 1.1, 3.6], fov: 42 }}>
          {({ reducedMotion }) => (
            <CropPreviewScene
              cropName={cropName}
              stageProgress={(stageIndex + 1) / STAGES.length}
              reducedMotion={reducedMotion}
            />
          )}
        </SceneStage>
        <span className="pointer-events-none absolute top-1.5 left-2 text-[10px] font-mono uppercase tracking-wider text-green-900/60 bg-white/70 backdrop-blur px-2 py-0.5 rounded">
          Top match: {cropName}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={STAGES.length - 1}
        step={1}
        value={stageIndex}
        onChange={(e) => onStageChange(Number(e.target.value))}
        className="w-full mt-2 accent-lt-primary"
      />
      <div className="flex justify-between text-[10px] text-lt-text-muted -mt-0.5">
        {STAGES.map((s, i) => (
          <span key={s} className={i === stageIndex ? 'text-lt-primary font-semibold' : ''}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
