import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CompletedLabRecord, StudentProgress } from "../types";

interface ProgressStoreState extends StudentProgress {
  setStudentName: (name: string) => void;
  addCompletedLab: (record: CompletedLabRecord) => void;
  resetProgress: () => void;
}

const DEFAULT_STUDENT_NAME = "Demo Student";

export const useProgressStore = create<ProgressStoreState>()(
  persist(
    (set) => ({
      studentName: DEFAULT_STUDENT_NAME,
      completedLabs: [],
      setStudentName: (name) => set({ studentName: name || DEFAULT_STUDENT_NAME }),
      addCompletedLab: (record) => set((s) => ({ completedLabs: [...s.completedLabs, record] })),
      resetProgress: () => set({ studentName: DEFAULT_STUDENT_NAME, completedLabs: [] }),
    }),
    { name: "controlready-progress" },
  ),
);

export function skillTally(completedLabs: CompletedLabRecord[]): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const lab of completedLabs) {
    tally[lab.skillEarned] = (tally[lab.skillEarned] ?? 0) + 1;
  }
  return tally;
}

export function averageScore(completedLabs: CompletedLabRecord[]): number {
  if (completedLabs.length === 0) return 0;
  return Math.round(completedLabs.reduce((sum, l) => sum + l.score.total, 0) / completedLabs.length);
}

export function averageBreakdown(completedLabs: CompletedLabRecord[]) {
  if (completedLabs.length === 0) {
    return { networking: 0, plc: 0, faultDiagnosis: 0, verification: 0, documentation: 0 };
  }
  const sums = completedLabs.reduce(
    (acc, l) => ({
      networking: acc.networking + l.score.breakdown.networking,
      plc: acc.plc + l.score.breakdown.plc,
      faultDiagnosis: acc.faultDiagnosis + l.score.breakdown.faultDiagnosis,
      verification: acc.verification + l.score.breakdown.verification,
      documentation: acc.documentation + l.score.breakdown.documentation,
    }),
    { networking: 0, plc: 0, faultDiagnosis: 0, verification: 0, documentation: 0 },
  );
  const n = completedLabs.length;
  return {
    networking: Math.round(sums.networking / n),
    plc: Math.round(sums.plc / n),
    faultDiagnosis: Math.round(sums.faultDiagnosis / n),
    verification: Math.round(sums.verification / n),
    documentation: Math.round(sums.documentation / n),
  };
}
