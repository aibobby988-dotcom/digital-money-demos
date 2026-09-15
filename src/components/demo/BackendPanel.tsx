"use client";

import { Check, CircleDashed, Loader2, PauseCircle, RotateCcw, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { Runner, StageStatus, SystemDef } from "./useStageRunner";

function StatusIcon({ status }: { status: StageStatus }) {
  if (status === "active") return <Loader2 size={14} className="animate-spin text-blue-600" />;
  if (status === "done") return <Check size={14} strokeWidth={3} className="text-emerald-600" />;
  if (status === "failed") return <X size={14} strokeWidth={3} className="text-rose-600" />;
  if (status === "held") return <PauseCircle size={14} className="text-amber-500" />;
  if (status === "reversed") return <RotateCcw size={13} className="text-amber-500" />;
  return <CircleDashed size={14} className="text-ink-400" />;
}

const toneClass = {
  info: "text-ink-500",
  pass: "text-emerald-600",
  warn: "text-amber-500",
  fail: "text-rose-600",
  settle: "text-brand-600 font-medium",
};

export function BackendPanel({
  runner,
  systems,
  groups,
}: {
  runner: Runner;
  systems: SystemDef[];
  groups: { owner: string; ids: string[] }[];
}) {
  const { scenario, statuses, reversalStatuses, current, log } = runner;
  const logRef = useRef<HTMLUListElement>(null);

  // Keep the newest audit entry in view while presenting.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log.length]);
  const stages = scenario?.stages ?? [];

  // A system is busy if any running stage or reversal step touches it; done if a completed stage used it.
  const systemState = (id: string): StageStatus => {
    let state: StageStatus = "pending";
    stages.forEach((st, i) => {
      if (!st.systemIds.includes(id)) return;
      const s = statuses[i];
      if (s === "active" || s === "failed" || s === "held") state = s;
      else if (s === "done" && state === "pending") state = "done";
    });
    (scenario?.reversal ?? []).forEach((r, i) => {
      if (r.systemIds.includes(id) && reversalStatuses[i] !== "pending") state = reversalStatuses[i];
    });
    return state;
  };

  const byId = Object.fromEntries(systems.map((s) => [s.id, s]));

  return (
    <div className="flex h-full flex-col gap-3">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-paper-200">
          Systems this touches · illustrative integration map
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {groups.map((g) => (
            <div key={g.owner} className="rounded-lg border border-charcoal-700 bg-charcoal-900 p-2">
              <p className="px-1 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-400">{g.owner}</p>
              <div className="space-y-1">
                {g.ids.map((id) => {
                  const sys = byId[id];
                  const st = systemState(id);
                  return (
                    <div
                      key={id}
                      title={sys.role}
                      className={cn(
                        "flex items-center gap-2 rounded-md border px-2 py-1.5 transition-colors duration-300",
                        st === "active" && "border-blue-500 bg-blue-500/15",
                        st === "done" && "border-emerald-600/60 bg-emerald-500/10",
                        (st === "failed" || st === "held") && "border-rose-500 bg-rose-500/15",
                        st === "held" && "border-amber-500 bg-amber-500/15",
                        st === "reversed" && "border-amber-500 bg-amber-500/10",
                        st === "pending" && "border-charcoal-700 bg-charcoal-850"
                      )}
                    >
                      <StatusIcon status={st} />
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-medium text-paper-0">{sys.name}</p>
                        <p className="truncate text-[10.5px] text-ink-400">{sys.role}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-charcoal-700 bg-charcoal-900">
        <p className="border-b border-charcoal-700 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-paper-200">
          Stages before finality
        </p>
        <ol className="divide-y divide-charcoal-800">
          {stages.length === 0 && (
            <li className="px-3 py-6 text-center text-[12px] text-ink-400">Choose a scenario to run.</li>
          )}
          {stages.map((st, i) => {
            const s = statuses[i];
            const show = s !== "pending" || i === current;
            return (
              <li
                key={st.id}
                className={cn(
                  "flex gap-2.5 px-3 py-2 transition-colors",
                  s === "active" && "bg-blue-500/10",
                  s === "failed" && "bg-rose-500/10",
                  s === "held" && "bg-amber-500/10"
                )}
              >
                <span className="mt-0.5 w-4 shrink-0 text-right font-mono text-[10.5px] text-ink-400">{i + 1}</span>
                <span className="mt-0.5 shrink-0">
                  <StatusIcon status={s} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[12.5px] font-medium", s === "pending" ? "text-ink-400" : "text-paper-0")}>
                    {st.label}
                    <span className="ml-2 text-[10.5px] font-normal text-ink-400">
                      {st.systemIds.map((id) => byId[id]?.name).join(" · ")}
                    </span>
                  </p>
                  {show && (
                    <p
                      className={cn(
                        "mt-0.5 text-[11.5px] leading-relaxed",
                        s === "failed" ? "text-rose-500" : s === "held" ? "text-amber-500" : "text-paper-200"
                      )}
                    >
                      {s === "failed"
                        ? scenario?.failDetail ?? st.detail
                        : s === "held"
                          ? scenario?.holdDetail ?? st.detail
                          : st.detail}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
          {(scenario?.reversal ?? []).map((r, i) =>
            reversalStatuses[i] === "pending" ? null : (
              <li key={r.label} className="flex gap-2.5 bg-amber-500/10 px-3 py-2">
                <span className="mt-0.5 w-4 shrink-0 text-right font-mono text-[10.5px] text-amber-500">R{i + 1}</span>
                <span className="mt-0.5 shrink-0">
                  <StatusIcon status={reversalStatuses[i]} />
                </span>
                <div>
                  <p className="text-[12.5px] font-medium text-paper-0">{r.label}</p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-amber-500">{r.detail}</p>
                </div>
              </li>
            )
          )}
        </ol>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-charcoal-700 bg-charcoal-950">
        <p className="border-b border-charcoal-700 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-paper-200">
          Event log · immutable audit trail
        </p>
        <ul ref={logRef} className="max-h-44 space-y-1 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed">
          {log.length === 0 && <li className="text-ink-400">Waiting for an instruction…</li>}
          {log.map((l, i) => (
            <li key={i} className="flex gap-2">
              <span className="shrink-0 text-ink-400">{l.time}</span>
              <span className={toneClass[l.tone]}>{l.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
