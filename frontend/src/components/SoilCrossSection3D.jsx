import { OrbitControls } from '@react-three/drei';
import SceneStage from '../three/core/SceneStage';
import SoilCrossSectionScene, { NUTRIENT_BANDS } from '../three/scenes/SoilCrossSectionScene';

export default function SoilCrossSection3D({ record, activeNutrient, onSelectNutrient }) {
  return (
    <div className="mb-4">
      <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-gradient-to-b from-amber-50 to-stone-100">
        <SceneStage tone="amber" camera={{ position: [0, 0.4, 2.6], fov: 40 }}>
          {() => (
            <>
              <SoilCrossSectionScene
                record={record}
                activeNutrient={activeNutrient}
                onSelectNutrient={onSelectNutrient}
              />
              <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 2.6} maxPolarAngle={Math.PI / 2.1} />
            </>
          )}
        </SceneStage>
        {!record && (
          <span className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[10px] text-stone-500">
            Add or select a soil record below to see it here
          </span>
        )}
      </div>
      <div className="flex gap-1.5 mt-2">
        {Object.entries(NUTRIENT_BANDS).map(([id, band]) => (
          <button
            key={id}
            onClick={() => onSelectNutrient(activeNutrient === id ? null : id)}
            className={`flex-1 text-[11px] font-semibold py-1 rounded-lg border transition-colors ${
              activeNutrient === id
                ? 'text-white border-transparent'
                : 'bg-white text-lt-text-secondary border-lt-border'
            }`}
            style={activeNutrient === id ? { backgroundColor: band.color } : undefined}
          >
            {band.label}
          </button>
        ))}
      </div>
    </div>
  );
}
