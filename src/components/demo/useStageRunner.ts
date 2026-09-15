"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type StageStatus = "pending" | "active" | "done" | "failed" | "held" | "reversed";
export type Tone = "info" | "pass" | "warn" | "fail" | "settle";

export interface SystemDef {
  id: string;
  name: string;
  owner: string;
  role: string;
}

export interface StageDef {
  id: string;
  label: string;
  systemIds: string[];
  detail: string;
  /** Index into the client-facing milestones this backend stage rolls up to. */
  milestone: number;
  /** Plain-language line the client sees while this stage is running. */
  clientSays: string;
  ms?: number;
}

export interface ReversalDef {
  label: string;
  systemIds: string[];
  detail: string;
}

export interface Scenario {
  key: string;
  stages: StageDef[];
  /** Stage that fails, triggering the reversal steps. */
  failAt?: string;
  failDetail?: string;
  /** Stage that stops for a human decision. */
  holdAt?: string;
  holdDetail?: string;
  approvedDetail?: string;
  reversal?: ReversalDef[];
  clockStart: { h: number; m: number; label: string };
}

export type Phase = "idle" | "running" | "held" | "completed" | "failed" | "declined";

export interface LogLine {
  time: string;
  text: string;
  tone: Tone;
}

const CANCELLED = Symbol("cancelled");

function formatClock(start: Scenario["clockStart"], elapsedMs: number) {
  const total = start.h * 3600 + start.m * 60 + Math.floor(elapsedMs / 1000);
  const h = Math.floor(total / 3600) % 24;
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Drives one scenario through its backend stages. Both the client panel and the
 * bank panel read from this single state, so they can never drift out of sync.
 */
export function useStageRunner() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [statuses, setStatuses] = useState<StageStatus[]>([]);
  const [reversalStatuses, setReversalStatuses] = useState<StageStatus[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [log, setLog] = useState<LogLine[]>([]);
  const [current, setCurrent] = useState(-1);

  const runId = useRef(0);
  const pausedRef = useRef(false);
  const elapsedRef = useRef(0);
  const decisionRef = useRef<((d: "approve" | "decline") => void) | null>(null);

  useEffect(() => () => {
    runId.current++;
  }, []);

  // The clock only advances while work is genuinely in progress.
  useEffect(() => {
    if (phase !== "running" || paused) return;
    const t = setInterval(() => {
      elapsedRef.current += 100;
      setElapsed(elapsedRef.current);
    }, 100);
    return () => clearInterval(t);
  }, [phase, paused]);

  const wait = useCallback(async (ms: number, id: number) => {
    let remaining = ms;
    while (remaining > 0) {
      if (runId.current !== id) throw CANCELLED;
      const step = Math.min(100, remaining);
      await new Promise((r) => setTimeout(r, step));
      if (!pausedRef.current) remaining -= step;
    }
    if (runId.current !== id) throw CANCELLED;
  }, []);

  const reset = useCallback(() => {
    runId.current++;
    pausedRef.current = false;
    elapsedRef.current = 0;
    decisionRef.current = null;
    setPaused(false);
    setElapsed(0);
    setScenario(null);
    setStatuses([]);
    setReversalStatuses([]);
    setLog([]);
    setCurrent(-1);
    setPhase("idle");
  }, []);

  const start = useCallback(
    async (sc: Scenario) => {
      const id = ++runId.current;
      pausedRef.current = false;
      elapsedRef.current = 0;
      setPaused(false);
      setElapsed(0);
      setScenario(sc);
      setStatuses(sc.stages.map(() => "pending"));
      setReversalStatuses((sc.reversal ?? []).map(() => "pending"));
      setLog([]);
      setCurrent(-1);
      setPhase("running");

      const push = (text: string, tone: Tone) =>
        setLog((l) => [...l, { time: formatClock(sc.clockStart, elapsedRef.current), text, tone }]);
      const mark = (i: number, s: StageStatus) =>
        setStatuses((prev) => prev.map((v, idx) => (idx === i ? s : v)));

      const runReversal = async () => {
        for (let r = 0; r < (sc.reversal ?? []).length; r++) {
          const step = sc.reversal![r];
          setReversalStatuses((prev) => prev.map((v, idx) => (idx === r ? "active" : v)));
          await wait(850, id);
          setReversalStatuses((prev) => prev.map((v, idx) => (idx === r ? "reversed" : v)));
          push(`${step.label} — ${step.detail}`, "warn");
        }
      };

      try {
        for (let i = 0; i < sc.stages.length; i++) {
          const stage = sc.stages[i];
          setCurrent(i);
          mark(i, "active");
          await wait(stage.ms ?? 950, id);

          if (sc.failAt === stage.id) {
            mark(i, "failed");
            push(`${stage.label} FAILED — ${sc.failDetail ?? "check did not pass"}`, "fail");
            await runReversal();
            setPhase("failed");
            return;
          }

          if (sc.holdAt === stage.id) {
            mark(i, "held");
            push(`${stage.label} HELD — ${sc.holdDetail ?? "needs a human decision"}`, "warn");
            setPhase("held");
            const decision = await new Promise<"approve" | "decline">((res) => {
              decisionRef.current = res;
            });
            decisionRef.current = null;
            if (runId.current !== id) return;
            if (decision === "decline") {
              mark(i, "failed");
              push("Checker declined the exception — nothing will move.", "fail");
              setPhase("running");
              await runReversal();
              setPhase("declined");
              return;
            }
            mark(i, "done");
            push(sc.approvedDetail ?? "Exception approved by checker.", "pass");
            setPhase("running");
            continue;
          }

          mark(i, "done");
          const tone: Tone = /commit|settled|transfer/i.test(stage.label) ? "settle" : "pass";
          push(`${stage.label} — ${stage.detail}`, tone);
        }
        setCurrent(sc.stages.length);
        setPhase("completed");
      } catch (e) {
        if (e !== CANCELLED) throw e;
      }
    },
    [wait]
  );

  const togglePause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  }, []);

  const decide = useCallback((d: "approve" | "decline") => {
    decisionRef.current?.(d);
  }, []);

  const clock = scenario ? formatClock(scenario.clockStart, elapsed) : "—";

  return {
    scenario,
    statuses,
    reversalStatuses,
    phase,
    paused,
    elapsed,
    clock,
    log,
    current,
    start,
    reset,
    togglePause,
    decide,
  };
}

export type Runner = ReturnType<typeof useStageRunner>;
