import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useSimStore } from "../../state/simStore";
import type { DeviceId } from "../../types";
import { DeviceLabel, EthernetLink, StatusLight, useHoverHighlight, type StatusColor } from "../../components/lab3d/primitives";
import { MAT } from "./materials";

function linkStatus(poweredOnA: boolean, cableA: boolean, poweredOnB: boolean, cableB: boolean): "up" | "down" {
  return poweredOnA && cableA && poweredOnB && cableB ? "up" : "down";
}

function useDevice(id: DeviceId) {
  return useSimStore((s) => s.devices.find((d) => d.id === id));
}

/** Enclosed shell: back + side walls, ceiling with recessed fixtures, painted floor with zone striping. */
function Room() {
  const xMin = -7.5;
  const xMax = 8.5;
  const zBack = -4.6;
  const zFront = 4.2;
  const height = 4.2;
  const width = xMax - xMin;
  const depth = zFront - zBack;
  const cx = (xMin + xMax) / 2;
  const cz = (zBack + zFront) / 2;

  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0, cz]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial {...MAT.floorConcrete} />
      </mesh>
      {/* zone stripes (painted floor lines instead of a debug grid) */}
      <FloorStripe position={[-2.6, 0, -3.7]} size={[0.08, 7.8]} />
      <FloorStripe position={[2.9, 0, -3.7]} size={[0.08, 7.8]} />

      {/* back wall */}
      <mesh position={[cx, height / 2, zBack]} receiveShadow>
        <boxGeometry args={[width, height, 0.2]} />
        <meshStandardMaterial {...MAT.wallPaint} />
      </mesh>
      {/* left wall */}
      <mesh position={[xMin, height / 2, cz]} receiveShadow>
        <boxGeometry args={[0.2, height, depth]} />
        <meshStandardMaterial {...MAT.wallPaint} />
      </mesh>
      {/* right wall */}
      <mesh position={[xMax, height / 2, cz]} receiveShadow>
        <boxGeometry args={[0.2, height, depth]} />
        <meshStandardMaterial {...MAT.wallPaint} />
      </mesh>
      {/* wall base trim */}
      <mesh position={[cx, 0.08, zBack + 0.11]}>
        <boxGeometry args={[width, 0.16, 0.02]} />
        <meshStandardMaterial {...MAT.baseboard} />
      </mesh>

      {/* ceiling */}
      <mesh position={[cx, height, cz]}>
        <boxGeometry args={[width, 0.15, depth]} />
        <meshStandardMaterial {...MAT.ceilingTile} />
      </mesh>
      {/* recessed fluorescent fixtures — a frame plus a softly emissive diffuser, not a bare glowing box */}
      {[-4, -1, 2, 5].map((x) => (
        <group key={x} position={[x, height - 0.09, cz]}>
          <mesh>
            <boxGeometry args={[2.3, 0.05, 0.6]} />
            <meshStandardMaterial color="#e9ebee" roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.02, 0]}>
            <boxGeometry args={[2.1, 0.03, 0.46]} />
            <meshStandardMaterial color="#fbfdff" emissive="#eaf1ff" emissiveIntensity={0.9} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function FloorStripe({ position, size }: { position: [number, number, number]; size: [number, number] }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], 0.003, position[2]]}>
      <planeGeometry args={size} />
      <meshStandardMaterial {...MAT.safetyYellow} />
    </mesh>
  );
}

function ZoneCaption({ position, label }: { position: [number, number, number]; label: string }) {
  return (
    <Text position={position} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.22} color="#6b7078" anchorX="center" anchorY="middle">
      {label}
    </Text>
  );
}

