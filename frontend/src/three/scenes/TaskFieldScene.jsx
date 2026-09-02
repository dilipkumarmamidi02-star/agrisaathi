import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { getTaskColor } from '../config/taskVisuals';

/**
 * Spec #55 "Task Manager": "Create a farm operations board... Completed
 * tasks -> subtle field-progress visualization. Due tasks -> contextual
 * indicator." `tasks` is the real, live task list from the page (each
 * with `.category` and `.status`). Pending tasks stand as colored posts
 * (color from the real category, capped at 10 posts for legibility);
 * the ground strip fills left-to-right by the real completion ratio.
 */
export default function TaskFieldScene({ tasks = [], overdueCount = 0, reducedMotion = false }) {
  const groupRef = useRef();
  const pending = tasks.filter((t) => t.status !== 'done').slice(0, 10);
  const doneRatio = tasks.length ? tasks.filter((t) => t.status === 'done').length / tasks.length : 0;

  useFrame((state) => {
    if (!groupRef.current || reducedMotion) return;
    groupRef.current.children.forEach((child, i) => {
      child.position.y = 0.15 + Math.sin(state.clock.elapsedTime * 1.4 + i) * 0.015;
    });
  });

  return (
    <>
      <color attach="background" args={['#0f1a14']} />
      <ambientLight intensity={1} color="#eafaf0" />
      <directionalLight position={[2, 3, 2]} intensity={0.6} color="#bff7c8" />

      {/* field strip */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 0.5]} />
        <meshStandardMaterial color="#2b3a1c" />
      </mesh>
      {/* progress fill, width = real completion ratio */}
      <mesh position={[-1.1 + (2.2 * doneRatio) / 2, -0.048, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2 * Math.max(0.001, doneRatio), 0.5]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>

      <group ref={groupRef}>
        {pending.map((task, i) => {
          const x = (i - (pending.length - 1) / 2) * 0.18;
          return (
            <mesh key={task.id || i} position={[x, 0.15, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.3, 6]} />
              <meshStandardMaterial
                color={getTaskColor(task.category)}
                emissive={task.priority === 'high' ? '#ef4444' : '#000000'}
                emissiveIntensity={task.priority === 'high' ? 0.3 : 0}
              />
            </mesh>
          );
        })}
      </group>

      {overdueCount > 0 && (
        <mesh position={[0.9, 0.4, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
        </mesh>
      )}
    </>
  );
}
