import { create } from "zustand";
import type {
  DeviceId,
  DeviceState,
  FaultScenario,
  FaultScenarioId,
  Hint,
  LabDefinition,
  LabFaultPatch,
  LoggedAction,
  NetworkConfig,
  PingResult,
  ReportValidation,
  ScoreResult,
  ServiceReport,
  TagTable,
  VfdState,
} from "../types";
import { discover, isValidIpv4, ping } from "../engine/networkEngine";
import { scanProgram, type TimerState } from "../engine/plcEngine";
import { stepVfd } from "../engine/vfdEngine";
import { ruleBasedHintProvider } from "../engine/hintEngine";
import { computeScore } from "../engine/scoringEngine";
import { validateServiceReport } from "../engine/reportRubric";

function applyFaultPatch(lab: LabDefinition, patch: LabFaultPatch): { devices: DeviceState[]; tags: TagTable } {
  const devices = lab.devices.map((d) => ({
    ...d,
    network: { ...d.network, ...(patch.deviceNetworkOverrides?.[d.id] ?? {}) },
    cableConnected: patch.deviceCableOverrides?.[d.id] ?? d.cableConnected,
    poweredOn: patch.devicePowerOverrides?.[d.id] ?? d.poweredOn,
  }));
  const tags = { ...lab.initialTags, ...(patch.tagOverrides ?? {}) } as TagTable;
  return { devices, tags };
}

function getFault(lab: LabDefinition, faultId: FaultScenarioId): FaultScenario {
  return lab.faultCatalog.find((f) => f.id === faultId) ?? lab.faultCatalog[0];
}

/** Every clickable thing in the 3D lab. Only some (DeviceId) carry a real network identity. */
export type InspectableId = DeviceId | "motor" | "sensor" | "overload" | "starter";
export type CameraPreset = "overview" | "controlPanel" | "conveyor" | "motor" | "engineering";
export type MissionPhase = "inspect" | "diagnose" | "repair" | "test" | "report" | "complete";
/** The full-size "app window" launched from the Engineering PC workstation or the bottom toolbar. */
export type ToolId = "none" | "network" | "plc" | "vfd" | "scada" | "report";

interface ConsoleEntry {
  command: string;
  output: string;
  ok: boolean;
}

interface SimStoreState {
  lab: LabDefinition;
  fault: FaultScenario;
  devices: DeviceState[];
  tags: TagTable;
  timerStates: Record<string, TimerState>;
  rungActive: Record<string, boolean>;
  vfd: VfdState;
  actionLog: LoggedAction[];
  hintsUsed: number;
  lastHint: Hint | null;
  startedAt: number;
  completedAt: number | null;
  motorVerifiedRunning: boolean;
  serviceReport: ServiceReport | null;
  reportValidation: ReportValidation | null;
  consoleHistory: ConsoleEntry[];

  /** Whichever piece of equipment the student last clicked — drives the right-side inspector panel. */
  inspected: InspectableId | null;
  /** Full Work Order modal (collapses to a small card after the student dismisses it). */
  workOrderOpen: boolean;
  /** Engineering PC "workstation" launcher modal. */
  workstationOpen: boolean;
  /** The one big tool window currently open (Network Tools / PLC Software / VFD / SCADA / Report), or none. */
  activeTool: ToolId;
  cameraPreset: CameraPreset;
  cameraRequestId: number;
  alarmAcknowledged: boolean;

  log: (action: Omit<LoggedAction, "timestamp">) => void;
  tick: (dtMs: number) => void;
  startLab: (faultId?: FaultScenarioId) => void;
  setInspected: (id: InspectableId | null) => void;
  setWorkOrderOpen: (open: boolean) => void;
  setWorkstationOpen: (open: boolean) => void;
  setActiveTool: (tool: ToolId) => void;
  flyTo: (preset: CameraPreset) => void;
  acknowledgeAlarm: () => void;
  getMissionPhase: () => MissionPhase;
  updateDeviceNetwork: (id: DeviceId, patch: Partial<NetworkConfig>) => void;
  updateDevicePower: (id: DeviceId, poweredOn: boolean) => void;
  updateDeviceCable: (id: DeviceId, connected: boolean) => void;
  runPing: (fromId: DeviceId, targetIp: string) => PingResult;
  runDiscover: (fromId: DeviceId) => void;
  runConsoleCommand: (fromId: DeviceId, raw: string) => void;
  updateVfdParams: (patch: Partial<VfdState["params"]>) => void;
  pressStart: () => void;
  pressStop: () => void;
  resetOverload: () => void;
  clearStopCircuit: () => void;
  requestHint: () => Hint;
  verifyRunning: () => void;
  submitServiceReport: (report: ServiceReport) => ReportValidation;
  getScore: () => ScoreResult;
  isFaultResolved: () => boolean;
}

