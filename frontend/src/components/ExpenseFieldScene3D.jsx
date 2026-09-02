import SceneStage from '../three/core/SceneStage';
import ExpenseFieldScene from '../three/scenes/ExpenseFieldScene';

export default function ExpenseFieldScene3D({ topCategories }) {
  return (
    <div className="relative w-full h-28 rounded-xl overflow-hidden bg-gradient-to-b from-red-50 to-orange-50 mb-3">
      <SceneStage tone="amber" camera={{ position: [0, 1, 1.9], fov: 40 }}>
        {({ reducedMotion }) => (
          <ExpenseFieldScene topCategories={topCategories} reducedMotion={reducedMotion} />
        )}
      </SceneStage>
    </div>
  );
}
