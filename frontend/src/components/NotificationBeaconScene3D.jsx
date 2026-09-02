import SceneStage from '../three/core/SceneStage';
import NotificationBeaconScene from '../three/scenes/NotificationBeaconScene';

export default function NotificationBeaconScene3D({ dueSoonCount = 0, overdueCount = 0 }) {
  return (
    <div className="relative w-full h-24 rounded-xl overflow-hidden bg-gradient-to-b from-green-950 to-green-900/40 mb-3">
      <SceneStage tone="green" camera={{ position: [0, 0, 1.4], fov: 42 }}>
        {({ reducedMotion }) => (
          <NotificationBeaconScene dueSoonCount={dueSoonCount} overdueCount={overdueCount} reducedMotion={reducedMotion} />
        )}
      </SceneStage>
    </div>
  );
}
