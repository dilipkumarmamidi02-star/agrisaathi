import { useMemo } from 'react';

// Level-3 "subtle depth" background: gentle floating leaf particles.
// Pure CSS animation, no Three.js — keeps auth pages fast per spec
// ("Authentication must remain fast", "Do NOT use large heavy 3D scenes").

const LEAF_PATH =
  'M12 2C7 2 3 6 3 11c0 6 9 11 9 11s9-5 9-11c0-5-4-9-9-9z';

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export default function FloatingLeaves({ count = 10 }) {
  const leaves = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: randomBetween(2, 96),
        size: randomBetween(10, 22),
        duration: randomBetween(14, 26),
        delay: randomBetween(0, 12),
        drift: randomBetween(-40, 40),
        rotateStart: randomBetween(0, 360),
        opacity: randomBetween(0.08, 0.22),
      })),
    [count]
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {leaves.map((leaf) => (
        <svg
          key={leaf.id}
          viewBox="0 0 24 24"
          width={leaf.size}
          height={leaf.size}
          className="absolute text-green-500"
          style={{
            left: `${leaf.left}%`,
            top: '-10%',
            opacity: leaf.opacity,
            animation: `leaf-fall-${leaf.id} ${leaf.duration}s linear ${leaf.delay}s infinite`,
            '--drift': `${leaf.drift}px`,
            '--rotate-start': `${leaf.rotateStart}deg`,
          }}
        >
          <path fill="currentColor" d={LEAF_PATH} />
          <style>{`
            @keyframes leaf-fall-${leaf.id} {
              0% {
                transform: translate(0, 0) rotate(var(--rotate-start));
              }
              100% {
                transform: translate(var(--drift), 120vh) rotate(calc(var(--rotate-start) + 180deg));
              }
            }
          `}</style>
        </svg>
      ))}
    </div>
  );
}
