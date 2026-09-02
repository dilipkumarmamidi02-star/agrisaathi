import SceneStage from '../three/core/SceneStage';
import TrainingAcademyScene from '../three/scenes/TrainingAcademyScene';

export default function TrainingAcademyScene3D({ categories, activeCategory }) {
  return (
    <div className="relative w-full h-32 rounded-xl overflow-hidden bg-gradient-to-b from-green-50 to-lime-50 mb-3">
      <SceneStage tone="green" camera={{ position: [0, 1.1, 2.2], fov: 44 }}>
        {({ reducedMotion }) => (
          <TrainingAcademyScene categories={categories} activeCategory={activeCategory} reducedMotion={reducedMotion} />
        )}
      </SceneStage>
    </div>
  );
}
