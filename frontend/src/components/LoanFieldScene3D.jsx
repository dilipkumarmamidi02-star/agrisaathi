import SceneStage from '../three/core/SceneStage';
import LoanFieldScene from '../three/scenes/LoanFieldScene';

const STATUS_LABEL = { eligible: 'Likely eligible', partially: 'Partially eligible', not_eligible: 'Not eligible' };

export default function LoanFieldScene3D({ cropName, status = null, hasFarm = false }) {
  return (
    <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-gradient-to-b from-green-50 to-lime-100 mb-3">
      <SceneStage tone="green" camera={{ position: [0, 1.3, 3.6], fov: 42 }}>
        {({ reducedMotion }) => (
          <LoanFieldScene cropName={cropName} status={status} hasFarm={hasFarm} reducedMotion={reducedMotion} />
        )}
      </SceneStage>
      {status && (
        <span className="pointer-events-none absolute top-1.5 left-2 text-[10px] font-mono uppercase tracking-wider text-green-900/60 bg-white/70 backdrop-blur px-2 py-0.5 rounded">
          {STATUS_LABEL[status] || status}
        </span>
      )}
    </div>
  );
}
