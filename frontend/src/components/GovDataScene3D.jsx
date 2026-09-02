import SceneStage from '../three/core/SceneStage';
import GovDataScene from '../three/scenes/GovDataScene';

/**
 * Level-2 "Government Data Intelligence Center" banner for /data-gov
 * (spec #18). Sits above the real resource list + table — never replaces
 * them. All props are real state passed in from DataGovLiveData.jsx.
 */
export default function GovDataScene3D({
  resourceCount = 0,
  liveCount = 0,
  emptyCount = 0,
  errorCount = 0,
  loading = false,
}) {
  return (
    <div className="relative w-full h-40 md:h-48 rounded-xl overflow-hidden bg-gradient-to-b from-[#070d16] to-[#0b1420] border border-sky-900/40">
      <SceneStage tone="sky" camera={{ position: [0, 0.8, 3.2], fov: 45 }}>
        {({ reducedMotion }) => (
          <GovDataScene
            resourceCount={resourceCount}
            liveCount={liveCount}
            emptyCount={emptyCount}
            errorCount={errorCount}
            loading={loading}
            reducedMotion={reducedMotion}
          />
        )}
      </SceneStage>

      {/* Readable freshness legend overlaid on the scene — spec: "usability
          before 3D enhancement" and "make source authority/freshness
          visually obvious," so the mapping is spelled out in text too. */}
      <div className="absolute bottom-2 left-3 right-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono uppercase tracking-wide text-gray-400 pointer-events-none">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Live ({liveCount})
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Empty ({emptyCount})
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Error ({errorCount})
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" /> Not loaded (
          {Math.max(0, resourceCount - liveCount - emptyCount - errorCount)})
        </span>
      </div>
    </div>
  );
}
