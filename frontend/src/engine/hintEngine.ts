// Rule-based, state-independent progressive hint ladder.
// Implements the `HintProvider` interface — this is the seam a future optional
// premium AI Tutor plugs into without changing any caller (see ARCHITECTURE.md §6).

import type { FaultScenario, Hint, HintProvider } from "../types";

export const ruleBasedHintProvider: HintProvider = {
  getHint(hintsAlreadyGiven: number, fault: FaultScenario): Hint {
    const level = hintsAlreadyGiven + 1;
    const ladder = fault.hintLadder;

    if (level <= ladder.length) {
      return { level, text: ladder[level - 1], isFinalAnswer: false };
    }

    return {
      level,
      text: `Root cause: ${fault.rootCause}. Corrective action: ${fault.correctiveAction}.`,
      isFinalAnswer: true,
    };
  },
};

export function totalHintsAvailable(fault: FaultScenario): number {
  return fault.hintLadder.length;
}
