import SceneStage from '../three/core/SceneStage';
import InsuranceFieldScene from '../three/scenes/InsuranceFieldScene';

export default function InsuranceFieldScene3D({ cropName, claimStatus = 'none', policyCount = 0 }) {
  return (
    <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-gradient-to-b from-green-50 to-lime-100 mb-3">
      <SceneStage tone="green" camera={{ position: [0, 1.3, 3.4], fov: 42 }}>
        {({ reducedMotion }) => (
          <InsuranceFieldScene
            cropName={cropName}
            claimStatus={claimStatus}
            policyCount={policyCount}
            reducedMotion={reducedMotion}
          />
        )}
      </SceneStage>
      {policyCount > 0 && (
        <span className="pointer-events-none absolute top-1.5 left-2 text-[10px] font-mono uppercase tracking-wider text-green-900/60 bg-white/70 backdrop-blur px-2 py-0.5 rounded">
          {cropName ? `${cropName} · protected` : 'protected'}
        </span>
      )}
    </div>
  );
}
