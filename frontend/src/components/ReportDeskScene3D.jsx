import SceneStage from '../three/core/SceneStage';
import ReportDeskScene from '../three/scenes/ReportDeskScene';

export default function ReportDeskScene3D({ sectionsOn = 3, generating = false }) {
  return (
    <div className="relative w-full h-24 rounded-xl overflow-hidden bg-gradient-to-b from-amber-50 to-stone-50 mb-3">
      <SceneStage tone="amber" camera={{ position: [0, 0.5, 1.8], fov: 42 }}>
        {({ reducedMotion }) => (
          <ReportDeskScene sectionsOn={sectionsOn} generating={generating} reducedMotion={reducedMotion} />
        )}
      </SceneStage>
    </div>
  );
}
