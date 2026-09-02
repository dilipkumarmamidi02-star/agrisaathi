import SceneStage from '../three/core/SceneStage';
import SoilCrossSectionScene from '../three/scenes/SoilCrossSectionScene';
import IrrigationScene from '../three/scenes/IrrigationScene';

/**
 * Spec #34 "Sensor Lab": "Tabs such as soil / water ... must change the
 * visualization. Soil -> soil layers. Water -> water/irrigation
 * visualization." Reuses the exact scenes already built for Soil
 * Passport (Phase 3) and the Speak-to-AgriSaathi irrigation topic
 * (Phase 5) instead of duplicating a soil-layer or water renderer.
 *
 * `soilRecord` maps the farmer's *currently entered* soil-tab values
 * (N/P/K/organic carbon + a representative pH) onto the same shape
 * SoilCrossSectionScene already expects — nothing invented, no reading
 * is shown until the farmer has actually typed a value for it.
 */
export default function SensorLabScene3D({ tab, soilRecord }) {
  return (
    <div className="relative w-full h-32 rounded-xl overflow-hidden bg-gradient-to-b from-amber-50 to-lime-50 mb-3">
      <SceneStage
        tone={tab === 'soil' ? 'amber' : 'sky'}
        camera={tab === 'soil' ? { position: [0, 0.5, 1.6], fov: 40 } : { position: [0, 1.1, 2.4], fov: 42 }}
      >
        {({ reducedMotion }) =>
          tab === 'soil' ? (
            <SoilCrossSectionScene record={soilRecord} activeNutrient={null} onSelectNutrient={() => {}} />
          ) : (
            <IrrigationScene reducedMotion={reducedMotion} />
          )
        }
      </SceneStage>
    </div>
  );
}
