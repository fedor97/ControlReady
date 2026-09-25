import { describe, expect, it } from "vitest";
import { scanProgram } from "./plcEngine";
import type { LadderProgram, TagTable } from "../types";

const sealInProgram: LadderProgram = {
  rungs: [
    {
      id: "rung1",
      label: "Seal-In",
      comment: "",
      branches: [
        [
          { kind: "contact", tag: "Start_PB", contactType: "NO" },
          { kind: "contact", tag: "Stop_PB", contactType: "NO" },
          { kind: "contact", tag: "Overload_OK", contactType: "NO" },
        ],
        [
          { kind: "contact", tag: "Motor_Command", contactType: "NO" },
          { kind: "contact", tag: "Stop_PB", contactType: "NO" },
          { kind: "contact", tag: "Overload_OK", contactType: "NO" },
        ],
      ],
      coil: { kind: "coil", tag: "Motor_Command" },
    },
  ],
};

function scan(tags: TagTable) {
  return scanProgram(sealInProgram, tags, {}, 100);
}

describe("scanProgram — motor start/stop seal-in", () => {
  it("does not energize the coil when Start_PB is false", () => {
    const result = scan({ Start_PB: false, Stop_PB: true, Overload_OK: true, Motor_Command: false });
    expect(result.tags.Motor_Command).toBe(false);
  });

  it("energizes the coil when Start_PB is pressed and permissives are healthy", () => {
    const result = scan({ Start_PB: true, Stop_PB: true, Overload_OK: true, Motor_Command: false });
    expect(result.tags.Motor_Command).toBe(true);
  });

  it("seals in — stays energized after Start_PB releases", () => {
    const afterStart = scan({ Start_PB: true, Stop_PB: true, Overload_OK: true, Motor_Command: false });
    const afterRelease = scan({ Start_PB: false, Stop_PB: true, Overload_OK: true, Motor_Command: afterStart.tags.Motor_Command as boolean });
    expect(afterRelease.tags.Motor_Command).toBe(true);
  });

  it("drops out when Stop_PB opens, even while sealed in", () => {
    const result = scan({ Start_PB: false, Stop_PB: false, Overload_OK: true, Motor_Command: true });
    expect(result.tags.Motor_Command).toBe(false);
  });

  it("drops out when the overload interlock trips, even while sealed in", () => {
    const result = scan({ Start_PB: false, Stop_PB: true, Overload_OK: false, Motor_Command: true });
    expect(result.tags.Motor_Command).toBe(false);
  });
});

describe("scanProgram — TON timer", () => {
  const timerProgram: LadderProgram = {
    rungs: [
      {
        id: "t1",
        label: "Timer",
        comment: "",
        branches: [[{ kind: "contact", tag: "Enable", contactType: "NO" }]],
        coil: { kind: "timer_ton", tag: "Timer_DN", presetMs: 500 },
      },
    ],
  };

  it("does not go done before the preset elapses", () => {
    let timers = {};
    let tags: TagTable = { Enable: true };
    for (let i = 0; i < 3; i++) {
      const result = scanProgram(timerProgram, tags, timers, 100);
      tags = result.tags;
      timers = result.timerStates;
    }
    expect(tags.Timer_DN).toBe(false);
  });

  it("goes done once accumulated time reaches the preset", () => {
    let timers = {};
    let tags: TagTable = { Enable: true };
    for (let i = 0; i < 6; i++) {
      const result = scanProgram(timerProgram, tags, timers, 100);
      tags = result.tags;
      timers = result.timerStates;
    }
    expect(tags.Timer_DN).toBe(true);
  });

  it("resets accumulated time when the enabling contact drops", () => {
    let timers = { Timer_DN: { accMs: 500 } };
    const result = scanProgram(timerProgram, { Enable: false }, timers, 100);
    expect(result.tags.Timer_DN).toBe(false);
    expect(result.timerStates.Timer_DN.accMs).toBe(0);
  });
});
