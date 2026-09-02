import SceneStage from '../three/core/SceneStage';
import SensorHubScene from '../three/scenes/SensorHubScene';

export default function SensorHubScene3D({ latest, readingCount = 0 }) {
  return (
    <div className="relative w-full h-32 rounded-xl overflow-hidden bg-gradient-to-b from-cyan-50 to-blue-50 mb-3">
      <SceneStage tone="sky" camera={{ position: [0, 1.1, 2.2], fov: 42 }}>
        {({ reducedMotion }) => (
          <SensorHubScene latest={latest} readingCount={readingCount} reducedMotion={reducedMotion} />
        )}
      </SceneStage>
    </div>
  );
}
