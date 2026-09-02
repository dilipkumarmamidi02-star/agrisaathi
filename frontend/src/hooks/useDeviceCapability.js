import { useEffect, useState } from 'react';

export default function useDeviceCapability() {
  const [capability, setCapability] = useState({
    webgl: true,
    tier: 'unknown',
    reducedMotion: false,
  });

  useEffect(() => {
    const canvas = document.createElement('canvas');

    let webgl = false;

    try {
      webgl = Boolean(
        canvas.getContext('webgl2') ||
        canvas.getContext('webgl')
      );
    } catch {
      webgl = false;
    }

    const reducedMotion =
      window.matchMedia?.(
        '(prefers-reduced-motion: reduce)'
      )?.matches ?? false;

    const memory = navigator.deviceMemory || 4;

    let tier = 'high';

    if (memory <= 2) {
      tier = 'low';
    } else if (memory <= 4) {
      tier = 'medium';
    }

    setCapability({
      webgl,
      tier,
      reducedMotion,
    });
  }, []);

  return capability;
}
