import { describe, expect, it } from "vitest";
import { computeScore } from "./scoringEngine";
import type { GradingWeights, LoggedAction } from "../types";

const weights: GradingWeights = { networking: 25, plc: 20, faultDiagnosis: 25, verification: 15, documentation: 15 };

function action(type: LoggedAction["type"]): LoggedAction {
  return { type, label: type, timestamp: Date.now() };
}

describe("computeScore", () => {
  it("scores a clean, verified, documented repair highly", () => {
    const result = computeScore({
      actions: [action("ping"), action("plc_viewed"), action("start_attempt"), action("start_success")],
      hintsUsed: 0,
      weights,
      reportScore: 95,
      motorVerifiedRunning: true,
      faultResolved: true,
    });
    expect(result.total).toBeGreaterThanOrEqual(85);
    expect(result.breakdown.verification).toBe(100);
  });

  it("penalizes wrong configuration changes in the networking category", () => {
    const clean = computeScore({
      actions: [action("ping")],
      hintsUsed: 0,
      weights,
      reportScore: 100,
      motorVerifiedRunning: true,
      faultResolved: true,
    });
    const messy = computeScore({
      actions: [action("ping"), action("wrong_config_change"), action("wrong_config_change")],
      hintsUsed: 0,
      weights,
      reportScore: 100,
      motorVerifiedRunning: true,
      faultResolved: true,
    });
    expect(messy.breakdown.networking).toBeLessThan(clean.breakdown.networking);
  });

  it("reduces the fault diagnosis score as more hints are used", () => {
    const noHints = computeScore({ actions: [], hintsUsed: 0, weights, reportScore: 0, motorVerifiedRunning: false, faultResolved: true });
    const manyHints = computeScore({ actions: [], hintsUsed: 5, weights, reportScore: 0, motorVerifiedRunning: false, faultResolved: true });
    expect(manyHints.breakdown.faultDiagnosis).toBeLessThan(noHints.breakdown.faultDiagnosis);
  });

  it("caps verification at 0 if the student never even attempted a start", () => {
    const result = computeScore({ actions: [], hintsUsed: 0, weights, reportScore: 0, motorVerifiedRunning: false, faultResolved: true });
    expect(result.breakdown.verification).toBe(0);
  });

  it("caps the networking score when the fault was never actually resolved", () => {
    const result = computeScore({ actions: [action("ping")], hintsUsed: 0, weights, reportScore: 0, motorVerifiedRunning: false, faultResolved: false });
    expect(result.breakdown.networking).toBeLessThanOrEqual(40);
  });
});
