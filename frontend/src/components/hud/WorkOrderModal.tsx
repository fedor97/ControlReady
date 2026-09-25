import { useSimStore } from "../../state/simStore";

export function WorkOrderModal({ onClose }: { onClose: () => void }) {
  const workOrder = useSimStore((s) => s.lab.workOrder);

  return (
    <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-lg border border-cr-border bg-cr-panel shadow-2xl">
        <div className="border-b border-cr-border bg-cr-panel-2 px-5 py-3">
          <div className="text-xs tracking-widest text-cr-text-dim">WORK ORDER</div>
          <div className="font-mono-industrial text-base font-bold text-cr-accent">{workOrder.id}</div>
        </div>
        <div className="space-y-4 px-5 py-4 text-sm">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-cr-text-dim">Equipment</div>
            <div className="font-medium">{workOrder.equipment}</div>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-cr-text-dim">Problem</div>
            <div className="rounded border border-cr-bad/40 bg-cr-bad/10 px-3 py-2 font-medium text-red-300">{workOrder.problem}</div>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-cr-text-dim">Description</div>
            <div className="text-cr-text-dim">{workOrder.description}</div>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-cr-text-dim">Task</div>
            <div className="text-cr-text-dim">{workOrder.task}</div>
          </div>
          <div className="rounded border border-cr-border bg-cr-panel-2 px-3 py-2 text-xs text-cr-text-dim">
            Tip: click any device in the 3D lab to inspect it. Open SCADA, Network Tools, and PLC Ladder Logic at the bottom
            of the screen to diagnose the fault.
          </div>
        </div>
        <div className="border-t border-cr-border px-5 py-3">
          <button onClick={onClose} className="btn btn-accent w-full px-4 py-2 text-sm">
            Begin Work Order
          </button>
        </div>
      </div>
    </div>
  );
}
