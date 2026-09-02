import SceneStage from '../three/core/SceneStage';
import CommunityBoardScene from '../three/scenes/CommunityBoardScene';

export default function CommunityBoardScene3D({ category, className = 'h-14 w-14' }) {
  return (
    <div className={`relative shrink-0 rounded-xl overflow-hidden bg-lt-bg ${className}`}>
      <SceneStage tone="green" camera={{ position: [0.7, 0.6, 1], fov: 40 }}>
        {({ reducedMotion }) => <CommunityBoardScene category={category} reducedMotion={reducedMotion} />}
      </SceneStage>
    </div>
  );
}
