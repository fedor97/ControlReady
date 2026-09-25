// Pure VFD behavior simulation: ramping, comm-loss fault, motor current estimate.

import type { VfdState } from "../types";

export interface VfdStepInput {
  /** computed by the caller: is the PLC currently able to reach the VFD on the network? */
  plcCommOk: boolean;
  /** the PLC's Motor_Command output, i.e. "PLC wants the VFD running" */
  runCommandFromPlc: boolean;
  dtMs: number;
}

const NOMINAL_FREQ_HZ = 60;

export function stepVfd(prev: VfdState, input: VfdStepInput): VfdState {
  const { plcCommOk, runCommandFromPlc, dtMs } = input;
  const dtSec = dtMs / 1000;

  const commOk = plcCommOk;
  const runCommand = commOk && runCommandFromPlc;
  const target = runCommand ? prev.params.frequencyReference : 0;
  const rampSeconds = runCommand ? prev.params.acceleration : prev.params.deceleration;
  const maxDelta = rampSeconds > 0 ? (NOMINAL_FREQ_HZ / rampSeconds) * dtSec : Math.abs(target - prev.outputFrequency);

  let outputFrequency = prev.outputFrequency;
  if (outputFrequency < target) outputFrequency = Math.min(target, outputFrequency + maxDelta);
  else outputFrequency = Math.max(target, outputFrequency - maxDelta);

  const running = runCommand && outputFrequency > 0.5;
  const motorCurrent = running ? Number((1.5 + (outputFrequency / NOMINAL_FREQ_HZ) * 3.5).toFixed(2)) : commOk ? 0.1 : 0;

  return {
    ...prev,
    runCommand,
    outputFrequency: Number(outputFrequency.toFixed(2)),
    motorCurrent,
    faultCode: commOk ? null : "COMM_FAULT",
    commOk,
    ready: commOk,
    running,
  };
}
