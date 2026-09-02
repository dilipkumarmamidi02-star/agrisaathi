import SceneStage from '../three/core/SceneStage';
import AuthFieldScene from '../three/scenes/AuthFieldScene';
import FloatingLeaves from './FloatingLeaves';

/**
 * Level-3 subtle-depth background for Login / Register / Forgot / Reset /
 * OAuth consent (spec #65). Real WebGL via React Three Fiber, but kept
 * deliberately cheap: no shadows, no textures, ~26 instanced leaves.
 *
 * On top of the WebGL layer we keep the original CSS FloatingLeaves at
 * low density as a foreground accent — it's free (no GPU) and reads
 * nicely layered over the soft 3D depth behind it.
 */
export default function AuthScene3D() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <SceneStage tone="green" camera={{ position: [0, 0, 6], fov: 50 }}>
        {({ reducedMotion }) => <AuthFieldScene reducedMotion={reducedMotion} />}
      </SceneStage>
      <FloatingLeaves count={6} />
    </div>
  );
}
