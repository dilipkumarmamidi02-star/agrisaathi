import SceneStage from '../three/core/SceneStage';
import YieldBenchmarkScene from '../three/scenes/YieldBenchmarkScene';

export default function YieldBenchmarkScene3D({ cropName, yourRatio, targetRatio }) {
  return (
    <div className="relative w-full h-40 rounded-xl overflow-hidden bg-gradient-to-b from-green-50 to-lime-50 mb-3">
      <SceneStage tone="green" camera={{ position: [0, 1.3, 2.6], fov: 44 }}>
        {({ reducedMotion }) => (
          <YieldBenchmarkScene
            cropName={cropName}
            yourRatio={yourRatio}
            targetRatio={targetRatio}
            reducedMotion={reducedMotion}
          />
        )}
      </SceneStage>
    </div>
  );
}
