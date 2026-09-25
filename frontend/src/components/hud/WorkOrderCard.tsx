import { useSimStore } from "../../state/simStore";

export function WorkOrderCard({ onExpand }: { onExpand: () => void }) {
  const workOrder = useSimStore((s) => s.lab.workOrder);

  return (
    <div className="panel-flat pointer-events-auto w-72 rounded-lg bg-cr-panel/95 p-4 backdrop-blur">
      <div className="mb-1 text-[10px] tracking-widest text-cr-text-dim">WORK ORDER {workOrder.id}</div>
      <div className="mb-1 text-sm font-semibold text-cr-text">{workOrder.problem}</div>
      <div className="mb-3 text-xs text-cr-text-dim">{workOrder.description}</div>
      <button onClick={onExpand} className="btn w-full py-1.5 text-xs text-cr-accent">
        View Full Work Order
      </button>
    </div>
  );
}
