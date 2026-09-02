import SceneStage from '../three/core/SceneStage';
import WeatherScene from '../three/scenes/WeatherScene';

/**
 * Real weather diorama wrapper (spec #30). `condition` must come from a
 * real value already mapped via mapWeatherDescriptionToCondition or
 * mapWmoCodeToCondition — never invented here.
 */
export default function WeatherScene3D({ condition = 'default', windSpeed = 0, label, height = 'h-40' }) {
  return (
    <div className={`relative w-full ${height} rounded-xl overflow-hidden mb-3`}>
      <SceneStage tone="sky" camera={{ position: [0, 1, 5], fov: 42 }}>
        {({ reducedMotion }) => (
          <WeatherScene condition={condition} windSpeed={windSpeed} reducedMotion={reducedMotion} />
        )}
      </SceneStage>

      {label && (
        <span className="pointer-events-none absolute bottom-1.5 left-2 text-[10px] font-mono uppercase tracking-wider text-white/90 bg-black/30 backdrop-blur px-2 py-0.5 rounded">
          {label}
        </span>
      )}
    </div>
  );
}
