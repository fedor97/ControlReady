import { useState } from "react";
import { Html, Line } from "@react-three/drei";
import type { ThreeElements, ThreeEvent } from "@react-three/fiber";

/** Cursor + subtle scale-up feedback for clickable 3D equipment. Spread the returned handlers onto a <group>. */
export function useHoverHighlight() {
  const [hovered, setHovered] = useState(false);
  const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  };
  const onPointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = "auto";
  };
  return { hovered, scale: hovered ? 1.05 : 1, onPointerOver, onPointerOut };
}

export type StatusColor = "good" | "warn" | "bad" | "info" | "off";

const STATUS_HEX: Record<StatusColor, string> = {
  good: "#22c55e",
  warn: "#eab308",
  bad: "#ef4444",
  info: "#38bdf8",
  off: "#4b5563",
};

export function StatusLight({ color, ...props }: { color: StatusColor } & ThreeElements["mesh"]) {
  const hex = STATUS_HEX[color];
  return (
    <mesh {...props}>
      <sphereGeometry args={[0.055, 12, 12]} />
      <meshStandardMaterial color={hex} emissive={hex} emissiveIntensity={color === "off" ? 0.15 : 1.1} roughness={0.3} toneMapped={false} />
    </mesh>
  );
}

/**
 * Small industrial ID-tag label. Deliberately compact — at a close camera (e.g. the
 * Control Cabinet preset) drei's distanceFactor scaling magnifies these, so the base
 * size has to be tiny to avoid swallowing tightly-packed equipment.
 */
export function DeviceLabel({
  text,
  sub,
  position,
  onClick,
}: {
  text: string;
  sub?: string;
  position: [number, number, number];
  onClick?: () => void;
}) {
  return (
    <Html position={position} center distanceFactor={6.5} zIndexRange={[1, 0]} occlude={false}>
      <div
        onClick={onClick}
        className="pointer-events-auto flex cursor-pointer select-none items-stretch overflow-hidden whitespace-nowrap rounded-[2px] border border-cr-border/70 bg-cr-panel/95 leading-none shadow-sm"
      >
        <div className="w-[2px] shrink-0 bg-cr-accent" />
        <div className="px-[5px] py-[2px]">
          <div className="font-mono-industrial text-[8px] font-bold tracking-tight text-cr-accent">{text}</div>
          {sub && <div className="mt-[1px] font-mono-industrial text-[6.5px] tracking-tight text-cr-text-dim">{sub}</div>}
        </div>
      </div>
    </Html>
  );
}

/** Cat6 patch cable — a believable industrial blue when healthy, fault red (not glowing) when down. */
export function EthernetLink({
  from,
  to,
  status,
}: {
  from: [number, number, number];
  to: [number, number, number];
  status: "up" | "down";
}) {
  return (
    <Line
      points={[from, to]}
      color={status === "up" ? "#3d6ea8" : "#c73a3a"}
      lineWidth={status === "up" ? 2.5 : 2}
      dashed={status === "down"}
      dashSize={0.1}
      gapSize={0.07}
    />
  );
}

export function Pedestal({ position, size = [0.9, 0.06, 0.6] as [number, number, number] }: { position: [number, number, number]; size?: [number, number, number] }) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#1a2029" roughness={0.8} />
    </mesh>
  );
}
