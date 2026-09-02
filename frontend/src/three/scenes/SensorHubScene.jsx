import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Spec #33 "Sensor Hub": "smart farm IoT visualization... soil sensors,
 * moisture, temperature, water, field nodes... sensors should pulse
 * according to their state... actual sensor data must drive the UI."
 *
 * Reads the farmer's real, most recent SensorTest reading (pH,
 * moisture, EC, nitrogen). Each node's pulse speed reflects how
 * "healthy" that real value is relative to a normal band; a node with
 * no reading sits dim/still instead of inventing a state.
 */
const NODES = [
  { id: 'soil_ph', label: 'pH', key: 'soil_ph', band: [5.5, 8], color: '#a855f7' },
  { id: 'soil_moisture', label: 'Moisture', key: 'soil_moisture', band: [20, 60], color: '#3b82f6' },
  { id: 'soil_ec', label: 'EC', key: 'soil_ec', band: [0, 2], color: '#f59e0b' },
  { id: 'soil_nitrogen', label: 'N', key: 'soil_nitrogen', band: [40, 120], color: '#22c55e' },
];

function SensorNode({ position, color, value, band, reducedMotion }) {
  const ref = useRef();
  const hasReading = value != null;
  const inBand = hasReading && value >= band[0] && value <= band[1];
  const pulseSpeed = !hasReading ? 0 : inBand ? 1.6 : 3.4;

  useFrame((state) => {
    if (!ref.current) return;
    if (!hasReading || reducedMotion) {
      ref.current.scale.setScalar(0.9);
      return;
    }
    const s = 1 + Math.sin(state.clock.elapsedTime * pulseSpeed) * 0.16;
    ref.current.scale.setScalar(s);
  });

  return (
    <group position={position}>
      {/* stake */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.16, 6]} />
        <meshStandardMaterial color="#5d4a33" />
      </mesh>
      <mesh ref={ref} position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={inBand ? color : '#ef4444'}
          emissiveIntensity={hasReading ? 0.6 : 0.05}
          transparent
          opacity={hasReading ? 1 : 0.35}
        />
      </mesh>
    </group>
  );
}

export default function SensorHubScene({ latest, readingCount = 0, reducedMotion = false }) {
  const spacing = 0.55;
  const startX = -(spacing * (NODES.length - 1)) / 2;

  return (
    <>
      <color attach="background" args={['#e7f6f8']} />
      <ambientLight intensity={0.95} color="#f0fffb" />
      <directionalLight position={[3, 4, 2]} intensity={0.85} color="#fff8ea" />

      {/* field bed connecting all nodes */}
      <mesh position={[0, -0.01, 0]} receiveShadow>
        <boxGeometry args={[spacing * NODES.length + 0.3, 0.03, 0.6]} />
        <meshStandardMaterial color="#3f3123" />
      </mesh>

      {readingCount === 0 ? (
        // empty state (spec #74): calm field waiting for its first reading
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.4, 0.02, 0.4]} />
          <meshStandardMaterial color="#93a68a" transparent opacity={0.5} />
        </mesh>
      ) : (
        NODES.map((n, i) => (
          <SensorNode
            key={n.id}
            position={[startX + i * spacing, 0, 0]}
            color={n.color}
            value={latest ? latest[n.key] : null}
            band={n.band}
            reducedMotion={reducedMotion}
          />
        ))
      )}
    </>
  );
}
