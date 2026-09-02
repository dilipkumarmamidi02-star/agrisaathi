import SceneStage from '../three/core/SceneStage';
import NearMeBeaconScene from '../three/scenes/NearMeBeaconScene';

const CATEGORY_LABEL = { all: 'All nearby', kvk: 'KVKs', market: 'Govt. markets', shop: 'Shops' };

export default function NearMeBeaconScene3D({ category = 'all', focused = false }) {
  return (
    <div className="relative w-full h-24 rounded-xl overflow-hidden bg-gradient-to-b from-lime-50 to-green-50 mb-3">
      <SceneStage tone="green" camera={{ position: [0, 1.4, 2.6], fov: 40 }}>
        {({ reducedMotion }) => <NearMeBeaconScene category={category} focused={focused} reducedMotion={reducedMotion} />}
      </SceneStage>
      <span className="pointer-events-none absolute top-1.5 left-2 text-[10px] font-mono uppercase tracking-wider text-green-900/60 bg-white/70 backdrop-blur px-2 py-0.5 rounded">
        {CATEGORY_LABEL[category] || CATEGORY_LABEL.all}{focused ? ' · focused' : ''}
      </span>
    </div>
  );
}
