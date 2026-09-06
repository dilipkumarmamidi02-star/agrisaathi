import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useDeviceCapability, QUALITY_PRESETS } from '../hooks/useDeviceCapability';
import { attachContextLossRecovery } from './useContextLossRecovery';

/**
 * The one place every module's 3D scene mounts through.
 *
 * Responsibilities (spec #77 Performance, #78 Fallback, #82 Responsive):
 *  - Detect WebGL / reduced-motion / device tier once, share the verdict.
 *  - If WebGL is unavailable, render `fallback` instead of a dead <canvas>.
 *  - If the user prefers reduced motion, still render the scene (so it's
 *    not the *only* way to get information — see accessibility spec) but
 *    pass `reducedMotion` down so scenes can stop camera drift / auto-pan.
 *  - Cap devicePixelRatio and disable AA/shadows on weak devices.
 */
export default function SceneCanvas({
  children,
  fallback = null,
  camera = { position: [0, 2, 6], fov: 45 },
  className = '',
  style,
  onCreated,
  frameloop = 'demand',
}) {
  const { webgl, tier, reducedMotion } = useDeviceCapability();
  const quality = QUALITY_PRESETS[tier];

  if (!webgl) {
    return fallback;
  }

  return (
    <Canvas
      className={className}
      style={{ background: 'transparent', ...style }}
      dpr={quality.dpr}
      gl={{ antialias: quality.antialias, alpha: true, powerPreference: 'high-performance' }}
      shadows={quality.shadows}
      camera={camera}
      frameloop={frameloop}
      onCreated={(state) => {
        attachContextLossRecovery(state.gl);
        if (onCreated) onCreated(state);
      }}
    >
      <Suspense fallback={null}>
        {typeof children === 'function'
          ? children({ quality, tier, reducedMotion })
          : children}
      </Suspense>
    </Canvas>
  );
}