/** Galvanized cable tray running along the back wall, feeding conduit drops to the cabinet and the server rack. */
function CableTray() {
  return (
    <group>
      <mesh position={[-1, 3.6, -4.35]}>
        <boxGeometry args={[11, 0.12, 0.3]} />
        <meshStandardMaterial {...MAT.steelFrame} />
      </mesh>
      {[-5.3, -1, 2.2, 5.4].map((x) => (
        <mesh key={x} position={[x, 3.6, -4.35]}>
          <boxGeometry args={[0.05, 0.12, 0.36]} />
          <meshStandardMaterial {...MAT.steelDark} />
        </mesh>
      ))}
      {/* drops */}
      <mesh position={[-4.6, 2.2, -4.3]}>
        <boxGeometry args={[0.08, 2.6, 0.08]} />
        <meshStandardMaterial {...MAT.steelFrame} />
      </mesh>
      <mesh position={[5.4, 2.2, -4.3]}>
        <boxGeometry args={[0.08, 2.6, 0.08]} />
        <meshStandardMaterial {...MAT.steelFrame} />
      </mesh>
    </group>
  );
}

/** Everything lives inside the Control Panel cabinet — tightly grouped, as a real panel would be built. */
function ControlCabinet() {
  const setInspected = useSimStore((s) => s.setInspected);
  const plc = useDevice("plc");
  const tags = useSimStore((s) => s.tags);
  const commOk = Boolean(tags.VFD_Communication_OK);
  const motorCommand = Boolean(tags.Motor_Command);
  const overloadOk = Boolean(tags.Overload_OK);

  const contactorRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!contactorRef.current) return;
    const target = motorCommand ? 0.94 : 1;
    contactorRef.current.scale.y += (target - contactorRef.current.scale.y) * 0.35;
  });

  const plcHover = useHoverHighlight();
  const swHover = useHoverHighlight();
  const starterHover = useHoverHighlight();
  const overloadHover = useHoverHighlight();

  const plcStatus: StatusColor = plc?.poweredOn ? (commOk ? "good" : "warn") : "off";

  return (
    <group position={[-4.6, 0, -3.9]}>
      {/* enclosure, mounted to the back wall — painted steel cabinet */}
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 2.2, 0.9]} />
        <meshStandardMaterial {...MAT.cabinetPaint} />
      </mesh>
      {/* recessed door face */}
      <mesh position={[0, 1.1, 0.46]}>
        <boxGeometry args={[2.4, 2.0, 0.03]} />
        <meshStandardMaterial {...MAT.cabinetDoorInset} />
      </mesh>
      {/* door seam */}
      <mesh position={[0, 1.1, 0.48]}>
        <boxGeometry args={[0.015, 2.0, 0.01]} />
        <meshStandardMaterial {...MAT.darkBezel} />
      </mesh>
      {/* hinges */}
      {[0.55, 0, -0.55].map((y) => (
        <mesh key={y} position={[-1.29, 1.1 + y, 0.4]}>
          <cylinderGeometry args={[0.03, 0.03, 0.1, 8]} />
          <meshStandardMaterial {...MAT.steelDark} />
        </mesh>
      ))}
      {/* handle */}
      <mesh position={[1.15, 1.1, 0.5]}>
        <boxGeometry args={[0.05, 0.3, 0.06]} />
        <meshStandardMaterial {...MAT.steelDark} />
      </mesh>
      {/* louvered vents, lower door */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-0.9, 0.28 + i * 0.08, 0.48]}>
          <boxGeometry args={[0.5, 0.02, 0.01]} />
          <meshStandardMaterial {...MAT.darkBezel} />
        </mesh>
      ))}
      {/* warning placard */}
      <group position={[1.0, 1.9, 0.48]}>
        <mesh>
          <planeGeometry args={[0.26, 0.2]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0, 0, 0.002]}>
          <planeGeometry args={[0.22, 0.16]} />
          <meshStandardMaterial {...MAT.safetyYellow} />
        </mesh>
      </group>

      {/* PLC — rack body, DIN rail, and three status LEDs like a real controller */}
      <group
        position={[-0.8, 1.55, 0.5]}
        scale={plcHover.scale}
        onPointerOver={plcHover.onPointerOver}
        onPointerOut={plcHover.onPointerOut}
        onClick={(e) => {
          e.stopPropagation();
          setInspected("plc");
        }}
      >
        <mesh position={[0, -0.42, -0.02]}>
          <boxGeometry args={[0.62, 0.03, 0.1]} />
          <meshStandardMaterial {...MAT.steelFrame} />
        </mesh>
        <mesh castShadow>
          <boxGeometry args={[0.55, 0.75, 0.12]} />
          <meshStandardMaterial {...MAT.plasticHousing} />
        </mesh>
        <StatusLight color={plc?.poweredOn ? "good" : "off"} position={[0.2, 0.28, 0.07]} />
        <StatusLight color={plcStatus} position={[0.2, 0.16, 0.07]} />
        <StatusLight color={overloadOk ? "off" : "bad"} position={[0.2, 0.04, 0.07]} />
        <DeviceLabel text="PLC-01" sub={plc?.network.ip} position={[0, 0.48, 0.1]} />
      </group>

      {/* Ethernet Switch — rack unit with a port block */}
      <group
        position={[-0.1, 1.55, 0.5]}
        scale={swHover.scale}
        onPointerOver={swHover.onPointerOver}
        onPointerOut={swHover.onPointerOut}
        onClick={(e) => {
          e.stopPropagation();
          setInspected("switch");
        }}
      >
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.22, 0.1]} />
          <meshStandardMaterial {...MAT.plasticHousingLight} />
        </mesh>
        <mesh position={[0, -0.02, 0.051]}>
          <boxGeometry args={[0.44, 0.09, 0.005]} />
          <meshStandardMaterial {...MAT.darkBezel} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <StatusLight key={i} color="good" position={[-0.16 + i * 0.11, 0.02, 0.06]} />
        ))}
        <DeviceLabel text="Ethernet Switch" position={[0, 0.17, 0.1]} />
      </group>

      {/* 24VDC Power Supply */}
      <group position={[0.65, 1.55, 0.5]}>
        <mesh castShadow>
          <boxGeometry args={[0.4, 0.55, 0.14]} />
          <meshStandardMaterial {...MAT.psuBlue} />
        </mesh>
        {[0.15, 0, -0.15].map((y) => (
          <mesh key={y} position={[0, y, 0.071]}>
            <boxGeometry args={[0.3, 0.015, 0.005]} />
            <meshStandardMaterial {...MAT.darkBezel} />
          </mesh>
        ))}
        <StatusLight color="good" position={[0, 0.24, 0.08]} />
        <DeviceLabel text="24VDC Supply" position={[0, 0.55, 0.08]} />
      </group>

      {/* Motor Starter (contactor) */}
      <group
        position={[-0.8, 0.65, 0.5]}
        scale={starterHover.scale}
        onPointerOver={starterHover.onPointerOver}
        onPointerOut={starterHover.onPointerOut}
        onClick={(e) => {
          e.stopPropagation();
          setInspected("starter");
        }}
      >
        <mesh position={[0, -0.24, -0.02]}>
          <boxGeometry args={[0.42, 0.03, 0.1]} />
          <meshStandardMaterial {...MAT.steelFrame} />
        </mesh>
        <mesh ref={contactorRef} castShadow>
          <boxGeometry args={[0.35, 0.4, 0.16]} />
          <meshStandardMaterial color={motorCommand ? "#2dd47a" : MAT.plasticHousing.color} roughness={0.35} metalness={0.1} />
        </mesh>
        <DeviceLabel text="Motor Starter" sub={motorCommand ? "ENERGIZED" : "DE-ENERGIZED"} position={[0, 0.26, 0.1]} />
      </group>

      {/* Overload relay — with a visible amp-set dial */}
      <group
        position={[-0.3, 0.65, 0.5]}
        scale={overloadHover.scale}
        onPointerOver={overloadHover.onPointerOver}
        onPointerOut={overloadHover.onPointerOut}
        onClick={(e) => {
          e.stopPropagation();
          setInspected("overload");
        }}
      >
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.35, 0.14]} />
          <meshStandardMaterial {...MAT.plasticHousing} />
        </mesh>
        <mesh position={[0, -0.04, 0.075]}>
          <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} />
          <meshStandardMaterial {...MAT.steelDark} />
        </mesh>
        <StatusLight color={overloadOk ? "good" : "bad"} position={[0, 0.22, 0.08]} />
        <DeviceLabel text="Overload Relay" sub={overloadOk ? "OK" : "TRIPPED"} position={[0, -0.3, 0.1]} />
      </group>

      {/* terminal block strip below the cabinet */}
      <mesh position={[0.2, 0.15, 0.5]}>
        <boxGeometry args={[1.6, 0.12, 0.1]} />
        <meshStandardMaterial {...MAT.safetyYellow} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => -0.55 + i * 0.13).map((x) => (
        <mesh key={x} position={[x, 0.21, 0.55]}>
          <cylinderGeometry args={[0.012, 0.012, 0.04, 6]} />
          <meshStandardMaterial {...MAT.steelDark} />
        </mesh>
      ))}
    </group>
  );
}

