import CropField from './CropField';
import HerdScene from './HerdScene';
import { getExpertVisual } from '../config/expertVisuals';

/**
 * Spec #51 "Expert Directory": "categories can subtly influence the
 * background: crop expert -> crop environment, livestock expert ->
 * livestock environment, soil expert -> soil environment." The
 * directory itself is a fixed, static list of expert *types* (not
 * per-farmer data), so each card mounts a small illustrative preview
 * of that expert's domain -- reusing CropField/HerdScene rather than
 * building new geometry (spec #4/#90).
 */
export default function ExpertCardScene({ title }) {
  const visual = getExpertVisual(title);

  if (visual.reuse === 'crop') {
    return (
      <>
        <ambientLight intensity={1} color="#f4fff2" />
        <directionalLight position={[1.5, 2, 2]} intensity={0.7} />
        <CropField cropName={visual.demoCrop} size={0.9} stageProgress={0.9} bladeCount={10} />
      </>
    );
  }
  if (visual.reuse === 'livestock') {
    return (
      <>
        <ambientLight intensity={1} color="#fff8ea" />
        <directionalLight position={[1.5, 2, 2]} intensity={0.7} />
        <HerdScene category={visual.demoCategory} total={2} />
      </>
    );
  }
  if (visual.reuse === 'scheme') {
    return (
      <>
        <ambientLight intensity={1.1} color="#ffffff" />
        <directionalLight position={[1.5, 2, 2]} intensity={0.7} />
        <mesh rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.2, 0.32, 4]} />
          <meshStandardMaterial color={visual.tone} />
        </mesh>
      </>
    );
  }
  // generic (KVK Expert / anything unmapped): a small book/education shape
  return (
    <>
      <ambientLight intensity={1.1} color="#ffffff" />
      <directionalLight position={[1.5, 2, 2]} intensity={0.7} />
      <mesh rotation={[Math.PI / 2.4, 0, 0]}>
        <boxGeometry args={[0.32, 0.22, 0.04]} />
        <meshStandardMaterial color={visual.tone} />
      </mesh>
    </>
  );
}
