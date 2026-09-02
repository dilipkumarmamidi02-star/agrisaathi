import SceneStage from '../three/core/SceneStage';
import EcosystemScene from '../three/scenes/EcosystemScene';

export default function EcosystemScene3D({ score = 0 }) {
  return (
    <div className="relative w-full h-28 rounded-xl overflow-hidden bg-gradient-to-b from-green-950 to-green-900/40 mb-4">
      <SceneStage tone="green" camera={{ position: [0, 0.6, 1.8], fov: 42 }}>
        {({ reducedMotion }) => <EcosystemScene score={score} reducedMotion={reducedMotion} />}
      </SceneStage>
    </div>
  );
}
