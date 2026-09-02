import { OrbitControls } from '@react-three/drei';
import SceneStage from '../three/core/SceneStage';
import CropPreviewScene from '../three/scenes/CropPreviewScene';

export default function CropEncyclopediaScene3D({ cropName, stageProgress }) {
  return (
    <div className="relative w-full h-52 rounded-2xl overflow-hidden bg-gradient-to-b from-green-50 to-lime-100 mb-3">
      <SceneStage tone="green" camera={{ position: [0, 1.3, 4], fov: 42 }}>
        {({ reducedMotion }) => (
          <>
            <CropPreviewScene cropName={cropName} stageProgress={stageProgress} reducedMotion={reducedMotion} autoRotateSpeed={0} />
            <OrbitControls
              enablePan={false}
              minDistance={2.2}
              maxDistance={6}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 2.1}
            />
          </>
        )}
      </SceneStage>
      <span className="pointer-events-none absolute bottom-1.5 right-2 text-[10px] font-mono uppercase tracking-wider text-green-900/50 bg-white/70 backdrop-blur px-2 py-0.5 rounded">
        Drag to rotate · pinch to zoom
      </span>
    </div>
  );
}
