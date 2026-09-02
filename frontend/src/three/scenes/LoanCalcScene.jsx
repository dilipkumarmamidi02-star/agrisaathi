import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Spec #46 "Loan Calculator": sliders must immediately update the
 * visualization, but "do not sacrifice numerical clarity" — the
 * recharts repayment-schedule bar chart (already in LoanCalculator.jsx)
 * remains the primary, readable data view. This is a small ambient
 * accent: a coin stack split principal/interest, using the *same*
 * real numbers the chart uses (no separate estimate).
 *
 * principalRatio: totalPayable's principal share, 0..1, from real EMI math
 */
function Coin({ position, color }) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.32, 0.32, 0.05, 24]} />
      <meshStandardMaterial color={color} metalness={0.35} roughness={0.4} />
    </mesh>
  );
}

export default function LoanCalcScene({ principalRatio = 0.7, stackHeight = 6, reducedMotion = false }) {
  const groupRef = useRef();
  useFrame((state, delta) => {
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  const coins = useMemo(() => {
    const n = Math.max(3, Math.min(10, Math.round(stackHeight)));
    const principalCoins = Math.round(n * Math.max(0, Math.min(1, principalRatio)));
    return Array.from({ length: n }, (_, i) => ({
      y: i * 0.06,
      isPrincipal: i < principalCoins,
    }));
  }, [stackHeight, principalRatio]);

  return (
    <>
      <color attach="background" args={['#f4f1e6']} />
      <ambientLight intensity={0.95} color="#fff8ea" />
      <directionalLight position={[2, 4, 2]} intensity={0.9} color="#fff2cf" />
      <group ref={groupRef}>
        {coins.map((c, i) => (
          <Coin key={i} position={[0, c.y, 0]} color={c.isPrincipal ? '#16a34a' : '#f59e0b'} />
        ))}
      </group>
    </>
  );
}
