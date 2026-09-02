import { Canvas } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
} from "@react-three/drei";

export default function Phase7Scene({
  children,
  cameraPosition = [7, 5, 8],
  minDistance = 4,
  maxDistance = 18,
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 420,
        position: "relative",
        overflow: "hidden",
        borderRadius: 24,
      }}
    >
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{
          position: cameraPosition,
          fov: 45,
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
        }}
      >
        <ambientLight intensity={0.65} />

        <directionalLight
          position={[6, 9, 6]}
          intensity={1.25}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <Environment preset="park" />

        {children}

        <OrbitControls
          enablePan={false}
          minDistance={minDistance}
          maxDistance={maxDistance}
        />
      </Canvas>
    </div>
  );
}
