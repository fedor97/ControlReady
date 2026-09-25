import { useState } from "react";
import { useSimStore } from "../../state/simStore";
import type { Rung, RungElement } from "../../types";

function contactTrue(el: RungElement, tags: Record<string, boolean | number>): boolean {
  const v = Boolean(tags[el.tag]);
  return el.contactType === "NC" ? !v : v;
}

function ContactSymbol({ el, active }: { el: RungElement; active: boolean }) {
  return (
    <div
      className={`flex flex-col items-center rounded border px-2 py-1.5 font-mono-industrial text-xs ${
        active ? "border-cr-good bg-cr-good/15 text-cr-good" : "border-cr-border bg-cr-bg text-cr-text-dim"
      }`}
    >
      <div className="text-base leading-none">{el.contactType === "NC" ? "]/[" : "] ["}</div>
      <div className="max-w-[92px] truncate">{el.label ?? el.tag}</div>
    </div>
  );
}

function RungView({ rung, tags, active, index }: { rung: Rung; tags: Record<string, boolean | number>; active: boolean; index: number }) {
  return (
    <div className={`mb-3 flex gap-2 rounded border px-3 py-2.5 ${active ? "border-cr-good/60 bg-cr-good/5" : "border-cr-border"}`}>
      <div className="w-6 shrink-0 pt-1 text-center text-[10px] text-cr-text-dim">{index}</div>
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between">
          <div className="text-xs font-semibold text-cr-text">{rung.label}</div>
          <div className={`rounded px-2 py-0.5 text-[10px] font-bold ${active ? "bg-cr-good text-cr-bg" : "bg-cr-border text-cr-text-dim"}`}>{active ? "TRUE" : "FALSE"}</div>
        </div>
        <div className="mb-1.5 text-[11px] italic text-cr-text-dim">{rung.comment}</div>
        <div className="flex flex-col gap-1.5">
          {rung.branches.map((branch, bi) => (
            <div key={bi} className="flex flex-wrap items-center gap-1.5">
              {bi > 0 && <span className="text-[10px] text-cr-text-dim">OR</span>}
              {branch.map((el, ei) => (
                <ContactSymbol key={ei} el={el} active={contactTrue(el, tags)} />
              ))}
            </div>
          ))}
          <div className="mt-0.5 flex items-center gap-2">
            <span className="text-[10px] text-cr-text-dim">→</span>
            <div className={`rounded-full border px-3 py-1 font-mono-industrial text-xs ${active ? "border-cr-good bg-cr-good/20 text-cr-good" : "border-cr-border text-cr-text-dim"}`}>
              ( {rung.coil.label ?? rung.coil.tag} )
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TOOLBOX_INSTRUCTIONS = [
  { symbol: "] [", name: "XIC", desc: "Examine If Closed" },
  { symbol: "]/[", name: "XIO", desc: "Examine If Open" },
  { symbol: "( )", name: "OTE", desc: "Output Energize" },
  { symbol: "TON", name: "TON", desc: "Timer On-Delay" },
];

type OrganizerNode = { label: string; children?: OrganizerNode[] };

function OrganizerTree({ node, depth = 0, selected }: { node: OrganizerNode; depth?: number; selected?: string }) {
  return (
    <div>
      <div
        className={`truncate rounded px-1.5 py-0.5 text-[11px] ${node.label === selected ? "bg-cr-accent/20 text-cr-accent" : "text-cr-text-dim"}`}
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
      >
        {node.label}
      </div>
      {node.children?.map((c) => (
        <OrganizerTree key={c.label} node={c} depth={depth + 1} selected={selected} />
      ))}
    </div>
  );
}

type BottomTab = "status" | "errors" | "monitor" | "xref";

export function PlcSoftwareWindow() {
  const tags = useSimStore((s) => s.tags);
  const rungActive = useSimStore((s) => s.rungActive);
  const ladder = useSimStore((s) => s.lab.ladder);
  const plc = useSimStore((s) => s.devices.find((d) => d.id === "plc"));
  const commOk = useSimStore((s) => Boolean(s.tags.VFD_Communication_OK));
  const resetOverload = useSimStore((s) => s.resetOverload);
  const clearStopCircuit = useSimStore((s) => s.clearStopCircuit);
  const log = useSimStore((s) => s.log);
  const [bottomTab, setBottomTab] = useState<BottomTab>("monitor");

  const organizer: OrganizerNode = {
    label: "PLC-01 Controller",
    children: [
      { label: "Tasks", children: [{ label: "MainTask", children: [{ label: "MainProgram", children: [{ label: "MainRoutine" }] }] }] },
      { label: "Tags", children: Object.keys(tags).map((t) => ({ label: t })) },
      { label: "I/O Configuration", children: [{ label: "Ethernet" }, { label: "VFD-01 (192.168.1.20)" }] },
    ],
  };

  const errors: string[] = [];
  if (!plc?.poweredOn) errors.push("PLC-01 is powered off.");
  if (!commOk) errors.push("VFD_Communication_OK is FALSE — check network configuration.");
  if (!tags.Overload_OK) errors.push("Overload_OK is FALSE — overload relay tripped.");
  if (!tags.Stop_PB) errors.push("Stop_PB is FALSE — stop circuit is open.");

  return (
    <div className="flex h-full flex-col" onMouseEnter={() => log({ type: "plc_viewed", label: "Viewed ladder logic" })}>
      <div className="flex min-h-0 flex-1">
        {/* Controller Organizer */}
        <div className="w-48 shrink-0 overflow-y-auto border-r border-cr-border bg-cr-panel-2 p-2">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-cr-text-dim">Controller Organizer</div>
          <OrganizerTree node={organizer} selected="MainRoutine" />
        </div>

        {/* Ladder Editor */}
        <div className="min-w-0 flex-1 overflow-y-auto p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wide text-cr-text-dim">Ladder Editor — MainRoutine</div>
            <div className="flex items-center gap-1 text-[11px] font-semibold">
              <span className={`status-dot ${plc?.poweredOn ? "bg-cr-good" : "bg-cr-text-dim"}`} />
              <span className={plc?.poweredOn ? "text-cr-good" : "text-cr-text-dim"}>{plc?.poweredOn ? "RUN" : "OFFLINE"}</span>
            </div>
          </div>
          {ladder.rungs.map((rung, i) => (
            <RungView key={rung.id} rung={rung} tags={tags} active={Boolean(rungActive[rung.id])} index={i} />
          ))}
        </div>

        {/* Instruction Toolbox — reference only, not draggable in this MVP */}
        <div className="w-40 shrink-0 overflow-y-auto border-l border-cr-border bg-cr-panel-2 p-2">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-cr-text-dim">Instruction Toolbox</div>
          <div className="space-y-1.5">
            {TOOLBOX_INSTRUCTIONS.map((ins) => (
              <div key={ins.name} className="rounded border border-cr-border bg-cr-bg px-2 py-1.5">
                <div className="font-mono-industrial text-sm text-cr-text-dim">{ins.symbol}</div>
                <div className="text-[10px] font-semibold text-cr-text">{ins.name}</div>
                <div className="text-[9px] text-cr-text-dim">{ins.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom status tabs */}
      <div className="h-32 shrink-0 border-t border-cr-border">
        <div className="flex border-b border-cr-border">
          {(["status", "errors", "monitor", "xref"] as BottomTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setBottomTab(t)}
              className={`px-3 py-1 text-[11px] font-semibold capitalize ${bottomTab === t ? "border-b-2 border-cr-accent text-cr-accent" : "text-cr-text-dim hover:text-cr-text"}`}
            >
              {t === "xref" ? "Cross Reference" : t}
              {t === "errors" && errors.length > 0 && <span className="ml-1 text-cr-bad">({errors.length})</span>}
            </button>
          ))}
        </div>
        <div className="h-[calc(100%-28px)] overflow-y-auto p-2 text-[11px]">
          {bottomTab === "status" && (
            <div className="grid grid-cols-3 gap-2">
              <StatusCell label="Power" value={plc?.poweredOn ? "ON" : "OFF"} tone={plc?.poweredOn ? "good" : "dim"} />
              <StatusCell label="Ethernet" value={plc?.cableConnected ? "CONNECTED" : "DISCONNECTED"} tone={plc?.cableConnected ? "good" : "bad"} />
              <StatusCell label="VFD Comm" value={commOk ? "HEALTHY" : "FAULT"} tone={commOk ? "good" : "bad"} />
            </div>
          )}
          {bottomTab === "errors" && (
            <div className="space-y-1">
              {errors.length === 0 ? (
                <div className="text-cr-good">No active errors.</div>
              ) : (
                errors.map((e, i) => (
                  <div key={i} className="flex items-center justify-between rounded border border-cr-bad/40 bg-cr-bad/10 px-2 py-1 text-cr-bad">
                    <span>{e}</span>
                    {e.includes("Overload") && (
                      <button onClick={resetOverload} className="btn px-1.5 py-0.5 text-[10px] text-cr-warn">
                        Reset
                      </button>
                    )}
                    {e.includes("Stop circuit") && (
                      <button onClick={clearStopCircuit} className="btn px-1.5 py-0.5 text-[10px] text-cr-warn">
                        Clear
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
          {bottomTab === "monitor" && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(tags).map(([tag, value]) => (
                <div key={tag} className="flex items-center justify-between rounded border border-cr-border/60 px-2 py-0.5 font-mono-industrial">
                  <span className="text-cr-text">{tag}</span>
                  <span className={`rounded px-1.5 font-bold ${value ? "bg-cr-good/20 text-cr-good" : "bg-cr-border text-cr-text-dim"}`}>{typeof value === "boolean" ? (value ? "TRUE" : "FALSE") : value}</span>
                </div>
              ))}
            </div>
          )}
          {bottomTab === "xref" && (
            <div className="space-y-1">
              {Object.keys(tags).map((tag) => {
                const usedIn = ladder.rungs.filter((r) => r.branches.some((b) => b.some((el) => el.tag === tag)) || r.coil.tag === tag);
                if (usedIn.length === 0) return null;
                return (
                  <div key={tag} className="flex items-center justify-between rounded border border-cr-border/60 px-2 py-0.5">
                    <span className="font-mono-industrial text-cr-text">{tag}</span>
                    <span className="text-cr-text-dim">{usedIn.map((r) => r.label).join(", ")}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusCell({ label, value, tone }: { label: string; value: string; tone: "good" | "bad" | "dim" }) {
  const toneClass = tone === "good" ? "text-cr-good" : tone === "bad" ? "text-cr-bad" : "text-cr-text-dim";
  return (
    <div className="rounded border border-cr-border px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wide text-cr-text-dim">{label}</div>
      <div className={`font-mono-industrial font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}
