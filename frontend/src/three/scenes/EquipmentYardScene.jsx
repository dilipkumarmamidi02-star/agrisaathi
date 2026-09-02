import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { getEquipmentVisual } from '../config/equipmentVisuals';

/**
 * Spec #41 "Equipment Registry": "interactive farm equipment yard...
 * tractor, harvester, pump, sprayer, tools. Selecting equipment ->
 * camera focuses on it... use actual application data." One low-poly
 * silhouette per real registered machine (matched by its free-text
 * `type` via equipmentVisuals), pulsing red when its real
 * next_maintenance date has actually passed.
 */
function Machine({ position, shape, color, overdue, reducedMotion }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || !overdue || reducedMotion) return;
    ref.current.material.emissiveIntensity = 0.35 + Math.sin(state.clock.elapsedTime * 3.2) * 0.3;
  });

  const emissive = overdue ? '#ef4444' : '#000000';

  if (shape === 'tractor') {
    return (
      <group position={position}>
        <mesh position={[0, 0.09, 0]}>
          <boxGeometry args={[0.22, 0.1, 0.14]} />
          <meshStandardMaterial ref={ref} color={color} emissive={emissive} emissiveIntensity={overdue ? 0.35 : 0} />
        </mesh>
        <mesh position={[-0.08, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.03, 12]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0.08, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.03, 12]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>
    );
  }
  if (shape === 'harvester') {
    return (
      <group position={position}>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.3, 0.12, 0.14]} />
          <meshStandardMaterial ref={ref} color={color} emissive={emissive} emissiveIntensity={overdue ? 0.35 : 0} />
        </mesh>
        <mesh position={[0.18, 0.13, 0]}>
          <boxGeometry args={[0.08, 0.18, 0.1]} />
          <meshStandardMaterial color="#c0392b" />
        </mesh>
      </group>
    );
  }
  if (shape === 'pump') {
    return (
      <mesh ref={ref} position={[position[0], 0.06, position[2]]}>
        <cylinderGeometry args={[0.07, 0.07, 0.12, 10]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={overdue ? 0.35 : 0} />
      </mesh>
    );
  }
  if (shape === 'sprayer') {
    return (
      <group position={position}>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.16, 10]} />
          <meshStandardMaterial ref={ref} color={color} emissive={emissive} emissiveIntensity={overdue ? 0.35 : 0} />
        </mesh>
        <mesh position={[0.09, 0.12, 0]} rotation={[0, 0, Math.PI / 3]}>
          <cylinderGeometry args={[0.008, 0.008, 0.14, 6]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>
    );
  }
  // generic tool
  return (
    <mesh ref={ref} position={[position[0], 0.05, position[2]]}>
      <boxGeometry args={[0.12, 0.1, 0.12]} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={overdue ? 0.35 : 0} />
    </mesh>
  );
}

export default function EquipmentYardScene({ equipment = [], reducedMotion = false }) {
  const spacing = 0.5;
  const startX = -(spacing * Math.max(0, equipment.length - 1)) / 2;

  return (
    <>
      <color attach="background" args={['#eef2ee']} />
      <ambientLight intensity={0.95} color="#f4fff2" />
      <directionalLight position={[3, 4, 2]} intensity={0.9} color="#fff6dc" />

      {/* yard ground */}
      <mesh position={[0, -0.01, 0]} receiveShadow>
        <boxGeometry args={[Math.max(1.2, spacing * equipment.length + 0.4), 0.02, 0.8]} />
        <meshStandardMaterial color="#7a8a6b" />
      </mesh>

      {equipment.length === 0 ? (
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[0.2, 0.02, 0.2]} />
          <meshStandardMaterial color="#93a68a" transparent opacity={0.5} />
        </mesh>
      ) : (
        equipment.map((eq, i) => {
          const visual = getEquipmentVisual(eq.type);
          return (
            <Machine
              key={eq.name}
              position={[startX + i * spacing, 0, 0]}
              shape={visual.shape}
              color={visual.color}
              overdue={eq.overdue}
              reducedMotion={reducedMotion}
            />
          );
        })
      )}
    </>
  );
}
