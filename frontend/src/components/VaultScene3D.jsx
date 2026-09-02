import SceneStage from '../three/core/SceneStage';
import VaultScene from '../three/scenes/VaultScene';

export default function VaultScene3D({ recordCount = 0 }) {
  return (
    <div className="relative w-full h-32 rounded-2xl overflow-hidden bg-gradient-to-b from-slate-50 to-blue-50 mb-3">
      <SceneStage tone="sky" camera={{ position: [0, 1.1, 2.6], fov: 40 }}>
        {({ reducedMotion }) => <VaultScene recordCount={recordCount} reducedMotion={reducedMotion} />}
      </SceneStage>
      <span className="pointer-events-none absolute top-1.5 left-2 text-[10px] font-mono uppercase tracking-wider text-slate-600/70 bg-white/70 backdrop-blur px-2 py-0.5 rounded">
        {recordCount > 0 ? `${recordCount} secured record${recordCount === 1 ? '' : 's'}` : 'vault empty'}
      </span>
    </div>
  );
}
