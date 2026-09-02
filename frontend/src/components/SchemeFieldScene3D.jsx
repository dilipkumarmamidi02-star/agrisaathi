import SceneStage from '../three/core/SceneStage';
import SchemeFieldScene from '../three/scenes/SchemeFieldScene';

export default function SchemeFieldScene3D({ status = null, schemeCount = 0 }) {
  return (
    <div className="relative w-full h-32 rounded-2xl overflow-hidden bg-gradient-to-b from-amber-50 to-green-50 mb-3">
      <SceneStage tone="amber" camera={{ position: [0, 1.1, 3.2], fov: 42 }}>
        {({ reducedMotion }) => (
          <SchemeFieldScene status={status} schemeCount={schemeCount} reducedMotion={reducedMotion} />
        )}
      </SceneStage>
      {status && (
        <span className="pointer-events-none absolute top-1.5 left-2 text-[10px] font-mono uppercase tracking-wider text-green-900/60 bg-white/70 backdrop-blur px-2 py-0.5 rounded">
          {status.replace(/_/g, ' ')}
        </span>
      )}
    </div>
  );
}
