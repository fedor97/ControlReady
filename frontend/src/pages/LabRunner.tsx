import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useLocation } from "react-router-dom";
import { initLab, useSimStore } from "../state/simStore";
import { lab1Definition } from "../labs/lab1-motor-control/definition";
import { Lab1Scene } from "../labs/lab1-motor-control/Scene";
import { CAMERA_PRESETS } from "../labs/lab1-motor-control/cameraPresets";
import { SimulationClock } from "../components/lab3d/SimulationClock";
import { CameraRig } from "../components/lab3d/CameraRig";
import { TopBar } from "../components/hud/TopBar";
import { WorkOrderModal } from "../components/hud/WorkOrderModal";
import { WorkOrderCard } from "../components/hud/WorkOrderCard";
import { CameraPresetButtons } from "../components/hud/CameraPresetButtons";
import { EngineeringWorkstationModal } from "../components/hud/EngineeringWorkstationModal";
import { ScoreModal } from "../components/hud/ScoreModal";
import { BottomToolbar } from "../components/hud/BottomToolbar";
import { ToolWindow } from "../components/hud/ToolWindow";
import { DeviceInspector } from "../components/panels/DeviceInspector";
import { HintPanel } from "../components/panels/HintPanel";
import type { FaultScenarioId } from "../types";

export function LabRunner() {
  const location = useLocation();
  const lab = useSimStore((s) => s.lab);
  const workOrderOpen = useSimStore((s) => s.workOrderOpen);
  const setWorkOrderOpen = useSimStore((s) => s.setWorkOrderOpen);
  const workstationOpen = useSimStore((s) => s.workstationOpen);
  const setWorkstationOpen = useSimStore((s) => s.setWorkstationOpen);
  const inspected = useSimStore((s) => s.inspected);
  const activeTool = useSimStore((s) => s.activeTool);
  const completedAt = useSimStore((s) => s.completedAt);
  const [hintOpen, setHintOpen] = useState(false);
  const controlsRef = useRef(null);

  useEffect(() => {
    const faultId = (location.state as { faultId?: FaultScenarioId } | null)?.faultId;
    initLab(lab1Definition, faultId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!lab) {
    return <div className="flex h-screen items-center justify-center bg-cr-bg text-cr-text-dim">Loading lab environment…</div>;
  }

  return (
    <div className="flex h-screen flex-col bg-cr-bg">
      <TopBar hintOpen={hintOpen} onToggleHint={() => setHintOpen((v) => !v)} />

      {/* 3D lab — the dominant surface. Everything below is absolutely positioned over it. */}
      <div className="relative min-h-0 flex-1">
        <Canvas
          className="absolute inset-0"
          dpr={1}
          shadows="soft"
          gl={{ antialias: true, powerPreference: "default", failIfMajorPerformanceCaveat: false }}
          camera={{ position: CAMERA_PRESETS.overview.position, fov: 45 }}
        >
          <SimulationClock />
          <CameraRig controlsRef={controlsRef} />
          <Lab1Scene onOpenWorkstation={() => setWorkstationOpen(true)} />
          <OrbitControls ref={controlsRef} makeDefault minDistance={2} maxDistance={22} maxPolarAngle={Math.PI / 2.05} target={CAMERA_PRESETS.overview.target} />
        </Canvas>

        {!workOrderOpen && activeTool === "none" && (
          <div className="absolute left-4 top-4">
            <WorkOrderCard onExpand={() => setWorkOrderOpen(true)} />
          </div>
        )}

        {inspected && activeTool === "none" && (
          <div className="absolute right-4 top-4 h-[min(560px,calc(100%-2rem))] w-[360px]">
            <DeviceInspector />
          </div>
        )}

        {activeTool === "none" && (
          <div className="absolute bottom-4 left-4">
            <CameraPresetButtons />
          </div>
        )}

        {hintOpen && activeTool === "none" && (
          <div className="absolute bottom-4 right-4">
            <HintPanel onClose={() => setHintOpen(false)} />
          </div>
        )}

        <ToolWindow />
      </div>

      {/* Slim quick-launch toolbar — 3D stays dominant; tools open on demand as windows above. */}
      <div className="h-12 shrink-0">
        <BottomToolbar />
      </div>

      {workOrderOpen && <WorkOrderModal onClose={() => setWorkOrderOpen(false)} />}
      {workstationOpen && <EngineeringWorkstationModal onClose={() => setWorkstationOpen(false)} />}
      {completedAt !== null && <ScoreModal />}
    </div>
  );
}
