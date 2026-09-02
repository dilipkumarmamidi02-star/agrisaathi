import SceneStage from '../three/core/SceneStage';
import TrainingClassroomScene from '../three/scenes/TrainingClassroomScene';

export default function TrainingCenterScene3D({ category, resourceCount }) {
  return (
    <div className="relative w-full h-36 rounded-xl overflow-hidden bg-gradient-to-b from-green-50 to-lime-50 mb-3">
      <SceneStage tone="green" camera={{ position: [0, 1.4, 2.6], fov: 45 }}>
        {({ reducedMotion }) => (
          <TrainingClassroomScene category={category || 'crop'} resourceCount={resourceCount} reducedMotion={reducedMotion} />
        )}
      </SceneStage>
    </div>
  );
}
