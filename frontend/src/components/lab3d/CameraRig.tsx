import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSimStore } from "../../state/simStore";
import { CAMERA_PRESETS } from "../../labs/lab1-motor-control/cameraPresets";

interface OrbitControlsLike {
  target: THREE.Vector3;
  update: () => void;
}

/** Smoothly flies the camera to a preset when simStore.cameraRequestId changes. Lives inside <Canvas>. */
export function CameraRig({ controlsRef }: { controlsRef: React.RefObject<OrbitControlsLike | null> }) {
  const { camera } = useThree();
  const preset = useSimStore((s) => s.cameraPreset);
  const requestId = useSimStore((s) => s.cameraRequestId);
  const lastHandledId = useRef(-1);
  const animating = useRef(false);
  const targetPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());

  if (lastHandledId.current !== requestId) {
    lastHandledId.current = requestId;
    const { position, target } = CAMERA_PRESETS[preset];
    targetPos.current.set(...position);
    targetLookAt.current.set(...target);
    animating.current = true;
  }

  useFrame(() => {
    if (!animating.current) return;
    camera.position.lerp(targetPos.current, 0.08);
    const controls = controlsRef.current;
    if (controls) {
      controls.target.lerp(targetLookAt.current, 0.08);
      controls.update();
    }
    if (camera.position.distanceTo(targetPos.current) < 0.02) {
      animating.current = false;
    }
  });

  return null;
}
