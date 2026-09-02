import { useEffect, useState } from 'react';

/**
 * Detects whether the current device/browser can and should run the
 * WebGL 3D engine, and at what quality tier.
 *
 * Spec refs: #75 Accessibility (reduced motion), #76 Mobile,
 * #77 Performance (device capability detection), #78 3D Fallback.
 */
function detectWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    if (!gl) return false;
    // Free the context immediately, we were only probing.
    const ext = gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
    return true;
  } catch {
    return false;
  }
}

function detectTier() {
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4; // Chrome-only, undefined elsewhere
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile && (cores <= 4 || mem <= 4)) return 'low';
  if (isMobile) return 'medium';
  if (cores <= 4 || mem <= 4) return 'medium';
  return 'high';
}

export function useDeviceCapability() {
  const [state, setState] = useState(() => ({
    webgl: typeof window !== 'undefined' ? detectWebGL() : true,
    tier: typeof window !== 'undefined' ? detectTier() : 'high',
    reducedMotion:
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    isMobile:
      typeof navigator !== 'undefined' &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
  }));

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () =>
      setState((s) => ({ ...s, reducedMotion: mq.matches }));
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  return state;
}

/** Per-tier quality knobs consumed by scene components. */
export const QUALITY_PRESETS = {
  low: { dpr: [1, 1], shadows: false, particles: 0.3, antialias: false },
  medium: { dpr: [1, 1.5], shadows: false, particles: 0.6, antialias: true },
  high: { dpr: [1, 2], shadows: true, particles: 1, antialias: true },
};