function PushbuttonStation() {
  const pressStart = useSimStore((s) => s.pressStart);
  const pressStop = useSimStore((s) => s.pressStop);
  const startPB = useSimStore((s) => Boolean(s.tags.Start_PB));
  const stopHealthy = useSimStore((s) => Boolean(s.tags.Stop_PB));

  return (
    <group position={[-2.9, 0, -2.6]}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[0.5, 0.9, 0.12]} />
        <meshStandardMaterial {...MAT.cabinetPaint} />
      </mesh>
      {/* guard ring behind the START pushbutton, centered on it */}
      <mesh position={[0, 1.32, 0.061]}>
        <cylinderGeometry args={[0.13, 0.13, 0.01, 24]} />
        <meshStandardMaterial {...MAT.darkBezel} />
      </mesh>
      {/* START — green, upper half of the enclosure */}
      <mesh
        position={[0, 1.32, 0.09]}
        onClick={(e) => {
          e.stopPropagation();
          pressStart();
        }}
        scale={startPB ? 0.85 : 1}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <cylinderGeometry args={[0.09, 0.09, 0.06, 20]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={startPB ? 0.8 : 0.15} roughness={0.4} />
      </mesh>
      {/* STOP — red mushroom, lower half of the enclosure, symmetric with START about center */}
      <mesh
        position={[0, 0.88, 0.1]}
        onClick={(e) => {
          e.stopPropagation();
          pressStop();
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <cylinderGeometry args={[0.1, 0.1, 0.07, 20]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={stopHealthy ? 0.12 : 0.8} roughness={0.4} />
      </mesh>
      <DeviceLabel text="Start / Stop Station" sub={stopHealthy ? undefined : "STOP CIRCUIT OPEN"} position={[0, 1.62, 0.1]} />
    </group>
  );
}

function VfdStand() {
  const setInspected = useSimStore((s) => s.setInspected);
  const vfd = useDevice("vfd");
  const vfdState = useSimStore((s) => s.vfd);
  const hover = useHoverHighlight();
  const status: StatusColor = !vfd?.poweredOn ? "off" : vfdState.faultCode ? "bad" : vfdState.running ? "good" : "warn";

  return (
    <group
      position={[-1.9, 0, -3.4]}
      scale={hover.scale}
      onPointerOver={hover.onPointerOver}
      onPointerOut={hover.onPointerOut}
      onClick={(e) => {
        e.stopPropagation();
        setInspected("vfd");
      }}
    >
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.55, 1.5, 0.4]} />
        <meshStandardMaterial {...MAT.plasticHousingLight} />
      </mesh>
      {/* heatsink fins along the top-back */}
      {Array.from({ length: 6 }, (_, i) => -0.22 + i * 0.09).map((x) => (
        <mesh key={x} position={[x, 1.42, -0.12]}>
          <boxGeometry args={[0.02, 0.16, 0.28]} />
          <meshStandardMaterial {...MAT.steelDark} />
        </mesh>
      ))}
      {/* display */}
      <mesh position={[0, 1.15, 0.21]}>
        <planeGeometry args={[0.42, 0.28]} />
        <meshStandardMaterial color="#04211d" emissive="#0e7c70" emissiveIntensity={0.35} />
      </mesh>
      <Text position={[0, 1.15, 0.22]} fontSize={0.09} color="#2dd4bf" anchorX="center" anchorY="middle">
        {vfdState.outputFrequency.toFixed(1)} Hz
      </Text>
      {/* keypad */}
      {[-0.12, 0, 0.12].map((x) =>
        [0.75, 0.65].map((y) => (
          <mesh key={`${x}-${y}`} position={[x, y, 0.205]}>
            <cylinderGeometry args={[0.025, 0.025, 0.015, 10]} />
            <meshStandardMaterial {...MAT.darkBezel} />
          </mesh>
        )),
      )}
      <StatusLight color={status} position={[0.2, 1.5, 0.21]} />
      <DeviceLabel text="VFD-01" sub={`${vfd?.network.ip ?? ""} · ${vfdState.faultCode ?? (vfdState.running ? "RUN" : "READY")}`} position={[0, 0.05, 0.22]} />
    </group>
  );
}

const CONVEYOR_X_MIN = -1.6;
const CONVEYOR_X_MAX = 1.6;
const CONVEYOR_Z = -0.6;
const CONVEYOR_TOP_Y = 0.55;

/** Center-of-room conveyor. Purely a visual showcase of Motor_Running — driven by the same VFD/motor as Lab 1. */
function Conveyor() {
  const vfd = useSimStore((s) => s.vfd);
  const leftRollerRef = useRef<THREE.Mesh>(null);
  const rightRollerRef = useRef<THREE.Mesh>(null);
  const boxRefs = useRef<(THREE.Mesh | null)[]>([]);
  const offsets = useMemo(() => [0, 0.9, 1.8], []);

  useFrame((_, delta) => {
    if (!vfd.running) return;
    const speed = 0.15 + (vfd.outputFrequency / 60) * 0.5;
    const spin = delta * (vfd.outputFrequency / 4);
    if (leftRollerRef.current) leftRollerRef.current.rotation.x += spin;
    if (rightRollerRef.current) rightRollerRef.current.rotation.x += spin;
    boxRefs.current.forEach((box, i) => {
      if (!box) return;
      offsets[i] = (offsets[i] + speed * delta) % (CONVEYOR_X_MAX - CONVEYOR_X_MIN);
      box.position.x = CONVEYOR_X_MIN + offsets[i];
    });
  });

  const length = CONVEYOR_X_MAX - CONVEYOR_X_MIN;

  return (
    <group position={[0, 0, CONVEYOR_Z]}>
      {/* legs with diagonal bracing */}
      {[CONVEYOR_X_MIN + 0.3, CONVEYOR_X_MAX - 0.3].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, CONVEYOR_TOP_Y / 2, 0]} castShadow>
            <boxGeometry args={[0.12, CONVEYOR_TOP_Y, 0.5]} />
            <meshStandardMaterial {...MAT.steelDark} />
          </mesh>
          <mesh position={[0, CONVEYOR_TOP_Y / 2, 0]} rotation={[0.7, 0, 0]}>
            <boxGeometry args={[0.05, CONVEYOR_TOP_Y * 1.05, 0.05]} />
            <meshStandardMaterial {...MAT.steelFrame} />
          </mesh>
        </group>
      ))}
      {/* frame rails */}
      {[-0.28, 0.28].map((zOff) => (
        <mesh key={zOff} position={[0, CONVEYOR_TOP_Y, zOff]} castShadow>
          <boxGeometry args={[length + 0.3, 0.1, 0.06]} />
          <meshStandardMaterial {...MAT.steelFrame} />
        </mesh>
      ))}
      {/* side skirting */}
      {[-0.31, 0.31].map((zOff) => (
        <mesh key={zOff} position={[0, CONVEYOR_TOP_Y + 0.09, zOff]}>
          <boxGeometry args={[length + 0.1, 0.1, 0.015]} />
          <meshStandardMaterial {...MAT.steelFrame} />
        </mesh>
      ))}
      {/* belt */}
      <mesh position={[0, CONVEYOR_TOP_Y + 0.03, 0]} receiveShadow>
        <boxGeometry args={[length, 0.04, 0.5]} />
        <meshStandardMaterial {...MAT.rubberBelt} />
      </mesh>
      {/* end rollers with end caps */}
      {[CONVEYOR_X_MIN, CONVEYOR_X_MAX].map((x, i) => (
        <group key={x}>
          <mesh
            ref={i === 0 ? leftRollerRef : rightRollerRef}
            position={[x, CONVEYOR_TOP_Y + 0.03, 0]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.09, 0.09, 0.56, 16]} />
            <meshStandardMaterial {...MAT.steelFrame} />
          </mesh>
          {[-0.28, 0.28].map((zOff) => (
            <mesh key={zOff} position={[x, CONVEYOR_TOP_Y + 0.03, zOff]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
              <meshStandardMaterial {...MAT.steelDark} />
            </mesh>
          ))}
        </group>
      ))}
      {/* drive coupling guard between the discharge roller and Motor 1 */}
      <mesh position={[CONVEYOR_X_MAX + 0.35, CONVEYOR_TOP_Y + 0.03, 0]} castShadow>
        <boxGeometry args={[0.32, 0.22, 0.3]} />
        <meshStandardMaterial {...MAT.steelDark} />
      </mesh>
      {/* product boxes */}
      {offsets.map((_, i) => (
        <mesh key={i} ref={(el) => (boxRefs.current[i] = el)} position={[CONVEYOR_X_MIN + offsets[i], CONVEYOR_TOP_Y + 0.14, 0]} castShadow>
          <boxGeometry args={[0.22, 0.2, 0.3]} />
          <meshStandardMaterial color="#b98a4e" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function MotorUnit() {
  const setInspected = useSimStore((s) => s.setInspected);
  const vfd = useSimStore((s) => s.vfd);
  const shaftRef = useRef<THREE.Mesh>(null);
  const hover = useHoverHighlight();

  useFrame((_, delta) => {
    if (!shaftRef.current) return;
    if (vfd.running) shaftRef.current.rotation.x += delta * (vfd.outputFrequency / 6);
  });

  return (
    <group
      position={[2.4, 0, -0.6]}
      scale={hover.scale}
      onPointerOver={hover.onPointerOver}
      onPointerOut={hover.onPointerOut}
      onClick={(e) => {
        e.stopPropagation();
        setInspected("motor");
      }}
    >
      {/* mounting base / feet */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.05, 0.1, 0.5]} />
        <meshStandardMaterial {...MAT.steelDark} />
      </mesh>
      {/* body */}
      <mesh position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.9, 24]} />
        <meshStandardMaterial {...MAT.motorHousing} />
      </mesh>
      {/* cooling fins */}
      {Array.from({ length: 7 }, (_, i) => -0.34 + i * 0.11).map((x) => (
        <mesh key={x} position={[x, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.47, 0.02, 6, 20]} />
          <meshStandardMaterial {...MAT.steelDark} />
        </mesh>
      ))}
      {/* terminal box on top */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[0.24, 0.18, 0.26]} />
        <meshStandardMaterial {...MAT.plasticHousing} />
      </mesh>
      {/* fan cover at the back end */}
      <mesh position={[-0.52, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.33, 0.33, 0.08, 20]} />
        <meshStandardMaterial {...MAT.steelDark} />
      </mesh>
      {/* shaft coupling at the drive end */}
      <mesh ref={shaftRef} position={[0.5, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 0.16, 12]} />
        <meshStandardMaterial color={vfd.running ? "#2dd4bf" : MAT.steelDark.color} metalness={0.5} roughness={0.4} />
      </mesh>
      <StatusLight color={vfd.running ? "good" : "off"} position={[0, 1.05, 0.3]} />
      <DeviceLabel text="Motor 1" sub={vfd.running ? "RUNNING" : "STOPPED"} position={[0, 1.2, 0]} />
    </group>
  );
}

