import { useFrame } from "@react-three/fiber";
import { useSimStore } from "../../state/simStore";

/** Drives the PLC/VFD simulation tick from the R3F render loop. Must be rendered inside <Canvas>. */
export function SimulationClock() {
  const tick = useSimStore((s) => s.tick);
  useFrame((_, delta) => {
    tick(Math.min(delta, 0.1) * 1000);
  });
  return null;
}
