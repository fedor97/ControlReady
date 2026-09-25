// Pure troubleshooting score calculator. Rule-based, no AI.

import type { GradingWeights, LoggedAction, ScoreBreakdown, ScoreResult } from "../types";

export interface ScoreInput {
  actions: LoggedAction[];
  hintsUsed: number;
  weights: GradingWeights;
  reportScore: number; // 0-100, from reportRubric.validateServiceReport
  motorVerifiedRunning: boolean;
  faultResolved: boolean;
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function count(actions: LoggedAction[], type: LoggedAction["type"]): number {
  return actions.filter((a) => a.type === type).length;
}

export function computeScore(input: ScoreInput): ScoreResult {
  const { actions, hintsUsed, weights, reportScore, motorVerifiedRunning, faultResolved } = input;

  const pings = count(actions, "ping");
  const wrongConfigChanges = count(actions, "wrong_config_change");
  const startAttempts = count(actions, "start_attempt");
  const plcViewed = count(actions, "plc_viewed") > 0;

  let networking = 100;
  if (pings === 0) networking -= 25; // never diagnosed before touching config
  networking -= Math.min(60, wrongConfigChanges * 15);
  if (!faultResolved) networking = Math.min(networking, 40);
  networking = clamp(networking);

  let plc = 100;
  if (!plcViewed) plc -= 30;
  plc -= Math.min(30, Math.max(0, startAttempts - 2) * 10);
  plc = clamp(plc);

  let faultDiagnosis = faultResolved ? 100 : 30;
  faultDiagnosis -= Math.min(60, hintsUsed * 8);
  faultDiagnosis = clamp(faultDiagnosis);

  let verification = motorVerifiedRunning ? 100 : startAttempts > 0 ? 50 : 0;
  verification = clamp(verification);

  const documentation = clamp(reportScore);

  const breakdown: ScoreBreakdown = {
    networking: Math.round(networking),
    plc: Math.round(plc),
    faultDiagnosis: Math.round(faultDiagnosis),
    verification: Math.round(verification),
    documentation: Math.round(documentation),
  };

  const total = Math.round(
    (breakdown.networking * weights.networking +
      breakdown.plc * weights.plc +
      breakdown.faultDiagnosis * weights.faultDiagnosis +
      breakdown.verification * weights.verification +
      breakdown.documentation * weights.documentation) /
      100,
  );

  return { total: clamp(total), breakdown };
}
