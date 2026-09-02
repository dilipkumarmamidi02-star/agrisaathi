export default function StorageObject({
  position = [0, 0.5, 0],
  label = "Storage",
  quantity = null,
  selected = false,
  lowStock = false,
  onSelect,
}) {
  return (
    <group
      position={position}
      scale={selected ? 1.12 : 1}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
    >
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.9, 0.8]} />
        <meshStandardMaterial
          color="#8b6845"
          emissive={selected ? "#d8a85b" : "#000000"}
          emissiveIntensity={selected ? 0.35 : 0}
        />
      </mesh>

      {lowStock && (
        <mesh position={[0, 0.55, 0]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial
            color="#ff9f43"
            emissive="#ff7a00"
            emissiveIntensity={1.5}
          />
        </mesh>
      )}
    </group>
  );
}
