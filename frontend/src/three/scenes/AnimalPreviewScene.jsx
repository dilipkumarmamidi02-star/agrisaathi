import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import AnimalModel from './AnimalModel';

export default function AnimalPreviewScene({ category, maturity = 1, reducedMotion = false, autoRotateSpeed = 0.3 }) {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (reducedMotion || !groupRef.current) return;
    groupRef.current.rotation.y += delta * autoRotateSpeed;
  });

  return (
    <>
      <ambientLight intensity={0.85} color="#fff6dc" />
      <directionalLight position={[3, 4, 2]} intensity={0.9} color="#fff6dc" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[0.9, 24]} />
        <meshStandardMaterial color="#8a7550" />
      </mesh>
      <group ref={groupRef}>
        <AnimalModel category={category} maturity={maturity} />
      </group>
    </>
  );
}
