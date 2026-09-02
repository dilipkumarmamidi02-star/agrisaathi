import SceneStage from '../three/core/SceneStage';
import HarvestFieldScene from '../three/scenes/HarvestFieldScene';

export default function HarvestFieldScene3D({ cropName, hasRecords }) {
  return (
    <div className="relative w-full h-36 rounded-xl overflow-hidden bg-gradient-to-b from-amber-50 to-yellow-50 mb-3">
      <SceneStage tone="amber" camera={{ position: [0, 1.5, 2.7], fov: 42 }}>
        {({ reducedMotion }) => (
          <HarvestFieldScene cropName={cropName} hasRecords={hasRecords} reducedMotion={reducedMotion} />
        )}
      </SceneStage>
    </div>
  );
}
