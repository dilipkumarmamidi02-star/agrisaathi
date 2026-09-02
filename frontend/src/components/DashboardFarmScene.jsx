import { OrbitControls } from '@react-three/drei';
import SceneStage from '../three/core/SceneStage';
import FarmCommandCenterScene from '../three/scenes/FarmCommandCenterScene';

export default function DashboardFarmScene({
  farms,
  urgentPlotNames,
  livestockPending,
  weather,
  onSelectFarm,
  onSelectLivestock,
}) {
  return (
    <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-lt-primary/10 bg-gradient-to-b from-sky-100 to-green-50">
      <SceneStage tone="green" camera={{ position: [4, 3.2, 6], fov: 42 }}>
        {({ reducedMotion }) => (
          <>
            <FarmCommandCenterScene
              farms={farms}
              urgentPlotNames={urgentPlotNames}
              livestockPending={livestockPending}
              weather={weather}
              onSelectFarm={onSelectFarm}
              onSelectLivestock={onSelectLivestock}
            />
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              minPolarAngle={Math.PI / 3.4}
              maxPolarAngle={Math.PI / 2.3}
              minAzimuthAngle={-0.6}
              maxAzimuthAngle={0.6}
              autoRotate={!reducedMotion}
              autoRotateSpeed={0.6}
            />
          </>
        )}
      </SceneStage>
      <div className="pointer-events-none absolute bottom-2 left-2 text-[10px] font-mono uppercase tracking-wider text-green-900/50 bg-white/60 backdrop-blur px-2 py-0.5 rounded">
        Tap a field or shed for details
      </div>
    </div>
  );
}