function ProxSensor() {
  const setInspected = useSimStore((s) => s.setInspected);
  const running = useSimStore((s) => s.vfd.running);
  const hover = useHoverHighlight();
  return (
    <group
      position={[1.6, 0, -0.9]}
      scale={hover.scale}
      onPointerOver={hover.onPointerOver}
      onPointerOut={hover.onPointerOut}
      onClick={(e) => {
        e.stopPropagation();
        setInspected("sensor");
      }}
    >
      {/* mounting bracket */}
      <mesh position={[0, 0.5, -0.05]}>
        <boxGeometry args={[0.05, 0.05, 0.14]} />
        <meshStandardMaterial {...MAT.steelDark} />
      </mesh>
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.25, 12]} />
        <meshStandardMaterial {...MAT.plasticHousing} />
      </mesh>
      {/* cable stub down to a small junction box */}
      <mesh position={[0, 0.25, -0.05]}>
        <cylinderGeometry args={[0.008, 0.008, 0.5, 6]} />
        <meshStandardMaterial color="#111418" />
      </mesh>
      <StatusLight color={running ? "good" : "off"} position={[0, 0.5, 0.14]} />
      <DeviceLabel text="Sensor 1" position={[0, 0.65, 0]} />
    </group>
  );
}

function EngineeringDesk({ onOpenWorkstation }: { onOpenWorkstation: () => void }) {
  const pc = useDevice("pc");
  const hover = useHoverHighlight();
  return (
    <group position={[4.6, 0, 1.8]}>
      {/* desk */}
      <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.05, 0.8]} />
        <meshStandardMaterial {...MAT.deskLaminate} />
      </mesh>
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x, 0.19, 0.3]}>
          <boxGeometry args={[0.06, 0.38, 0.06]} />
          <meshStandardMaterial {...MAT.steelDark} />
        </mesh>
      ))}
      {/* chair */}
      <mesh position={[0, 0.35, 0.7]}>
        <boxGeometry args={[0.4, 0.05, 0.4]} />
        <meshStandardMaterial {...MAT.chairFabric} />
      </mesh>
      <mesh position={[0, 0.6, 0.88]}>
        <boxGeometry args={[0.4, 0.5, 0.05]} />
        <meshStandardMaterial {...MAT.chairFabric} />
      </mesh>
      <mesh position={[0, 0.12, 0.7]}>
        <cylinderGeometry args={[0.03, 0.03, 0.24, 8]} />
        <meshStandardMaterial {...MAT.steelDark} />
      </mesh>

      {/* external monitor on the desk, ahead of the laptop, for the "workstation" look */}
      <group position={[0, 0.4, -0.32]}>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.14, 0.03, 0.1]} />
          <meshStandardMaterial {...MAT.steelDark} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.02, 0.3, 0.02]} />
          <meshStandardMaterial {...MAT.steelDark} />
        </mesh>
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.55, 0.34, 0.02]} />
          <meshStandardMaterial color="#0b1015" emissive="#123244" emissiveIntensity={0.5} />
        </mesh>
      </group>
      {/* keyboard */}
      <mesh position={[0, 0.41, 0.08]}>
        <boxGeometry args={[0.36, 0.015, 0.12]} />
        <meshStandardMaterial {...MAT.plasticHousingLight} />
      </mesh>

      {/* Engineering PC / laptop — the actual click target */}
      <group
        position={[0, 0.4, -0.15]}
        scale={hover.scale}
        onPointerOver={hover.onPointerOver}
        onPointerOut={hover.onPointerOut}
        onClick={(e) => {
          e.stopPropagation();
          onOpenWorkstation();
        }}
      >
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.5, 0.02, 0.35]} />
          <meshStandardMaterial {...MAT.plasticHousingLight} />
        </mesh>
        <mesh position={[0, 0.16, -0.16]} rotation={[-0.25, 0, 0]}>
          <boxGeometry args={[0.5, 0.32, 0.02]} />
          <meshStandardMaterial color="#0b1015" emissive="#123" emissiveIntensity={0.6} />
        </mesh>
        <StatusLight color={pc?.poweredOn ? "good" : "off"} position={[0.24, 0.02, 0.15]} />
        <DeviceLabel text="Engineering PC" sub={pc?.network.ip} position={[0, 0.5, -0.16]} />
      </group>
    </group>
  );
}

