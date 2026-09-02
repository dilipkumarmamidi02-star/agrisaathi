/**
 * Spec #78: if WebGL is unavailable, degrade gracefully rather than
 * showing nothing. This is a lightweight CSS gradient + soft blobs —
 * no canvas, no JS animation loop, safe on any device.
 */
export default function SceneFallback({ tone = 'green' }) {
  const tones = {
    green: 'from-green-950 via-green-900/40 to-transparent',
    amber: 'from-amber-950 via-amber-900/40 to-transparent',
    sky: 'from-sky-950 via-sky-900/40 to-transparent',
  };
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 bg-gradient-to-b ${tones[tone] || tones.green}`}
    >
      <div className="absolute -top-24 left-1/3 w-72 h-72 rounded-full bg-green-500/10 blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-emerald-400/10 blur-[90px]" />
    </div>
  );
}