function computePlcVfdCommOk(devices: DeviceState[]): boolean {
  const plc = devices.find((d) => d.id === "plc");
  const vfd = devices.find((d) => d.id === "vfd");
  if (!plc || !vfd) return false;
  const result = ping("plc", vfd.network.ip, devices);
  return result.ok && result.resolvedDeviceId === "vfd";
}

function buildInitial(lab: LabDefinition, faultId: FaultScenarioId) {
  const fault = getFault(lab, faultId);
  const patch = fault.apply();
  const { devices, tags } = applyFaultPatch(lab, patch);
  return { fault, devices, tags };
}

export function isFaultResolvedFor(_lab: LabDefinition, _fault: FaultScenario, devices: DeviceState[], tags: TagTable): boolean {
  const commOk = computePlcVfdCommOk(devices);
  const noDuplicates = new Set(devices.map((d) => d.network.ip)).size === devices.length;
  const stopHealthy = Boolean(tags.Stop_PB);
  const overloadHealthy = Boolean(tags.Overload_OK);
  return commOk && noDuplicates && stopHealthy && overloadHealthy;
}

const UNINITIALIZED_LAB = null as unknown as LabDefinition;
const UNINITIALIZED_FAULT = null as unknown as FaultScenario;

export const useSimStore = create<SimStoreState>((set, get) => ({
  lab: UNINITIALIZED_LAB,
  fault: UNINITIALIZED_FAULT,
  devices: [],
  tags: {},
  timerStates: {},
  rungActive: {},
  vfd: {
    params: { frequencyReference: 60, acceleration: 5, deceleration: 5, networkControlEnabled: true },
    runCommand: false,
    outputFrequency: 0,
    motorCurrent: 0,
    faultCode: null,
    commOk: false,
    ready: false,
    running: false,
  },
  actionLog: [],
  hintsUsed: 0,
  lastHint: null,
  startedAt: 0,
  completedAt: null,
  motorVerifiedRunning: false,
  serviceReport: null,
  reportValidation: null,
  consoleHistory: [],
  inspected: null,
  workOrderOpen: true,
  workstationOpen: false,
  activeTool: "none",
  cameraPreset: "overview",
  cameraRequestId: 0,
  alarmAcknowledged: false,

  log: (action) => set((s) => ({ actionLog: [...s.actionLog, { ...action, timestamp: Date.now() }] })),

  startLab: (faultId) => {
    const lab = get().lab;
    if (!lab) return;
    const id = faultId ?? lab.defaultFaultId;
    const { fault, devices, tags } = buildInitial(lab, id);
    set({
      fault,
      devices,
      tags,
      timerStates: {},
      rungActive: {},
      vfd: { ...lab.initialVfd },
      actionLog: [],
      hintsUsed: 0,
      lastHint: null,
      startedAt: Date.now(),
      completedAt: null,
      motorVerifiedRunning: false,
      serviceReport: null,
      reportValidation: null,
      consoleHistory: [],
      inspected: null,
      workOrderOpen: true,
      workstationOpen: false,
      activeTool: "none",
      cameraPreset: "overview",
      alarmAcknowledged: false,
    });
  },

  setInspected: (id) => {
    if (id) get().log({ type: "device_inspected", label: `Inspected ${id.toUpperCase()}` });
    set({ inspected: id });
  },

  setWorkOrderOpen: (open) => set({ workOrderOpen: open }),
  setWorkstationOpen: (open) => set({ workstationOpen: open }),
  setActiveTool: (tool) => set({ activeTool: tool }),

  flyTo: (preset) => set((s) => ({ cameraPreset: preset, cameraRequestId: s.cameraRequestId + 1 })),

  acknowledgeAlarm: () => set({ alarmAcknowledged: true }),

  updateDeviceNetwork: (id, patch) => {
    const { devices, fault, lab } = get();
    const wasResolvedBefore = get().isFaultResolved();
    const nextDevices = devices.map((d) => (d.id === id ? { ...d, network: { ...d.network, ...patch } } : d));
    set({ devices: nextDevices });

    const nowResolved = isFaultResolvedFor(lab, fault, nextDevices, get().tags);
    const label = `Changed ${id.toUpperCase()} network config: ${Object.entries(patch)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ")}`;

    // A change is judged "wrong" only if it moves a field away from the lab's known-good baseline
    // without also happening to resolve the fault right now (matches an alternate valid fix).
    const baselineDevice = lab.devices.find((d) => d.id === id);
    const matchesBaseline =
      !baselineDevice ||
      Object.entries(patch).every(([k, v]) => (baselineDevice.network as unknown as Record<string, string>)[k] === v);

    get().log({ type: matchesBaseline || nowResolved ? "config_change" : "wrong_config_change", label });

    if (!wasResolvedBefore && nowResolved) {
      get().log({ type: "fault_identified", label: `Root cause corrected: ${fault.title}` });
      set({ alarmAcknowledged: false });
    }
  },

  updateDevicePower: (id, poweredOn) => {
    set((s) => ({ devices: s.devices.map((d) => (d.id === id ? { ...d, poweredOn } : d)) }));
    get().log({ type: "config_change", label: `${id.toUpperCase()} power ${poweredOn ? "ON" : "OFF"}` });
  },

  updateDeviceCable: (id, connected) => {
    set((s) => ({ devices: s.devices.map((d) => (d.id === id ? { ...d, cableConnected: connected } : d)) }));
    get().log({ type: "config_change", label: `${id.toUpperCase()} Ethernet cable ${connected ? "connected" : "disconnected"}` });
    if (connected) set({ alarmAcknowledged: false });
  },

  runPing: (fromId, targetIp) => {
    const result = ping(fromId, targetIp, get().devices);
    get().log({ type: "ping", label: `ping ${targetIp} from ${fromId.toUpperCase()} → ${result.kind}`, meta: { ...result } });
    set((s) => ({
      consoleHistory: [...s.consoleHistory, { command: `ping ${targetIp}`, output: result.message, ok: result.ok }],
    }));
    return result;
  },

  runDiscover: (fromId) => {
    const results = discover(fromId, get().devices);
    get().log({ type: "ping", label: `discover from ${fromId.toUpperCase()}` });
    const output = results.map((r) => `${r.reachable ? "[UP]  " : "[DOWN]"} ${r.name.padEnd(20)} ${r.ip}`).join("\n");
    set((s) => ({ consoleHistory: [...s.consoleHistory, { command: "discover", output, ok: true }] }));
  },

  runConsoleCommand: (fromId, raw) => {
    const trimmed = raw.trim();
    const [cmd, ...rest] = trimmed.split(/\s+/);

    if (cmd === "ping" && rest[0]) {
      get().runPing(fromId, rest[0]);
      return;
    }
    if (cmd === "discover") {
      get().runDiscover(fromId);
      return;
    }
    if (cmd === "ipconfig") {
      const d = get().devices.find((x) => x.id === fromId);
      const output = d
        ? `IP Address: ${d.network.ip}\nSubnet Mask: ${d.network.subnet}\nGateway: ${d.network.gateway}`
        : "Unknown device.";
      set((s) => ({ consoleHistory: [...s.consoleHistory, { command: trimmed, output, ok: true }] }));
      return;
    }
    if (cmd === "help" || trimmed === "") {
      set((s) => ({
        consoleHistory: [
          ...s.consoleHistory,
          { command: trimmed || "help", output: "Commands: ping <ip>, discover, ipconfig, help", ok: true },
        ],
      }));
      return;
    }
    if (!isValidIpv4(rest[0] ?? "") && cmd === "ping") {
      set((s) => ({ consoleHistory: [...s.consoleHistory, { command: trimmed, output: `Invalid IP address.`, ok: false }] }));
      return;
    }
    set((s) => ({ consoleHistory: [...s.consoleHistory, { command: trimmed, output: `'${cmd}' is not a recognized command.`, ok: false }] }));
  },

  updateVfdParams: (patch) => {
    set((s) => ({ vfd: { ...s.vfd, params: { ...s.vfd.params, ...patch } } }));
    get().log({ type: "config_change", label: `VFD parameters updated: ${Object.entries(patch).map(([k, v]) => `${k}=${v}`).join(", ")}` });
  },

  pressStart: () => {
    get().log({ type: "start_attempt", label: "Pressed Start pushbutton" });
    set((s) => ({ tags: { ...s.tags, Start_PB: true } }));
    setTimeout(() => {
      set((s) => ({ tags: { ...s.tags, Start_PB: false } }));
    }, 300);
  },

  pressStop: () => {
    get().log({ type: "stop", label: "Pressed Stop pushbutton" });
    set((s) => ({ tags: { ...s.tags, Stop_PB: false } }));
    setTimeout(() => {
      set((s) => ({ tags: { ...s.tags, Stop_PB: true } }));
    }, 300);
  },

  resetOverload: () => {
    const wasResolvedBefore = get().isFaultResolved();
    set((s) => ({ tags: { ...s.tags, Overload_OK: true } }));
    const nowResolved = isFaultResolvedFor(get().lab, get().fault, get().devices, get().tags);
    get().log({ type: "config_change", label: "Reset overload relay (Overload_OK → TRUE)" });
    if (!wasResolvedBefore && nowResolved) {
      get().log({ type: "fault_identified", label: `Root cause corrected: ${get().fault.title}` });
      set({ alarmAcknowledged: false });
    }
  },

  clearStopCircuit: () => {
    const wasResolvedBefore = get().isFaultResolved();
    set((s) => ({ tags: { ...s.tags, Stop_PB: true } }));
    const nowResolved = isFaultResolvedFor(get().lab, get().fault, get().devices, get().tags);
    get().log({ type: "config_change", label: "Cleared Stop circuit / reset E-Stop (Stop_PB → TRUE)" });
    if (!wasResolvedBefore && nowResolved) {
      get().log({ type: "fault_identified", label: `Root cause corrected: ${get().fault.title}` });
      set({ alarmAcknowledged: false });
    }
  },

  tick: (dtMs) => {
    const s = get();
    if (!s.lab) return;

    const plcVfdCommOk = computePlcVfdCommOk(s.devices);
    const tagsWithComm: TagTable = { ...s.tags, VFD_Communication_OK: plcVfdCommOk };

    const scan = scanProgram(s.lab.ladder, tagsWithComm, s.timerStates, dtMs);

    const nextVfd = stepVfd(s.vfd, {
      plcCommOk: plcVfdCommOk,
      runCommandFromPlc: Boolean(scan.tags.Run_Command_To_VFD),
      dtMs,
    });

    const finalTags: TagTable = {
      ...scan.tags,
      VFD_Fault: nextVfd.faultCode !== null,
      Motor_Running: nextVfd.running,
      Sensor_1: nextVfd.running,
    };

    const wasRunning = Boolean(s.tags.Motor_Running);
    if (!wasRunning && nextVfd.running) {
      get().log({ type: "start_success", label: "Motor 1 started successfully" });
    }

    set({ tags: finalTags, timerStates: scan.timerStates, rungActive: scan.rungActive, vfd: nextVfd });
  },

  requestHint: () => {
    const s = get();
    const hint = ruleBasedHintProvider.getHint(s.hintsUsed, s.fault);
    set({ hintsUsed: s.hintsUsed + 1, lastHint: hint });
    get().log({ type: "hint_used", label: `Hint ${hint.level}: ${hint.text}` });
    return hint;
  },

  verifyRunning: () => {
    if (get().tags.Motor_Running) {
      set({ motorVerifiedRunning: true });
      get().log({ type: "verified_running", label: "Verified Motor_Running = TRUE" });
    }
  },

  submitServiceReport: (report) => {
    const validation = validateServiceReport(report);
    set({ serviceReport: report, reportValidation: validation, completedAt: Date.now() });
    get().log({ type: "report_submitted", label: `Service report submitted (${validation.complete ? "complete" : "incomplete"})` });
    return validation;
  },

  isFaultResolved: () => {
    const s = get();
    if (!s.lab) return false;
    return isFaultResolvedFor(s.lab, s.fault, s.devices, s.tags);
  },

  getScore: () => {
    const s = get();
    return computeScore({
      actions: s.actionLog,
      hintsUsed: s.hintsUsed,
      weights: s.lab.gradingWeights,
      reportScore: s.reportValidation?.score ?? 0,
      motorVerifiedRunning: s.motorVerifiedRunning,
      faultResolved: get().isFaultResolved(),
    });
  },

  getMissionPhase: () => {
    const s = get();
    if (s.completedAt !== null) return "complete";
    if (s.reportValidation !== null || s.tags.Motor_Running) {
      // once the student has a running motor (or already tried the report), they're in the reporting stage
      if (s.motorVerifiedRunning || s.reportValidation !== null) return "report";
      return "test";
    }
    if (get().isFaultResolved()) {
      return s.actionLog.some((a) => a.type === "start_attempt") ? "test" : "repair";
    }
    const hasInspected = s.actionLog.some((a) => a.type === "device_inspected" || a.type === "ping" || a.type === "plc_viewed");
    return hasInspected ? "diagnose" : "inspect";
  },
}));

export function initLab(lab: LabDefinition, faultId?: FaultScenarioId) {
  useSimStore.setState({ lab });
  useSimStore.getState().startLab(faultId);
}
