import SceneStage from '../three/core/SceneStage';
import FertilizerScene from '../three/scenes/FertilizerScene';

export default function FertilizerScene3D({ cropName, nutrientFocus }) {
  return (
    <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-gradient-to-b from-green-50 to-lime-100 mb-4">
      <SceneStage tone="green" camera={{ position: [0, 1.1, 3.4], fov: 42 }}>
        <FertilizerScene cropName={cropName} nutrientFocus={nutrientFocus} />
      </SceneStage>
      {nutrientFocus && (
        <span className="pointer-events-none absolute top-1.5 left-2 text-[10px] font-mono uppercase tracking-wider text-green-900/60 bg-white/70 backdrop-blur px-2 py-0.5 rounded">
          Focus: {nutrientFocus}
        </span>
      )}
    </div>
  );
}
