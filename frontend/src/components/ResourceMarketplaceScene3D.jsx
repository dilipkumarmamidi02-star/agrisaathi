import SceneStage from '../three/core/SceneStage';
import ResourceCategoryScene from '../three/scenes/ResourceCategoryScene';

export default function ResourceMarketplaceScene3D({ category, sourceCount }) {
  return (
    <div className="relative w-full h-28 rounded-xl overflow-hidden bg-gradient-to-b from-slate-100 to-cyan-50 mb-3">
      <SceneStage tone="cyan" camera={{ position: [0, 1.1, 1.9], fov: 42 }}>
        {({ reducedMotion }) => (
          <ResourceCategoryScene category={category} sourceCount={sourceCount} reducedMotion={reducedMotion} />
        )}
      </SceneStage>
    </div>
  );
}
