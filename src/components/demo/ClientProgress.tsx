"use client";

import { Check, Loader2, PauseCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Runner } from "./useStageRunner";

/**
 * The client never sees ten backend stages or the name of a control that fired —
 * they see a handful of plain milestones that always show something is moving,
 * and exactly where their money stands.
 */
export function ClientProgress({ runner, milestones }: { runner: Runner; milestones: string[] }) {
  const { scenario, statuses, current, phase, paused, elapsed } = runner;
  if (!scenario || phase === "idle") return null;

  const stages = scenario.stages;
  const activeStage = current >= 0 && current < stages.length ? stages[current] : null;
  const failedIdx = statuses.findIndex((s) => s === "failed" || s === "held");
  const reachedMilestone =
    phase === "completed"
      ? milestones.length
      : activeStage
        ? activeStage.milestone
        : 0;

  const milestoneState = (m: number) => {
    if (failedIdx >= 0 && stages[failedIdx].milestone === m) {
      return statuses[failedIdx] === "held" ? "held" : "failed";
    }
    if (m < reachedMilestone) return "done";
    if (m === reachedMilestone && phase === "running") return "active";
    return "pending";
  };

  const seconds = (elapsed / 1000).toFixed(1);

  return (
    <div className="rounded-xl border border-paper-200 bg-paper-0 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-semibold text-charcoal-900">
          {phase === "completed"
            ? "Completed"
            : phase === "failed" || phase === "declined"
              ? "Not completed"
              : phase === "held"
                ? "Waiting for your approval"
                : paused
                  ? "Paused"
                  : "In progress"}
        </p>
        <span className="font-mono text-[11px] text-ink-500">{seconds}s</span>
      </div>

      {/* A thin indeterminate bar while anything is running, so the screen is never still. */}
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-paper-100">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            phase === "completed" && "w-full bg-emerald-500",
            (phase === "failed" || phase === "declined") && "w-full bg-rose-500",
            phase === "held" && "w-2/3 bg-amber-500",
            phase === "running" && "bg-blue-500"
          )}
          style={
            phase === "running"
              ? { width: `${Math.max(8, ((current + 0.5) / stages.length) * 100)}%` }
              : undefined
          }
        />
      </div>

      <ol className="mt-3 space-y-2">
        {milestones.map((label, m) => {
          const st = milestoneState(m);
          return (
            <li key={label} className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  st === "done" && "border-emerald-500 bg-emerald-500 text-paper-0",
                  st === "active" && "border-blue-500 text-blue-600",
                  st === "failed" && "border-rose-500 bg-rose-500 text-paper-0",
                  st === "held" && "border-amber-500 bg-amber-100 text-amber-500",
                  st === "pending" && "border-paper-200 text-ink-400"
                )}
              >
                {st === "done" && <Check size={11} strokeWidth={3} />}
                {st === "active" && <Loader2 size={11} className={cn(!paused && "animate-spin")} />}
                {st === "failed" && <X size={11} strokeWidth={3} />}
                {st === "held" && <PauseCircle size={11} />}
              </span>
              <span
                className={cn(
                  "text-[12.5px]",
                  st === "pending" ? "text-ink-400" : "font-medium text-charcoal-900"
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      {phase === "running" && activeStage && (
        <p className="mt-3 rounded-lg bg-blue-100 px-3 py-2 text-[12px] leading-relaxed text-charcoal-900">
          {activeStage.clientSays}
        </p>
      )}
    </div>
  );
}
