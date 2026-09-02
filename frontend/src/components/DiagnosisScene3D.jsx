import SceneStage from '../three/core/SceneStage';
import DiagnosisScene from '../three/scenes/DiagnosisScene';

export default function DiagnosisScene3D({ cropName, severity, label }) {
  return (
    <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-gradient-to-b from-green-50 to-lime-100 mb-3">
      <SceneStage tone="green" camera={{ position: [0, 1.1, 3.2], fov: 42 }}>
        <DiagnosisScene cropName={cropName} severity={severity} />
      </SceneStage>
      {label && (
        <span className="pointer-events-none absolute bottom-1.5 left-2 text-[10px] font-mono uppercase tracking-wider text-green-900/60 bg-white/70 backdrop-blur px-2 py-0.5 rounded">
          {label}
        </span>
      )}
    </div>
  );
}
