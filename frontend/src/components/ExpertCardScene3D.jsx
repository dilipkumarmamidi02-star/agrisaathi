import SceneStage from '../three/core/SceneStage';
import ExpertCardScene from '../three/scenes/ExpertCardScene';

export default function ExpertCardScene3D({ title }) {
  return (
    <div className="relative shrink-0 h-12 w-12 rounded-xl overflow-hidden bg-lt-bg">
      <SceneStage tone="green" camera={{ position: [0.9, 0.7, 1.3], fov: 40 }}>
        {() => <ExpertCardScene title={title} />}
      </SceneStage>
    </div>
  );
}
