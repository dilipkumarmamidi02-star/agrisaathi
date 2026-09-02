import SceneStage from '../three/core/SceneStage';
import FarmIdentityScene from '../three/scenes/FarmIdentityScene';

export default function FarmIdentityScene3D({ landSizeAcres = 0, hasCrop = false }) {
  return (
    <div className="relative w-full h-28 rounded-xl overflow-hidden bg-gradient-to-b from-green-950 to-green-900/40 mb-4">
      <SceneStage tone="green" camera={{ position: [0.8, 1.1, 1.4], fov: 42 }}>
        {({ reducedMotion }) => (
          <FarmIdentityScene landSizeAcres={landSizeAcres} hasCrop={hasCrop} reducedMotion={reducedMotion} />
        )}
      </SceneStage>
    </div>
  );
}
