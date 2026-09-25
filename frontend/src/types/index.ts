// Shared types for the CONTROLREADY simulator core.
// Kept framework-agnostic (no React imports) so engine/ code stays pure and testable.

export type DeviceId = "plc" | "vfd" | "pc" | "server" | "switch";

export interface NetworkConfig {
  ip: string;
  subnet: string;
  gateway: string;
}

export interface DeviceState {
  id: DeviceId;
  name: string;
  kind: "plc" | "vfd" | "pc" | "server" | "switch";
  network: NetworkConfig;
  /** physically powered on */
  poweredOn: boolean;
  /** ethernet cable seated in the switch */
  cableConnected: boolean;
}

export type PingResultKind =
  | "success"
  | "timeout"
  | "unreachable_subnet"
  | "cable_disconnected"
  | "powered_off"
  | "duplicate_ip"
  | "invalid_target";

export interface PingResult {
  kind: PingResultKind;
  fromId: DeviceId;
  targetIp: string;
  resolvedDeviceId: DeviceId | null;
  message: string;
  ok: boolean;
}

export interface DiscoveredDevice {
  id: DeviceId;
  name: string;
  ip: string;
  reachable: boolean;
}

// ---------- PLC ----------

export type TagValue = boolean | number;

export interface TagTable {
  [tag: string]: TagValue;
}

export type ContactType = "NO" | "NC";

export interface RungElement {
  kind: "contact" | "coil" | "timer_ton";
  tag: string;
  contactType?: ContactType;
  /** for timer_ton: preset in ms */
  presetMs?: number;
  label?: string;
}

export interface Rung {
  id: string;
  label: string;
  comment: string;
  /** elements in series form one branch; branches are OR'd (parallel = seal-in) */
  branches: RungElement[][];
  coil: RungElement;
}

export interface LadderProgram {
  rungs: Rung[];
}

// ---------- VFD ----------

export type VfdFaultCode = null | "COMM_FAULT" | "OVERCURRENT" | "OVERLOAD" | "UNDERVOLTAGE" | "NETWORK_TIMEOUT";

export interface VfdParams {
  frequencyReference: number; // Hz
  acceleration: number; // seconds
  deceleration: number; // seconds
  networkControlEnabled: boolean;
}

export interface VfdState {
  params: VfdParams;
  runCommand: boolean;
  outputFrequency: number;
  motorCurrent: number;
  faultCode: VfdFaultCode;
  commOk: boolean;
  ready: boolean;
  running: boolean;
}

// ---------- Faults ----------

export type FaultScenarioId =
  | "wrong_vfd_ip"
  | "duplicate_ip"
  | "wrong_plc_ip"
  | "disconnected_cable"
  | "vfd_comm_fault"
  | "overload_tripped"
  | "stop_circuit_open"
  | "sensor_failure";

export interface FaultScenario {
  id: FaultScenarioId;
  title: string;
  summary: string;
  implemented: boolean;
  /** returns a patch describing what to change relative to the healthy baseline */
  apply: () => LabFaultPatch;
  rootCause: string;
  correctiveAction: string;
  hintLadder: string[];
}

export interface LabFaultPatch {
  deviceNetworkOverrides?: Partial<Record<DeviceId, Partial<NetworkConfig>>>;
  deviceCableOverrides?: Partial<Record<DeviceId, boolean>>;
  devicePowerOverrides?: Partial<Record<DeviceId, boolean>>;
  tagOverrides?: Partial<TagTable>;
}

// ---------- Work order / lab ----------

export interface WorkOrder {
  id: string;
  equipment: string;
  problem: string;
  description: string;
  task: string;
}

export interface GradingWeights {
  networking: number;
  plc: number;
  faultDiagnosis: number;
  verification: number;
  documentation: number;
}

export interface LabDefinition {
  id: string;
  name: string;
  summary: string;
  workOrder: WorkOrder;
  devices: DeviceState[];
  initialTags: TagTable;
  ladder: LadderProgram;
  initialVfd: VfdState;
  faultCatalog: FaultScenario[];
  defaultFaultId: FaultScenarioId;
  gradingWeights: GradingWeights;
  skillOnCompletion: string;
}

// ---------- Action log / scoring ----------

export type ActionType =
  | "device_inspected"
  | "ping"
  | "config_change"
  | "wrong_config_change"
  | "hint_used"
  | "plc_viewed"
  | "start_attempt"
  | "start_success"
  | "stop"
  | "fault_identified"
  | "verified_running"
  | "report_submitted";

export interface LoggedAction {
  type: ActionType;
  label: string;
  timestamp: number;
  meta?: Record<string, unknown>;
}

export interface ScoreBreakdown {
  networking: number;
  plc: number;
  faultDiagnosis: number;
  verification: number;
  documentation: number;
}

export interface ScoreResult {
  total: number;
  breakdown: ScoreBreakdown;
}

// ---------- Hints ----------

export interface Hint {
  level: number;
  text: string;
  isFinalAnswer: boolean;
}

/** The seam a future AI Tutor plugs into (see ARCHITECTURE.md §6). */
export interface HintProvider {
  getHint(hintsAlreadyGiven: number, fault: FaultScenario): Hint;
}

// ---------- Service report ----------

export interface ServiceReport {
  technicianName: string;
  workOrderId: string;
  equipment: string;
  reportedProblem: string;
  problemFound: string;
  rootCause: string;
  correctiveAction: string;
  testingPerformed: string;
  finalStatus: "Operational" | "Needs Follow-up" | "";
}

export interface ReportValidation {
  complete: boolean;
  score: number; // 0-100
  issues: string[];
}

// ---------- Progress / dashboard / portfolio ----------

export interface CompletedLabRecord {
  labId: string;
  labName: string;
  faultId: FaultScenarioId;
  score: ScoreResult;
  hintsUsed: number;
  timeToRepairMs: number;
  skillEarned: string;
  completedAt: string; // ISO date
  accomplishments: string[];
}

export interface StudentProgress {
  studentName: string;
  completedLabs: CompletedLabRecord[];
}
