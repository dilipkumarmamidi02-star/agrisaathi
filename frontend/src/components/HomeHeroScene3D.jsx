import SceneStage from '../three/core/SceneStage';
import HomeHeroScene from '../three/scenes/HomeHeroScene';

export default function HomeHeroScene3D({ condition }) {
  return (
    <div className="relative w-full h-40 rounded-2xl overflow-hidden">
      <SceneStage tone="sky" camera={{ position: [0, 0.6, 6], fov: 50 }}>
        {({ reducedMotion }) => (
          <HomeHeroScene condition={condition} reducedMotion={reducedMotion} />
        )}
      </SceneStage>
    </div>
  );
}
