import SceneStage from '../three/core/SceneStage';
import AlertWatchtowerScene from '../three/scenes/AlertWatchtowerScene';

export default function AlertWatchtowerScene3D({ stockAlerts = 0, weatherAlerts = 0, priceAlerts = 0 }) {
  return (
    <div className="relative w-full h-24 rounded-xl overflow-hidden bg-gradient-to-b from-sky-950 to-sky-900/40 mb-3">
      <SceneStage tone="sky" camera={{ position: [0, 0.3, 1.9], fov: 42 }}>
        {({ reducedMotion }) => (
          <AlertWatchtowerScene
            stockAlerts={stockAlerts}
            weatherAlerts={weatherAlerts}
            priceAlerts={priceAlerts}
            reducedMotion={reducedMotion}
          />
        )}
      </SceneStage>
    </div>
  );
}
