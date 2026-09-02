import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import useDeviceCapability from '../../../hooks/useDeviceCapability';

function FarmPlaceholder() {
  return (
    <group>
      <mesh position={[0, -1, 0]}>
        <boxGeometry args={[12, 0.5, 12]} />
        <meshStandardMaterial color="#496b3a" />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3, 1, 3]} />
        <meshStandardMaterial color="#8a6a43" />
      </mesh>

      <mesh position={[0, 1, 0]}>
        <coneGeometry args={[2, 2, 4]} />
        <meshStandardMaterial color="#557a3e" />
      </mesh>
    </group>
  );
}

function SceneContent() {
  return (
    <>
      <ambientLight intensity={0.8} />

      <directionalLight
        position={[5, 8, 5]}
        intensity={2}
        castShadow
      />

      <Environment preset="park" />

      <FarmPlaceholder />

      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={20}
      />
    </>
  );
}

export default function DynamicScene({
  className = '',
}) {
  const {
    webgl,
    tier,
  } = useDeviceCapability();

  if (!webgl) {
    return (
      <div
        className={`rounded-2xl bg-lt-bg p-6 ${className}`}
        role="img"
        aria-label="3D farm visualization unavailable"
      >
        <div className="text-sm text-lt-text-muted">
          Interactive 3D is unavailable on this device.
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{ minHeight: 420 }}
    >
      <Canvas
        shadows={tier !== 'low'}
        dpr={tier === 'low' ? [1, 1] : [1, 1.5]}
        camera={{
          position: [8, 6, 8],
          fov: 45,
        }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
