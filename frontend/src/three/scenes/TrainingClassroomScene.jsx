import CropField from './CropField';
import HerdScene from './HerdScene';
import SoilCrossSectionScene from './SoilCrossSectionScene';
import IrrigationScene from './IrrigationScene';
import EquipmentYardScene from './EquipmentYardScene';
import MandiScene from './MandiScene';
import { getTrainingVisual } from '../config/trainingVisuals';

/**
 * Spec #47 "Training Center": "immersive agricultural classroom ...
 * training selection should change environment. Organic farming ->
 * organic field demonstration, Irrigation -> irrigation demonstration,
 * Pest management -> crop/pest lab, Machinery -> equipment
 * demonstration." TrainingCenter.jsx's real category taxonomy is
 * crop/livestock/soil/irrigation/machinery/marketing, so each of those
 * mounts the *exact* shared scene Phases 2-7 already built for that
 * domain (spec #4 shared infrastructure) — this file adds zero new
 * 3D geometry of its own, only the routing between category and scene.
 *
 * These are topic/demonstration scenes, not any one farmer's saved
 * records (same honesty contract Phase 5 used for Speak to
 * AgriSaathi's generic IrrigationScene) — so nothing here is
 * fabricated as *the user's own* crop, herd, soil reading or
 * equipment.
 */
const DEMO_EQUIPMENT = [
  { name: 'demo-tractor', type: 'tractor', overdue: false },
  { name: 'demo-sprayer', type: 'sprayer', overdue: false },
];

const DEMO_COMMODITIES = [{ name: 'rice' }, { name: 'tomato' }];

export default function TrainingClassroomScene({ category, resourceCount = 0, reducedMotion = false }) {
  const visual = getTrainingVisual(category);

  return (
    <>
      <color attach="background" args={['#eefaea']} />
      <ambientLight intensity={0.95} color="#f2fff2" />
      <directionalLight position={[3, 4, 2]} intensity={0.9} color="#fff6dc" />

      {visual.reuse === 'crop' && <CropField cropName={visual.demoCrop} stageProgress={0.85} />}
      {visual.reuse === 'livestock' && <HerdScene category={visual.demoCategory} total={Math.max(2, Math.min(5, resourceCount || 2))} />}
      {visual.reuse === 'soil' && <SoilCrossSectionScene record={null} activeNutrient={null} onSelectNutrient={() => {}} />}
      {visual.reuse === 'irrigation' && <IrrigationScene reducedMotion={reducedMotion} />}
      {visual.reuse === 'machinery' && <EquipmentYardScene equipment={DEMO_EQUIPMENT} reducedMotion={reducedMotion} />}
      {visual.reuse === 'market' && <MandiScene commodities={DEMO_COMMODITIES} reducedMotion={reducedMotion} />}
    </>
  );
}
