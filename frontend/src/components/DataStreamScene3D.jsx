import SceneStage from '../three/core/SceneStage';
import DataStreamScene from '../three/scenes/DataStreamScene';

export default function DataStreamScene3D({ datasetCount = 4 }) {
  return (
    <div className="relative w-full h-24 rounded-xl overflow-hidden bg-gradient-to-b from-sky-950 to-sky-900/40 mb-3">
      <SceneStage tone="sky" camera={{ position: [0, 0.6, 1.9], fov: 42 }}>
        {({ reducedMotion }) => (
          <DataStreamScene datasetCount={datasetCount} reducedMotion={reducedMotion} />
        )}
      </SceneStage>
    </div>
  );
}