function AutomationServer() {
  const setInspected = useSimStore((s) => s.setInspected);
  const server = useDevice("server");
  const hover = useHoverHighlight();
  return (
    <group
      position={[6.2, 0, 0]}
      scale={hover.scale}
      onPointerOver={hover.onPointerOver}
      onPointerOut={hover.onPointerOut}
      onClick={(e) => {
        e.stopPropagation();
        setInspected("server");
      }}
    >
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 1.8, 0.7]} />
        <meshStandardMaterial {...MAT.rackHousing} />
      </mesh>
      {/* rack unit seams */}
      {[0.5, 0.9, 1.3, 1.7].map((y) => (
        <mesh key={y} position={[0, y, 0.351]}>
          <boxGeometry args={[0.56, 0.01, 0.005]} />
          <meshStandardMaterial {...MAT.darkBezel} />
        </mesh>
      ))}
      {/* handle */}
      <mesh position={[0.26, 0.3, 0.36]}>
        <boxGeometry args={[0.03, 0.4, 0.03]} />
        <meshStandardMaterial {...MAT.steelDark} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <StatusLight key={i} color={server?.poweredOn ? "good" : "off"} position={[-0.15 + (i % 2) * 0.3, 1.5 - Math.floor(i / 2) * 0.15, 0.36]} />
      ))}
      <DeviceLabel text="Automation Server" sub={server?.network.ip} position={[0, 1.9, 0]} />
    </group>
  );
}

