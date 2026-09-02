import SceneStage from '../three/core/SceneStage';
import TaskFieldScene from '../three/scenes/TaskFieldScene';

export default function TaskFieldScene3D({ tasks = [], overdueCount = 0 }) {
  return (
    <div className="relative w-full h-28 rounded-xl overflow-hidden bg-gradient-to-b from-green-950 to-green-900/40 mb-4">
      <SceneStage tone="green" camera={{ position: [0, 0.7, 1.7], fov: 42 }}>
        {({ reducedMotion }) => (
          <TaskFieldScene tasks={tasks} overdueCount={overdueCount} reducedMotion={reducedMotion} />
        )}
      </SceneStage>
    </div>
  );
}
