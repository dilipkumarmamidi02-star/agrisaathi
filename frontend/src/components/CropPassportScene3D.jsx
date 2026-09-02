import SceneStage from '../three/core/SceneStage';
import CropPassportScene from '../three/scenes/CropPassportScene';

const LAYERS = [
  { id: 'field', label: 'Field & Crop' },
  { id: 'soil', label: 'Soil' },
  { id: 'records', label: 'Ledger' },
];

export default function CropPassportScene3D({ cropName, requirements, chain, layer, onLayerChange }) {
  return (
    <div className="mb-4">
      <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-gradient-to-b from-green-50 to-lime-100">
        <SceneStage tone="green" camera={{ position: [0, 1, 3.4], fov: 42 }}>
          <CropPassportScene layer={layer} cropName={cropName} requirements={requirements} chain={chain} />
        </SceneStage>
      </div>
      <div className="flex gap-2 mt-2">
        {LAYERS.map((l) => {
          const disabled = l.id === 'records' && !chain;
          return (
            <button
              key={l.id}
              disabled={disabled}
              onClick={() => onLayerChange(l.id)}
              className={`flex-1 text-xs font-medium py-1.5 rounded-lg border transition-colors ${
                layer === l.id
                  ? 'bg-lt-primary text-white border-lt-primary'
                  : disabled
                  ? 'bg-gray-50 text-gray-300 border-gray-100'
                  : 'bg-white text-lt-text-secondary border-lt-border'
              }`}
            >
              {l.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