function EthernetTopology() {
  const plc = useDevice("plc");
  const vfd = useDevice("vfd");
  const pc = useDevice("pc");
  const server = useDevice("server");
  const sw = useDevice("switch");
  if (!plc || !vfd || !pc || !server || !sw) return null;

  const swPos: [number, number, number] = [-4.7, 1.65, -3.5];
  return (
    <>
      <EthernetLink from={swPos} to={[-5.4, 1.65, -3.5]} status={linkStatus(sw.poweredOn, sw.cableConnected, plc.poweredOn, plc.cableConnected)} />
      <EthernetLink from={swPos} to={[-1.9, 1.7, -3.4]} status={linkStatus(sw.poweredOn, sw.cableConnected, vfd.poweredOn, vfd.cableConnected)} />
      <EthernetLink from={swPos} to={[4.6, 1.1, 1.8]} status={linkStatus(sw.poweredOn, sw.cableConnected, pc.poweredOn, pc.cableConnected)} />
      <EthernetLink from={swPos} to={[6.2, 1.8, 0]} status={linkStatus(sw.poweredOn, sw.cableConnected, server.poweredOn, server.cableConnected)} />
    </>
  );
}

export function Lab1Scene({ onOpenWorkstation }: { onOpenWorkstation: () => void }) {
  return (
    <group>
      <ambientLight intensity={0.75} />
      <hemisphereLight args={["#eef3ff", "#3a3f45", 0.7]} />
      <directionalLight
        position={[3, 8, 5]}
        intensity={1.15}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0006}
      />
      <pointLight position={[-4.6, 3.6, -2]} intensity={0.9} distance={9} decay={2} />
      <pointLight position={[0, 3.6, -0.5]} intensity={0.9} distance={9} decay={2} />
      <pointLight position={[5, 3.6, 1]} intensity={0.9} distance={9} decay={2} />

      <Room />
      <CableTray />
      <ZoneCaption position={[-4.6, 0, -0.3]} label="CONTROL PANEL AREA" />
      <ZoneCaption position={[0.1, 0, -0.3]} label="CONVEYOR / FIELD AREA" />
      <ZoneCaption position={[5.3, 0, -0.3]} label="ENGINEERING AREA" />

      <ControlCabinet />
      <PushbuttonStation />
      <VfdStand />
      <Conveyor />
      <MotorUnit />
      <ProxSensor />
      <EngineeringDesk onOpenWorkstation={onOpenWorkstation} />
      <AutomationServer />
      <EthernetTopology />
    </group>
  );
}
