import SceneStage from '../three/core/SceneStage';
import StoryFieldScene from '../three/scenes/StoryFieldScene';

export default function StoryFieldScene3D({ storyCount = 0 }) {
  return (
    <div className="relative w-full h-24 rounded-xl overflow-hidden bg-gradient-to-b from-green-950 to-green-900/40 mb-3">
      <SceneStage tone="green" camera={{ position: [0, 0.2, 1.5], fov: 45 }}>
        {({ reducedMotion }) => <StoryFieldScene storyCount={storyCount} reducedMotion={reducedMotion} />}
      </SceneStage>
    </div>
  );
}
