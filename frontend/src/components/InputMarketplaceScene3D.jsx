import SceneStage from '../three/core/SceneStage';
import MarketplaceStallScene from '../three/scenes/MarketplaceStallScene';

export default function InputMarketplaceScene3D({ category, shopCount }) {
  return (
    <div className="relative w-full h-28 rounded-xl overflow-hidden bg-gradient-to-b from-amber-50 to-lime-50 mb-3">
      <SceneStage tone="amber" camera={{ position: [0, 1.1, 1.9], fov: 42 }}>
        {({ reducedMotion }) => (
          <MarketplaceStallScene category={category} shopCount={shopCount} reducedMotion={reducedMotion} />
        )}
      </SceneStage>
    </div>
  );
}
