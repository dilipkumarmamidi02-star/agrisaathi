import SceneStage from '../three/core/SceneStage';
import InventoryStorageScene from '../three/scenes/InventoryStorageScene';

export default function InventoryStorageScene3D({ items }) {
  return (
    <div className="relative w-full h-28 rounded-xl overflow-hidden bg-gradient-to-b from-stone-100 to-amber-50 mb-3">
      <SceneStage tone="amber" camera={{ position: [0, 0.9, 1.9], fov: 42 }}>
        {({ reducedMotion }) => <InventoryStorageScene items={items} reducedMotion={reducedMotion} />}
      </SceneStage>
    </div>
  );
}
