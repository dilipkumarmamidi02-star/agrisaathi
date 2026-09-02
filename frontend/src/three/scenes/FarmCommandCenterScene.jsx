import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { getWeatherVisual } from '../config/cropVisuals';
import CropField from './CropField';

/**
 * Dashboard = "3D Farm Command Center" (spec #6).
 *
 * Every object on screen is derived from real Dashboard state — nothing
 * here is decorative filler:
 *  - one field patch per real farm/plot, colored+sized by its real crop
 *  - a patch pulses red if that plot has an urgent alert
 *  - the livestock shed pulses amber if there are pending livestock logs
 *  - clicking a patch/shed calls back into the app's real navigation
 *
 * If the farmer has no plots yet, we show a single empty, waiting field
 * (spec #74 empty states) rather than an empty void.
 */

function FieldPatch({ farm, position, urgent, onSelect }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.y = hovered ? 0.06 : 0;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(farm);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      <CropField cropName={farm.current_crop} size={1.7} />
      {urgent && <PulseRing color="#ef4444" />}
    </group>
  );
}

function EmptyFieldPatch({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, -0.02, 0]}>
        <boxGeometry args={[1.7, 0.05, 1.7]} />
        <meshStandardMaterial color="#3f3123" />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[1.5, 0.02, 1.5]} />
        <meshStandardMaterial color="#5a6b4a" wireframe transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function PulseRing({ color }) {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const s = 1 + Math.sin(t * 3) * 0.15;
    if (ref.current) {
      ref.current.scale.set(s, 1, s);
      ref.current.material.opacity = 0.5 + Math.sin(t * 3) * 0.3;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.75, 0.9, 24]} />
      <meshBasicMaterial color={color} transparent opacity={0.7} />
    </mesh>
  );
}

function LivestockShed({ position, pending, onSelect }) {
  const [hovered, setHovered] = useState(false);
  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1, 0.6, 0.8]} />
        <meshStandardMaterial color={hovered ? '#9a6b45' : '#7a5233'} />
      </mesh>
      <mesh position={[0, 0.68, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.75, 0.4, 4]} />
        <meshStandardMaterial color="#5c3a22" />
      </mesh>
      {pending > 0 && (
        <mesh position={[0, 1.1, 0]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      )}
    </group>
  );
}

function Farmhouse() {
  return (
    <group position={[0, 0, -3]}>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[1.1, 0.7, 1]} />
        <meshStandardMaterial color="#d8c7a1" />
      </mesh>
      <mesh position={[0, 0.85, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.85, 0.5, 4]} />
        <meshStandardMaterial color="#8a4a3a" />
      </mesh>
    </group>
  );
}

export default function FarmCommandCenterScene({
  farms = [],
  urgentPlotNames = [],
  livestockPending = 0,
  weather = null,
  onSelectFarm,
  onSelectLivestock,
}) {
  const wv = getWeatherVisual(weather);

  const slots = Math.max(farms.length, 1);
  const cols = Math.min(3, slots);
  const positions = useMemo(() => {
    const list = [];
    const spacing = 2.1;
    for (let i = 0; i < Math.max(farms.length, 3); i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      list.push([
        (col - (cols - 1) / 2) * spacing,
        0,
        1.5 + row * spacing,
      ]);
    }
    return list;
  }, [farms.length, cols]);

  return (
    <>
      <color attach="background" args={[wv.sky]} />
      {wv.fog && <fog attach="fog" args={[wv.fog, 6, 16]} />}
      <ambientLight intensity={wv.intensity * 0.7} color={wv.light} />
      <directionalLight position={[4, 6, 3]} intensity={wv.intensity} color={wv.light} castShadow />

      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color={wv.ground} />
      </mesh>

      <Farmhouse />

      {farms.length === 0 ? (
        <EmptyFieldPatch position={positions[0]} />
      ) : (
        farms.slice(0, 6).map((farm, i) => (
          <FieldPatch
            key={farm.id ?? i}
            farm={farm}
            position={positions[i]}
            urgent={urgentPlotNames.includes(farm.plot_name)}
            onSelect={onSelectFarm}
          />
        ))
      )}

      <LivestockShed position={[3.4, 0, -1.5]} pending={livestockPending} onSelect={onSelectLivestock} />
    </>
  );
}
