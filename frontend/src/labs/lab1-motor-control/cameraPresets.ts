import type { CameraPreset } from "../../state/simStore";

export interface CameraPresetTarget {
  position: [number, number, number];
  target: [number, number, number];
}

/** Matches the physical layout of devices in Scene.tsx — keep these in sync if you move equipment. */
export const CAMERA_PRESETS: Record<CameraPreset, CameraPresetTarget> = {
  overview: { position: [7.5, 6.5, 10], target: [0.5, 1, -0.5] },
  controlPanel: { position: [-4.6, 2.3, 1.3], target: [-4.6, 1.3, -2.3] },
  conveyor: { position: [0.5, 2.6, 3.6], target: [0.5, 0.8, -0.2] },
  motor: { position: [2.6, 1.8, 1.6], target: [2.2, 0.6, -0.6] },
  engineering: { position: [5.2, 2.6, 5.2], target: [4.2, 0.9, 1.8] },
};
