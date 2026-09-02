import SceneStage from '../three/core/SceneStage';
import IrrigationFieldScene from '../three/scenes/IrrigationFieldScene';

export default function IrrigationFieldScene3D({ cropName, method, hasSession }) {
  return (
    <div className="relative w-full h-40 rounded-xl overflow-hidden bg-gradient-to-b from-green-50 to-lime-50 mb-3">
      <SceneStage tone="green" camera={{ position: [0, 1.6, 2.8], fov: 42 }}>
        {({ reducedMotion }) => (
          <IrrigationFieldScene
            cropName={cropName}
            method={method}
            hasSession={hasSession}
            reducedMotion={reducedMotion}
          />
        )}
      </SceneStage>
    </div>
  );
}
