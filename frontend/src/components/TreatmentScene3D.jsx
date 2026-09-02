import SceneStage from '../three/core/SceneStage';
import TreatmentScene from '../three/scenes/TreatmentScene';

export default function TreatmentScene3D({ cropName, hasOrganic, hasChemical }) {
  return (
    <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-gradient-to-b from-green-50 to-lime-100 mb-3">
      <SceneStage tone="green" camera={{ position: [0, 1.1, 3.2], fov: 42 }}>
        <TreatmentScene cropName={cropName} hasOrganic={hasOrganic} hasChemical={hasChemical} />
      </SceneStage>
    </div>
  );
}
