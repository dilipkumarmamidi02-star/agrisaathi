import SceneStage from '../three/core/SceneStage';
import LoanCalcScene from '../three/scenes/LoanCalcScene';

export default function LoanCalcScene3D({ principalRatio = 0.7, stackHeight = 6 }) {
  return (
    <div className="relative w-full h-28 rounded-xl overflow-hidden bg-gradient-to-b from-amber-50 to-lime-50 mb-3">
      <SceneStage tone="amber" camera={{ position: [0, 1.1, 2.4], fov: 40 }}>
        {({ reducedMotion }) => (
          <LoanCalcScene principalRatio={principalRatio} stackHeight={stackHeight} reducedMotion={reducedMotion} />
        )}
      </SceneStage>
    </div>
  );
}
