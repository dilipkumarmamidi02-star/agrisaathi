import SceneStage from '../three/core/SceneStage';
import FeedbackGardenScene from '../three/scenes/FeedbackGardenScene';

export default function FeedbackGardenScene3D({ rating = 0 }) {
  return (
    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-b from-green-950 to-green-900/40 shrink-0">
      <SceneStage tone="green" camera={{ position: [0, 0, 1.5], fov: 45 }}>
        {({ reducedMotion }) => <FeedbackGardenScene rating={rating} reducedMotion={reducedMotion} />}
      </SceneStage>
    </div>
  );
}
