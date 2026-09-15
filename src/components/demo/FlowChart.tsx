"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Runner, Scenario, StageStatus, SystemDef } from "./useStageRunner";

const LABEL_W = 150;
const COL_W = 132;
const NODE_W = 116;
const NODE_H = 50;
const LANE_H = 86;
const TOP = 34;

type Lane = { owner: string; ids: string[] };

function wrap(text: string, max = 17): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max && line) {
      lines.push(line);
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

const nodeStyle: Record<StageStatus, { box: string; text: string }> = {
  pending: { box: "fill-paper-0 stroke-paper-200", text: "fill-ink-400" },
  active: { box: "fill-blue-100 stroke-blue-500", text: "fill-charcoal-900" },
  done: { box: "fill-emerald-100 stroke-emerald-500", text: "fill-charcoal-900" },
  failed: { box: "fill-rose-100 stroke-rose-500", text: "fill-charcoal-900" },
  held: { box: "fill-amber-100 stroke-amber-500", text: "fill-charcoal-900" },
  reversed: { box: "fill-amber-100 stroke-amber-500", text: "fill-charcoal-900" },
};

const arrowFill = {
  idle: "fill-paper-200",
  done: "fill-ink-500",
  active: "fill-blue-500",
  fail: "fill-rose-500",
  warn: "fill-amber-500",
};

const edgeColor: Record<"idle" | "done" | "active" | "fail" | "warn", string> = {
  idle: "stroke-paper-200",
  done: "stroke-ink-500",
  active: "stroke-blue-500",
  fail: "stroke-rose-500",
  warn: "stroke-amber-500",
};

function elbow(x1: number, y1: number, x2: number, y2: number) {
  if (Math.abs(y1 - y2) < 1) return `M${x1},${y1} H${x2}`;
  const mid = x1 + (x2 - x1) / 2;
  return `M${x1},${y1} H${mid} V${y2} H${x2}`;
}

/**
 * Swimlane flow chart of the same run the side-by-side view shows. Lanes are the
 * organisations involved; each node is a stage placed in the lane of the system
 * that owns it, so the chart shows who hands off to whom, in order.
 */
export function FlowChart({
  runner,
  lanes,
  systems,
  fallback,
}: {
  runner: Runner;
  lanes: Lane[];
  systems: SystemDef[];
  fallback: Scenario;
}) {
  const sc = runner.scenario ?? fallback;
  const live = runner.scenario !== null;
  const stages = sc.stages;
  const statuses: StageStatus[] = live ? runner.statuses : stages.map(() => "pending");
  const revStatuses: StageStatus[] = live ? runner.reversalStatuses : (sc.reversal ?? []).map(() => "pending");
  const reversal = sc.reversal ?? [];
  const hasReversal = reversal.length > 0;

  const laneOf = (systemId: string) => Math.max(0, lanes.findIndex((l) => l.ids.includes(systemId)));
  const allLanes = hasReversal ? [...lanes, { owner: "Reversal — nothing moves", ids: [] }] : lanes;
  const width = LABEL_W + stages.length * COL_W + 16;
  const height = TOP + allLanes.length * LANE_H + 8;

  const pos = stages.map((st, i) => {
    const lane = laneOf(st.systemIds[0]);
    return { x: LABEL_W + i * COL_W + (COL_W - NODE_W) / 2, cy: TOP + lane * LANE_H + LANE_H / 2 };
  });
  const indexOf = Object.fromEntries(stages.map((s, i) => [s.id, i]));

  const failIdx = statuses.findIndex((s) => s === "failed");
  const holdIdx = statuses.findIndex((s) => s === "held");
  const revLaneCy = TOP + lanes.length * LANE_H + LANE_H / 2;
  const revAnchor = failIdx >= 0 ? failIdx : holdIdx >= 0 ? holdIdx : stages.length - 3;
  const revPos = reversal.map((_, r) => ({
    x: LABEL_W + Math.min(revAnchor + r + 1, stages.length - 1) * COL_W + (COL_W - NODE_W) / 2,
    cy: revLaneCy,
  }));

  const edges: { key: string; from: number; to: number }[] = [];
  stages.forEach((st, i) => {
    if (i > 0) edges.push({ key: `${i - 1}-${i}`, from: i - 1, to: i });
    (st.joinsFrom ?? []).forEach((src) => {
      if (indexOf[src] !== undefined) edges.push({ key: `${src}-${i}`, from: indexOf[src], to: i });
    });
  });

  const edgeState = (to: number): keyof typeof edgeColor => {
    const s = statuses[to];
    if (s === "active") return "active";
    if (s === "failed") return "fail";
    if (s === "held") return "warn";
    if (s === "done") return "done";
    return "idle";
  };

  const byId = Object.fromEntries(systems.map((s) => [s.id, s]));
  const activeStage = live && runner.current >= 0 && runner.current < stages.length ? stages[runner.current] : null;
  const showToken = runner.phase === "running" && !runner.paused;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-2xl border border-paper-200 bg-paper-0 p-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[1100px]" role="img" aria-label="Animated process flow chart">
          <defs>
            {(["idle", "done", "active", "fail", "warn"] as const).map((k) => (
              <marker key={k} id={`arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" className={arrowFill[k]} />
              </marker>
            ))}
          </defs>

          {/* column numbers */}
          {stages.map((_, i) => (
            <text key={i} x={LABEL_W + i * COL_W + COL_W / 2} y={20} textAnchor="middle" className="fill-ink-400 font-mono text-[11px]">
              {i + 1}
            </text>
          ))}

          {/* swimlanes */}
          {allLanes.map((l, li) => (
            <g key={l.owner}>
              <rect
                x={0}
                y={TOP + li * LANE_H}
                width={width}
                height={LANE_H}
                className={cn(li % 2 === 0 ? "fill-paper-50" : "fill-paper-0", l.ids.length === 0 && "fill-amber-100/40")}
              />
              <line x1={0} x2={width} y1={TOP + li * LANE_H} y2={TOP + li * LANE_H} className="stroke-paper-200" strokeWidth={1} />
              <text x={12} y={TOP + li * LANE_H + LANE_H / 2 - 4} className="fill-charcoal-900 text-[12px] font-semibold">
                {wrap(l.owner, 20).map((line, k) => (
                  <tspan key={k} x={12} dy={k === 0 ? 0 : 14}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          ))}
          <line x1={LABEL_W - 6} x2={LABEL_W - 6} y1={TOP} y2={height - 8} className="stroke-paper-200" strokeWidth={1} />

          {/* edges */}
          {edges.map((e) => {
            const a = pos[e.from];
            const b = pos[e.to];
            const st = edgeState(e.to);
            const d = elbow(a.x + NODE_W, a.cy, b.x, b.cy);
            return (
              <g key={e.key}>
                <path
                  d={d}
                  fill="none"
                  strokeWidth={st === "idle" ? 1.5 : 2}
                  strokeDasharray={st === "active" ? "6 5" : undefined}
                  markerEnd={`url(#arrow-${st})`}
                  className={cn(edgeColor[st], st === "active" && "flow-dash")}
                />
                {st === "active" && showToken && (
                  <circle r={5} className="fill-blue-500">
                    <animateMotion dur="0.9s" repeatCount="indefinite" path={d} />
                  </circle>
                )}
              </g>
            );
          })}

          {/* reversal edges */}
          {hasReversal &&
            reversal.map((_, r) => {
              if (revStatuses[r] === "pending") return null;
              const from = r === 0 ? pos[failIdx >= 0 ? failIdx : holdIdx] : revPos[r - 1];
              if (!from) return null;
              const to = revPos[r];
              const d =
                r === 0
                  ? `M${from.x + NODE_W / 2},${from.cy + NODE_H / 2} V${to.cy} H${to.x}`
                  : elbow(from.x + NODE_W, from.cy, to.x, to.cy);
              return (
                <path key={r} d={d} fill="none" strokeWidth={2} strokeDasharray="5 4" markerEnd="url(#arrow-warn)" className="stroke-amber-500" />
              );
            })}

          {/* stage nodes */}
          {stages.map((st, i) => {
            const s = statuses[i];
            const { x, cy } = pos[i];
            const y = cy - NODE_H / 2;
            const style = nodeStyle[s];
            const lines = wrap(st.label);
            const cut = 12;
            return (
              <g key={st.id} className={cn(s === "active" && showToken && "animate-pulse")}>
                {st.shape === "decision" ? (
                  <polygon
                    points={`${x + cut},${y} ${x + NODE_W - cut},${y} ${x + NODE_W},${cy} ${x + NODE_W - cut},${y + NODE_H} ${x + cut},${y + NODE_H} ${x},${cy}`}
                    strokeWidth={2}
                    className={cn(style.box, "transition-colors duration-300")}
                  />
                ) : (
                  <>
                    <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={8} strokeWidth={st.shape === "commit" ? 3 : 2} className={cn(style.box, "transition-colors duration-300")} />
                    {st.shape === "commit" && (
                      <rect x={x + 4} y={y + 4} width={NODE_W - 8} height={NODE_H - 8} rx={5} fill="none" strokeWidth={1} className={style.box.split(" ")[1]} />
                    )}
                  </>
                )}
                <text x={x + NODE_W / 2} y={cy - ((lines.length - 1) * 13) / 2 + 4} textAnchor="middle" className={cn(style.text, "text-[11.5px] font-medium")}>
                  {lines.map((line, k) => (
                    <tspan key={k} x={x + NODE_W / 2} dy={k === 0 ? 0 : 13}>
                      {line}
                    </tspan>
                  ))}
                </text>
                {(s === "done" || s === "failed" || s === "held") && (
                  <g transform={`translate(${x + NODE_W - 8}, ${y - 6})`}>
                    <circle r={9} className={s === "done" ? "fill-emerald-500" : s === "failed" ? "fill-rose-500" : "fill-amber-500"} />
                    <text textAnchor="middle" y={4} className="fill-paper-0 text-[11px] font-bold">
                      {s === "done" ? "✓" : s === "failed" ? "✕" : "!"}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* reversal nodes */}
          {reversal.map((rv, r) => {
            const s = revStatuses[r];
            if (s === "pending") return null;
            const { x, cy } = revPos[r];
            const lines = wrap(rv.label);
            return (
              <g key={rv.label} className={cn(s === "active" && "animate-pulse")}>
                <rect x={x} y={cy - NODE_H / 2} width={NODE_W} height={NODE_H} rx={8} strokeWidth={2} strokeDasharray="5 3" className="fill-amber-100 stroke-amber-500" />
                <text x={x + NODE_W / 2} y={cy - ((lines.length - 1) * 13) / 2 + 4} textAnchor="middle" className="fill-charcoal-900 text-[11.5px] font-medium">
                  {lines.map((line, k) => (
                    <tspan key={k} x={x + NODE_W / 2} dy={k === 0 ? 0 : 13}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-paper-200 bg-paper-0 p-4">
          {!live && (
            <p className="text-[13px] leading-relaxed text-ink-500">
              Choose a scenario above. The chart animates in step with the side-by-side view — switch tabs at any point and the run
              carries on.
            </p>
          )}
          {live && activeStage && (runner.phase === "running" || runner.phase === "held") && (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">
                Stage {runner.current + 1} of {stages.length} · {runner.paused ? "paused" : runner.phase === "held" ? "held" : "running"}
              </p>
              <p className="mt-1 text-[15px] font-semibold text-charcoal-900">{activeStage.label}</p>
              <p className="mt-0.5 text-[12px] text-ink-500">{activeStage.systemIds.map((id) => byId[id]?.name).join(" · ")}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-700">
                {statuses[runner.current] === "held" ? sc.holdDetail : activeStage.detail}
              </p>
              <p className="mt-2 rounded-lg bg-paper-50 px-3 py-2 text-[12.5px] text-ink-700">
                <strong className="font-semibold text-charcoal-900">Client sees:</strong> {activeStage.clientSays}
              </p>
            </>
          )}
          {live && runner.phase === "held" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[12.5px] font-medium text-charcoal-900">Checker decision:</span>
              <button type="button" onClick={() => runner.decide("approve")} className="flex items-center gap-1.5 rounded-lg bg-charcoal-900 px-3 py-1.5 text-[12.5px] font-medium text-paper-0 hover:bg-charcoal-800">
                <Check size={13} /> Approve exception
              </button>
              <button type="button" onClick={() => runner.decide("decline")} className="flex items-center gap-1.5 rounded-lg border border-paper-200 bg-paper-0 px-3 py-1.5 text-[12.5px] font-medium text-ink-700 hover:bg-paper-50">
                <X size={13} /> Decline
              </button>
            </div>
          )}
          {live && runner.phase === "completed" && (
            <p className="text-[14px] font-semibold text-emerald-600">Finalised — every stage passed, both sides of the books agree.</p>
          )}
          {live && (runner.phase === "failed" || runner.phase === "declined") && (
            <p className="text-[14px] font-semibold text-rose-600">
              Stopped and reversed — follow the dashed amber path: nothing moved.
            </p>
          )}
          {live && runner.phase === "failed" && sc.failDetail && (
            <p className="mt-2 text-[13px] leading-relaxed text-ink-700">{sc.failDetail}</p>
          )}
          {live && (runner.phase === "failed" || runner.phase === "declined") && (
            <ul className="mt-2 space-y-1 text-[12.5px] text-ink-700">
              {reversal.map((rv) => (
                <li key={rv.label}>
                  <strong className="font-semibold text-charcoal-900">{rv.label}:</strong> {rv.detail}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-paper-200 bg-paper-0 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">How to read it</p>
          <ul className="mt-2 space-y-1.5 text-[12.5px] text-ink-700">
            <li className="flex items-center gap-2"><svg width="26" height="14"><polygon points="5,1 21,1 25,7 21,13 5,13 1,7" className="fill-paper-0 stroke-ink-500" strokeWidth={1.5} /></svg>A check that can stop the flow</li>
            <li className="flex items-center gap-2"><svg width="26" height="14"><rect x="1" y="1" width="24" height="12" rx="3" className="fill-paper-0 stroke-ink-500" strokeWidth={2.5} /></svg>The settlement commit — both legs or neither</li>
            <li className="flex items-center gap-2"><svg width="26" height="14"><circle cx="13" cy="7" r="5" className="fill-blue-500" /></svg>Work moving between systems now</li>
            <li className="flex items-center gap-2"><svg width="26" height="14"><line x1="1" y1="7" x2="25" y2="7" className="stroke-amber-500" strokeWidth={2} strokeDasharray="4 3" /></svg>Reversal path when a check fails or is declined</li>
            <li className="text-ink-500">Lanes are the organisations involved; a line crossing lanes is a hand-off.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
