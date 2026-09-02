import SceneStage from '../three/core/SceneStage';
import VendorTypeScene from '../three/scenes/VendorTypeScene';

export default function VendorTypeScene3D({ type, className = 'h-10 w-10' }) {
  return (
    <div className={`relative shrink-0 rounded-lg overflow-hidden bg-lt-bg ${className}`}>
      <SceneStage tone="amber" camera={{ position: [0.6, 0.6, 0.9], fov: 40 }}>
        {({ reducedMotion }) => <VendorTypeScene type={type} reducedMotion={reducedMotion} />}
      </SceneStage>
    </div>
  );
}
