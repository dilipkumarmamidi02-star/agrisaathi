import SceneStage from '../three/core/SceneStage';
import EquipmentYardScene from '../three/scenes/EquipmentYardScene';

export default function EquipmentYardScene3D({ equipment }) {
  return (
    <div className="relative w-full h-32 rounded-xl overflow-hidden bg-gradient-to-b from-slate-100 to-green-50 mb-3">
      <SceneStage tone="green" camera={{ position: [0, 1, 2.1], fov: 42 }}>
        {({ reducedMotion }) => <EquipmentYardScene equipment={equipment} reducedMotion={reducedMotion} />}
      </SceneStage>
    </div>
  );
}
