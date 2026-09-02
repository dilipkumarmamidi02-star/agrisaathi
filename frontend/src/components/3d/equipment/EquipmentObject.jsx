export default function EquipmentObject({
  position = [0, 0.5, 0],
  type = "tractor",
  selected = false,
  onSelect,
}) {
  return (
    <group
      position={position}
      scale={selected ? 1.1 : 1}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
    >
      <mesh castShadow>
        <boxGeometry args={[1.7, 0.65, 0.9]} />
        <meshStandardMaterial
          color="#59665c"
          roughness={0.55}
          emissive={selected ? "#d5ad5d" : "#000000"}
          emissiveIntensity={selected ? 0.35 : 0}
        />
      </mesh>

      <mesh
        position={[-0.55, -0.42, 0.48]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.25, 0.25, 0.18, 20]} />
        <meshStandardMaterial
          color="#202522"
          roughness={0.85}
        />
      </mesh>

      <mesh
        position={[-0.55, -0.42, -0.48]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.25, 0.25, 0.18, 20]} />
        <meshStandardMaterial
          color="#202522"
          roughness={0.85}
        />
      </mesh>

      <mesh
        position={[0.62, -0.35, 0.48]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.18, 0.18, 0.15, 20]} />
        <meshStandardMaterial
          color="#202522"
          roughness={0.85}
        />
      </mesh>

      <mesh
        position={[0.62, -0.35, -0.48]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.18, 0.18, 0.15, 20]} />
        <meshStandardMaterial
          color="#202522"
          roughness={0.85}
        />
      </mesh>
    </group>
  );
}
