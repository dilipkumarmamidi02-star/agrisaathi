import SceneStage from '../three/core/SceneStage';
import LedgerDeskScene from '../three/scenes/LedgerDeskScene';

export default function LedgerDeskScene3D({ valid, incomeRatio }) {
  return (
    <div className="relative w-full h-24 rounded-xl overflow-hidden bg-gradient-to-b from-amber-50 to-stone-50 mb-3">
      <SceneStage tone="amber" camera={{ position: [0, 1, 1.9], fov: 40 }}>
        {({ reducedMotion }) => (
          <LedgerDeskScene valid={valid} incomeRatio={incomeRatio} reducedMotion={reducedMotion} />
        )}
      </SceneStage>
    </div>
  );
}
