import { describe, expect, it } from "vitest";
import { stepVfd } from "./vfdEngine";
import type { VfdState } from "../types";

const baseVfd: VfdState = {
  params: { frequencyReference: 60, acceleration: 5, deceleration: 5, networkControlEnabled: true },
  runCommand: false,
  outputFrequency: 0,
  motorCurrent: 0,
  faultCode: null,
  commOk: false,
  ready: false,
  running: false,
};

describe("stepVfd — communication loss", () => {
  it("refuses to run when PLC communication is down, even if the PLC commands run", () => {
    const next = stepVfd(baseVfd, { plcCommOk: false, runCommandFromPlc: true, dtMs: 100 });
    expect(next.running).toBe(false);
    expect(next.runCommand).toBe(false);
    expect(next.faultCode).toBe("COMM_FAULT");
  });

  it("decelerates to a stop if communication is lost mid-run", () => {
    const running: VfdState = { ...baseVfd, commOk: true, running: true, runCommand: true, outputFrequency: 60 };
    const next = stepVfd(running, { plcCommOk: false, runCommandFromPlc: true, dtMs: 100 });
    expect(next.faultCode).toBe("COMM_FAULT");
    expect(next.outputFrequency).toBeLessThan(60);
  });
});

describe("stepVfd — normal run sequence", () => {
  it("ramps output frequency up toward the reference when commanded to run", () => {
    const next = stepVfd(baseVfd, { plcCommOk: true, runCommandFromPlc: true, dtMs: 1000 });
    expect(next.commOk).toBe(true);
    expect(next.faultCode).toBeNull();
    expect(next.outputFrequency).toBeGreaterThan(0);
  });

  it("reaches running=true once output frequency clears the threshold", () => {
    let state = baseVfd;
    for (let i = 0; i < 10; i++) {
      state = stepVfd(state, { plcCommOk: true, runCommandFromPlc: true, dtMs: 1000 });
    }
    expect(state.outputFrequency).toBeCloseTo(60, 0);
    expect(state.running).toBe(true);
  });

  it("does not run when comm is healthy but the PLC has not commanded run", () => {
    const next = stepVfd(baseVfd, { plcCommOk: true, runCommandFromPlc: false, dtMs: 1000 });
    expect(next.running).toBe(false);
    expect(next.outputFrequency).toBe(0);
  });
});
