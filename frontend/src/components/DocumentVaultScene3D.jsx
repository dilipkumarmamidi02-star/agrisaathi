import SceneStage from '../three/core/SceneStage';
import DocumentVaultScene from '../three/scenes/DocumentVaultScene';

export default function DocumentVaultScene3D({ docCount = 0, expiringCount = 0 }) {
  return (
    <div className="relative w-full h-24 rounded-xl overflow-hidden bg-gradient-to-b from-green-950 to-green-900/40 mb-3">
      <SceneStage tone="green" camera={{ position: [0, 0.3, 2.1], fov: 42 }}>
        {({ reducedMotion }) => (
          <DocumentVaultScene docCount={docCount} expiringCount={expiringCount} reducedMotion={reducedMotion} />
        )}
      </SceneStage>
    </div>
  );
}
