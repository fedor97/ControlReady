// Pure generic ladder-logic scan engine. Not a clone of any vendor software —
// an original, simplified rung evaluator: series contacts (AND), parallel branches (OR, i.e. seal-in),
// NO/NC contacts, coils, and TON timers.

import type { LadderProgram, Rung, RungElement, TagTable } from "../types";

export interface TimerState {
  accMs: number;
}

export interface ScanResult {
  tags: TagTable;
  timerStates: Record<string, TimerState>;
  /** whether each rung's power rail is currently true — drives the 3D/HUD "power flow" highlight */
  rungActive: Record<string, boolean>;
}

function evaluateContact(el: RungElement, tags: TagTable): boolean {
  const v = Boolean(tags[el.tag]);
  return el.contactType === "NC" ? !v : v;
}

function evaluateBranch(branch: RungElement[], tags: TagTable): boolean {
  return branch.every((el) => evaluateContact(el, tags));
}

function evaluateRung(
  rung: Rung,
  tags: TagTable,
  timerStates: Record<string, TimerState>,
  dtMs: number,
): { rungTrue: boolean; tagPatch: TagTable; timerPatch: Record<string, TimerState> } {
  const rungTrue = rung.branches.some((branch) => evaluateBranch(branch, tags));

  if (rung.coil.kind === "coil") {
    return { rungTrue, tagPatch: { [rung.coil.tag]: rungTrue }, timerPatch: {} };
  }

  if (rung.coil.kind === "timer_ton") {
    const preset = rung.coil.presetMs ?? 0;
    const prev = timerStates[rung.coil.tag] ?? { accMs: 0 };
    const accMs = rungTrue ? Math.min(preset, prev.accMs + dtMs) : 0;
    const done = accMs >= preset && preset > 0;
    return {
      rungTrue,
      tagPatch: { [rung.coil.tag]: done },
      timerPatch: { [rung.coil.tag]: { accMs } },
    };
  }

  return { rungTrue, tagPatch: {}, timerPatch: {} };
}

/** Run one PLC scan cycle over the whole program. Returns new tag table + timer states (no mutation). */
export function scanProgram(
  program: LadderProgram,
  tags: TagTable,
  timerStates: Record<string, TimerState>,
  dtMs: number,
): ScanResult {
  let nextTags: TagTable = { ...tags };
  let nextTimers: Record<string, TimerState> = { ...timerStates };
  const rungActive: Record<string, boolean> = {};

  for (const rung of program.rungs) {
    const { rungTrue, tagPatch, timerPatch } = evaluateRung(rung, nextTags, nextTimers, dtMs);
    rungActive[rung.id] = rungTrue;
    nextTags = { ...nextTags, ...tagPatch };
    nextTimers = { ...nextTimers, ...timerPatch };
  }

  return { tags: nextTags, timerStates: nextTimers, rungActive };
}
