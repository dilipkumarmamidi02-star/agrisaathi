import SceneStage from '../three/core/SceneStage';
import SpeakContextScene from '../three/scenes/SpeakContextScene';

/**
 * Mounts the topic-reactive scene for Speak to AgriSaathi (spec #14).
 * Kept small/inline (not full-bleed) so it never competes with the mic
 * button and transcript/response panels, which stay primary.
 */
export default function SpeakContextScene3D({ topic, crop, commodity, weatherCondition }) {
  return (
    <div className="relative w-full h-36 max-w-lg rounded-xl overflow-hidden mb-6">
      <SceneStage tone="green" camera={{ position: [0, 1.1, 3.6], fov: 42 }}>
        {({ reducedMotion }) => (
          <SpeakContextScene
            topic={topic}
            crop={crop}
            commodity={commodity}
            weatherCondition={weatherCondition}
            reducedMotion={reducedMotion}
          />
        )}
      </SceneStage>
    </div>
  );
}
