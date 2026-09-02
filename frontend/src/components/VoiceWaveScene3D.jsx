import SceneStage from '../three/core/SceneStage';
import VoiceWaveScene from '../three/scenes/VoiceWaveScene';

export default function VoiceWaveScene3D({ recording = false, hasTranscript = false }) {
  return (
    <div className="relative w-full h-20 rounded-xl overflow-hidden bg-gradient-to-b from-green-950 to-green-900/40 mb-3">
      <SceneStage tone="green" camera={{ position: [0, 0, 1.6], fov: 45 }}>
        {({ reducedMotion }) => (
          <VoiceWaveScene recording={recording} hasTranscript={hasTranscript} reducedMotion={reducedMotion} />
        )}
      </SceneStage>
    </div>
  );
}
