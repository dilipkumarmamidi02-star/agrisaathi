import SceneStage from '../three/core/SceneStage';
import MandiScene from '../three/scenes/MandiScene';

/**
 * Real 3D mandi wrapper (spec #17). `commodities` is a small (<=3) list
 * the calling page derives from its own fetched market records — see
 * MarketPrices.jsx's `marketSceneCommodities` memo. Never pass a
 * fabricated commodity/price; if the page has nothing yet, pass [].
 */
export default function MandiScene3D({ commodities = [], height = 'h-40' }) {
  const activeItem = commodities.find((c) => c.active) || commodities[0];

  return (
    <div className={`relative w-full ${height} rounded-xl overflow-hidden mb-3`}>
      <SceneStage tone="amber" camera={{ position: [0, 1.3, 4.4], fov: 42 }}>
        {({ reducedMotion }) => <MandiScene commodities={commodities} reducedMotion={reducedMotion} />}
      </SceneStage>

      {activeItem && (
        <div className="pointer-events-none absolute top-2 left-2 right-2 flex flex-wrap items-start justify-between gap-2">
          <span className="text-xs font-semibold text-white bg-black/40 backdrop-blur px-2 py-1 rounded capitalize">
            {activeItem.name}
          </span>
          {activeItem.modalPrice != null && (
            <span className="text-xs font-semibold text-white bg-black/40 backdrop-blur px-2 py-1 rounded">
              ₹{Number(activeItem.modalPrice).toLocaleString('en-IN')}
              {activeItem.market ? ` · ${activeItem.market}` : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
