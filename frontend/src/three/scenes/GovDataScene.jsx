import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Spec #18 "Data Gov Live Data": "premium Government Data Intelligence
 * Center... floating data streams, source nodes, dataset cards, resource
 * visualization, data freshness indicators. Do NOT alter the underlying
 * data architecture. Make source authority and freshness visually
 * obvious." Level-2 contextual (spec #64) — more presence than the
 * Level-3 admin utilities, but the real ResourceTable stays primary.
 *
 * Every value here comes straight from DataGovLiveData.jsx's real state:
 * - `resourceCount`  = resources.length (the real registered-resource list)
 * - `liveCount` / `emptyCount` / `errorCount` = the real summary counts
 *   derived from actual API responses (LIVE-DATA / LIVE-EMPTY / API-ERROR)
 * - `loading`        = true while a resource's live records are being fetched
 * Node colors map 1:1 to the same status colors the ResourceCard badges
 * already use (green=live, amber=empty, red=error, slate=not-loaded) so
 * the 3D layer never contradicts the real cards below it.
 */
const MAX_NODES = 18;

export default function GovDataScene({
  resourceCount = 0,
  liveCount = 0,
  emptyCount = 0,
  errorCount = 0,
  loading = false,
  reducedMotion = false,
}) {
  const groupRef = useRef();
  const coreRef = useRef();

  // One node per real registered resource (capped for legibility), each
  // assigned a real status in the same proportion as the real counts —
  // live nodes first, then empty, then error, then not-loaded, so the
  // visual mix always matches the actual registry, never invented ratios.
  const nodes = useMemo(() => {
    const total = Math.max(1, Math.min(MAX_NODES, resourceCount || 1));
    const statuses = [];
    for (let i = 0; i < Math.min(liveCount, total); i++) statuses.push('live');
    for (let i = 0; i < Math.min(emptyCount, total - statuses.length); i++) statuses.push('empty');
    for (let i = 0; i < Math.min(errorCount, total - statuses.length); i++) statuses.push('error');
    while (statuses.length < total) statuses.push('idle');

    const colorFor = { live: '#4ade80', empty: '#fbbf24', error: '#f87171', idle: '#64748b' };

    return statuses.map((status, i) => {
      const angle = (i / total) * Math.PI * 2;
      const ring = i % 2 === 0 ? 1.0 : 1.35;
      return {
        status,
        color: colorFor[status],
        angle,
        radius: ring,
        height: THREE.MathUtils.randFloatSpread(0.6),
        speed: THREE.MathUtils.randFloat(0.15, 0.35),
      };
    });
  }, [resourceCount, liveCount, emptyCount, errorCount]);

  // Freshness ratio drives the central core's glow — more live data,
  // brighter authoritative core; more errors, the core dims toward amber.
  const freshness = resourceCount > 0 ? liveCount / resourceCount : 0;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y = t * 0.15;
    }
    if (coreRef.current) {
      const pulse = loading ? 1 + Math.sin(t * 6) * 0.15 : 1 + Math.sin(t * 1.2) * 0.05;
      coreRef.current.scale.setScalar(pulse * (0.7 + freshness * 0.3));
    }
  });

  return (
    <>
      <color attach="background" args={['#070d16']} />
      <ambientLight intensity={0.8} color="#dbeafe" />
      <pointLight position={[0, 0, 2]} intensity={1} color="#38bdf8" />

      {/* Registry core — authority/freshness indicator, not decoration */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.28, 1]} />
        <meshStandardMaterial
          color={freshness > 0.5 ? '#22c55e' : freshness > 0 ? '#eab308' : '#475569'}
          emissive={freshness > 0.5 ? '#22c55e' : freshness > 0 ? '#eab308' : '#334155'}
          emissiveIntensity={0.5}
          wireframe
        />
      </mesh>

      <group ref={groupRef}>
        {nodes.map((n, i) => {
          const x = Math.cos(n.angle) * n.radius;
          const z = Math.sin(n.angle) * n.radius;
          const y = n.height;
          return (
            <group key={i}>
              <mesh position={[x, y, z]}>
                <boxGeometry args={[0.09, 0.09, 0.09]} />
                <meshStandardMaterial
                  color={n.color}
                  emissive={n.color}
                  emissiveIntensity={n.status === 'idle' ? 0.1 : 0.45}
                />
              </mesh>
              {/* data-stream line back to the registry core */}
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={2}
                    array={new Float32Array([0, 0, 0, x, y, z])}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial color={n.color} transparent opacity={n.status === 'idle' ? 0.12 : 0.4} />
              </line>
            </group>
          );
        })}
      </group>
    </>
  );
}
