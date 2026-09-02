import { OrbitControls } from '@react-three/drei';
import SceneStage from '../three/core/SceneStage';
import PestScene from '../three/scenes/PestScene';

export default function PestScene3D({ cropName, type, label }) {
  return (
    <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-gradient-to-b from-green-50 to-lime-100 mb-3">
      <SceneStage tone="green" camera={{ position: [0, 1.1, 3.2], fov: 42 }}>
        {() => (
          <>
            <PestScene cropName={cropName} type={type} />
            <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 3.2} maxPolarAngle={Math.PI / 2.2} />
          </>
        )}
      </SceneStage>
      {label && (
        <span className="pointer-events-none absolute bottom-1.5 left-2 text-[10px] font-mono uppercase tracking-wider text-green-900/60 bg-white/70 backdrop-blur px-2 py-0.5 rounded">
          {label}
        </span>
      )}
    </div>
  );
}
