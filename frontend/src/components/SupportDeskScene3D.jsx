import SceneStage from '../three/core/SceneStage';
import SupportDeskScene from '../three/scenes/SupportDeskScene';

export default function SupportDeskScene3D({ openCount = 0, resolvedCount = 0 }) {
  return (
    <div className="relative w-full h-24 rounded-xl overflow-hidden bg-gradient-to-b from-green-950 to-green-900/40 mb-3">
      <SceneStage tone="green" camera={{ position: [0, 0.5, 1.8], fov: 42 }}>
        {({ reducedMotion }) => (
          <SupportDeskScene openCount={openCount} resolvedCount={resolvedCount} reducedMotion={reducedMotion} />
        )}
      </SceneStage>
    </div>
  );
}
