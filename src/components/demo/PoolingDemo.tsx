"use client";

import { Columns2, Bell, Check, Clock, Pause, Play, RotateCcw, ShieldCheck, TriangleAlert, X, Zap, Workflow } from "lucide-react";
import { Badge } from "@/components/Badge";
import { cn, usd } from "@/lib/utils";
import { BackendPanel } from "./BackendPanel";
import { FlowChart } from "./FlowChart";
import { ClientProgress } from "./ClientProgress";
import { useState } from "react";
import { useStageRunner, type Scenario, type StageDef, type SystemDef } from "./useStageRunner";

const systems: SystemDef[] = [
  { id: "console", name: "HSBCnet liquidity console", owner: "Client channel", role: "Policy set-up, approvals and alerts" },
  { id: "tms", name: "Client TMS / ERP", owner: "Client channel", role: "Receives positions and sweep events by API" },
  { id: "policy", name: "Policy & mandate engine", owner: "GPS · Digital Money", role: "Floors, targets, caps — decides when to move" },
  { id: "tds", name: "TDS ledger", owner: "GPS · Digital Money", role: "Reserve and atomic transfer between entity wallets" },
  { id: "position", name: "Real-time position service", owner: "GPS · Liquidity Management", role: "Live balance per entity from TDS ledger and core" },
  { id: "pooling", name: "Pooling & interest allocation", owner: "GPS · Liquidity Management", role: "Tracks intercompany positions and allocates interest" },
  { id: "entitle", name: "Entitlements & corridor register", owner: "Controls", role: "Approved entities; corridors with legal sign-off" },
  { id: "limits", name: "Limits & exposure service", owner: "Controls", role: "Per-transfer limit, daily group cap, hub reserve" },
  { id: "screen", name: "Financial crime screening", owner: "Controls", role: "Intra-group flows are still screened" },
  { id: "core", name: "Core banking & general ledger", owner: "Books of record", role: "Deposit accounts and accounting entries" },
  { id: "cases", name: "Case management & audit", owner: "Books of record", role: "Owns anything held; immutable decision trail" },
];

const groups = [
  { owner: "Client channel", ids: ["console", "tms"] },
  { owner: "GPS · Digital Money", ids: ["policy", "tds"] },
  { owner: "GPS · Liquidity Management", ids: ["position", "pooling"] },
  { owner: "Controls", ids: ["entitle", "limits", "screen"] },
  { owner: "Books of record", ids: ["core", "cases"] },
];

const milestones = [
  "Shortfall detected",
  "Policy and limits checked",
  "Compliance-checked",
  "Funds moved",
  "Recorded and reported",
];

const POLICY = { floor: 500_000, target: 2_000_000, cap: 3_000_000, hubReserve: 5_000_000 };

function stages(o: {
  entity: string;
  code: string;
  cause: string;
  lowBalance: number;
  amount: number;
  sweptBefore: number;
  limitsDetail: string;
}): StageDef[] {
  return [
    { id: "detect", label: "Balance change detected", systemIds: ["position"], milestone: 0, detail: `${o.cause} — ${o.entity} now ${usd(o.lowBalance)}`, clientSays: `${o.entity}'s balance just dropped below your ${usd(POLICY.floor)} floor.` },
    { id: "policy", shape: "decision", label: "Policy evaluated", systemIds: ["policy"], milestone: 0, detail: `Floor breached → top up to ${usd(POLICY.target)} → requirement ${usd(o.amount)} from the Hong Kong hub`, clientSays: `Your pooling policy says: top ${o.entity} up to ${usd(POLICY.target)}.` },
    { id: "eligibility", shape: "decision", label: "Entity & corridor eligibility", systemIds: ["entitle"], milestone: 1, detail: `${o.entity} is an approved group entity; HK→${o.code} corridor approved with a settlement-finality opinion on file`, clientSays: `Checking ${o.entity} is an approved destination.` },
    { id: "limits", shape: "decision", label: "Limits & caps", systemIds: ["limits"], milestone: 1, detail: o.limitsDetail, clientSays: "Checking this stays inside the limits you set." },
    { id: "screen", shape: "decision", label: "Financial crime screening", systemIds: ["screen"], milestone: 2, detail: "Intra-group transfer screened — clear", clientSays: "Running standard compliance checks." },
    { id: "reserve", label: "Hub funds reserved", systemIds: ["tds"], milestone: 3, detail: `${usd(o.amount)} reserved on the Hong Kong hub wallet`, clientSays: `Reserving ${usd(o.amount)} in Hong Kong.` },
    { id: "transfer", shape: "commit", label: "Atomic transfer", systemIds: ["tds", "policy"], milestone: 3, ms: 1200, detail: `Debit Hong Kong and credit ${o.entity} in one transaction — both or neither`, clientSays: `Moving the funds to ${o.entity}.` },
    { id: "post", label: "Core posting & intercompany position", systemIds: ["core", "pooling"], milestone: 4, detail: `Accounts posted; intercompany loan HK→${o.code} ${usd(o.amount)} recorded for interest allocation`, clientSays: "Recording the intercompany position." },
    { id: "recon", label: "Reconciliation & audit", systemIds: ["core", "cases"], milestone: 4, detail: "TDS ledger, core banking and pooling records agree; decision trail sealed", clientSays: "Double-checking every record matches." },
    { id: "notify", label: "Treasury notified", systemIds: ["tms", "console"], milestone: 4, detail: `Position pushed to the client's TMS by API; added to the overnight sweep report (today: ${usd(o.sweptBefore + o.amount)} swept)`, clientSays: "Updating your treasury system." },
  ];
}

interface PoolScenario extends Scenario {
  title: string;
  entityKey: "sg" | "uk";
  amount: number;
  lowBalance: number;
  sweptBefore: number;
  exception?: boolean;
}

const scenarios: PoolScenario[] = [
  {
    key: "auto",
    title: "02:15 — Singapore dips below its floor",
    entityKey: "sg",
    amount: 1_620_000,
    lowBalance: 380_000,
    sweptBefore: 0,
    clockStart: { h: 2, m: 15, label: "Mon 14 Sep" },
    stages: stages({
      entity: "Meridian Singapore",
      code: "SG",
      cause: "Singapore payroll batch of US$1,770,000 debited",
      lowBalance: 380_000,
      amount: 1_620_000,
      sweptBefore: 0,
      limitsDetail: "Per-transfer ≤ US$2m ✓ · today's sweeps US$1.62m of the US$3m cap ✓ · hub keeps ≥ US$5m reserve ✓",
    }),
  },
  {
    key: "cap",
    title: "Exception — UK top-up would breach the cap",
    entityKey: "uk",
    amount: 1_590_000,
    lowBalance: 410_000,
    sweptBefore: 1_620_000,
    exception: true,
    clockStart: { h: 5, m: 5, label: "Mon 14 Sep" },
    holdAt: "limits",
    holdDetail:
      "Would take today's automated sweeps to US$3,210,000 — above the US$3,000,000 cap the client set. Automation stops; a named checker must decide.",
    approvedDetail:
      "Checker TRS-022 approved a one-off exception from HSBCnet mobile — recorded separately from automated activity.",
    reversal: [
      { label: "Funding requirement cancelled", systemIds: ["policy", "limits"], detail: "Nothing reserved or moved; Meridian UK stays at US$410,000 and the alert stays open for the morning" },
      { label: "Decision recorded", systemIds: ["cases"], detail: "Checker's decline retained on the case for audit and the next policy review" },
    ],
    stages: stages({
      entity: "Meridian UK",
      code: "UK",
      cause: "Bond coupon of US$1,590,000 paid",
      lowBalance: 410_000,
      amount: 1_590_000,
      sweptBefore: 1_620_000,
      limitsDetail: "Per-transfer ≤ US$2m ✓ · daily cap exceeded — approved as a one-off by checker TRS-022 · hub reserve ✓",
    }),
  },
];

export function PoolingDemo() {
  const runner = useStageRunner();
  const [tab, setTab] = useState<"side" | "flow">("side");
  const { scenario, statuses, phase, paused, clock } = runner;
  const sc = scenario as PoolScenario | null;
  const done = (id: string) => (sc ? statuses[sc.stages.findIndex((s) => s.id === id)] === "done" : false);

  const startBalances = { hk: 32_400_000, sg: 2_150_000, uk: 2_000_000 };
  const bal = { ...startBalances };
  let reserved = 0;
  let swept = sc?.sweptBefore ?? 0;
  if (sc) {
    if (sc.entityKey === "uk") bal.sg = 2_000_000;
    if (sc.sweptBefore) bal.hk -= sc.sweptBefore;
    if (done("detect")) bal[sc.entityKey] = sc.lowBalance;
    if (done("reserve") && !done("transfer")) reserved = sc.amount;
    if (done("transfer")) {
      bal.hk -= sc.amount;
      bal[sc.entityKey] += sc.amount;
      swept += sc.amount;
    }
  }

  const feed = sc ? sc.stages.filter((_, i) => statuses[i] === "done").map((s) => s.clientSays) : [];

  const entities = [
    { key: "hk" as const, name: "Meridian Holdings", place: "Hong Kong · hub" },
    { key: "sg" as const, name: "Meridian Singapore", place: "Singapore" },
    { key: "uk" as const, name: "Meridian UK", place: "United Kingdom" },
  ];

  const running = phase === "running";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {scenarios.map((s) => (
          <button
            key={s.key}
            type="button"
            disabled={running || phase === "held"}
            onClick={() => runner.start(s)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              sc?.key === s.key ? "border-brand-500 bg-brand-50 text-charcoal-900" : "border-paper-200 bg-paper-0 text-ink-700 hover:bg-paper-50"
            )}
          >
            {s.exception ? <TriangleAlert size={14} className="text-amber-500" /> : <Zap size={14} className="text-emerald-600" />}
            {s.title}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={runner.togglePause} disabled={!running} className="flex items-center gap-1.5 rounded-lg border border-paper-200 bg-paper-0 px-3 py-2 text-[12.5px] font-medium text-ink-700 hover:bg-paper-50 disabled:opacity-40">
            {paused ? <Play size={13} /> : <Pause size={13} />}
            {paused ? "Resume" : "Pause to explain"}
          </button>
          <button type="button" onClick={runner.reset} className="flex items-center gap-1.5 rounded-lg border border-paper-200 bg-paper-0 px-3 py-2 text-[12.5px] font-medium text-ink-700 hover:bg-paper-50">
            <RotateCcw size={13} />
            Reset
          </button>
        </div>
      </div>

      <div role="tablist" aria-label="Demo view" className="inline-flex rounded-lg border border-paper-200 bg-paper-50 p-1">
        {([
          ["side", "Side-by-side view"],
          ["flow", "Flow chart"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors",
              tab === key ? "bg-paper-0 text-charcoal-900 shadow-sm" : "text-ink-500 hover:text-charcoal-900"
            )}
          >
            {key === "side" ? <Columns2 size={13} /> : <Workflow size={13} />}
            {label}
          </button>
        ))}
      </div>

      {tab === "flow" && <FlowChart runner={runner} lanes={groups} systems={systems} fallback={scenarios[0]} />}

      <div hidden={tab !== "side"} className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        {/* CLIENT SIDE */}
        <div className="rounded-2xl border border-paper-200 bg-paper-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">What the client sees</p>
            <Badge tone="neutral">HSBCnet · Liquidity console (mock)</Badge>
          </div>

          <div className="rounded-xl border border-paper-200 bg-paper-0 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold text-charcoal-900">Meridian Group · automated pooling</p>
                <p className="text-[12px] text-ink-500">
                  Floor {usd(POLICY.floor)} · top up to {usd(POLICY.target)} · daily cap {usd(POLICY.cap)}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-ink-500">
                <Clock size={13} />
                {sc ? `${sc.clockStart.label} · ${clock} HKT` : "Choose a scenario"}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {entities.map((e) => {
                const below = e.key !== "hk" && bal[e.key] < POLICY.floor;
                const receiving = sc?.entityKey === e.key && done("reserve") && !done("transfer");
                return (
                  <div
                    key={e.key}
                    className={cn(
                      "rounded-lg border p-2.5 transition-colors duration-300",
                      e.key === "hk" ? "border-brand-100 bg-brand-50" : below ? "border-amber-500 bg-amber-100" : "border-paper-200 bg-paper-50"
                    )}
                  >
                    <p className="text-[11.5px] font-semibold text-charcoal-900">{e.name}</p>
                    <p className="text-[10.5px] text-ink-500">{e.place}</p>
                    <p className="mt-1.5 font-mono text-[14px] font-semibold tabular-nums text-charcoal-900">{usd(bal[e.key])}</p>
                    {e.key === "hk" && reserved > 0 && <p className="animate-pulse text-[10.5px] font-medium text-blue-600">{usd(reserved)} reserved</p>}
                    {below && !receiving && <p className="text-[10.5px] font-medium text-amber-500">Below floor</p>}
                    {receiving && <p className="animate-pulse text-[10.5px] font-medium text-blue-600">Incoming…</p>}
                  </div>
                );
              })}
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-ink-500">
                <span>Automated sweeps today</span>
                <span className="font-mono">
                  {usd(swept)} / {usd(POLICY.cap)}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-100">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", swept > POLICY.cap ? "bg-rose-500" : "bg-brand-500")}
                  style={{ width: `${Math.min(100, (swept / POLICY.cap) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3">
            <ClientProgress runner={runner} milestones={milestones} />
          </div>

          {phase === "held" && sc && (
            <div className="mt-3 rounded-xl border border-amber-500 bg-amber-100 p-3.5">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-charcoal-900">
                <Bell size={14} className="text-amber-500" />
                Approval needed · push notification sent to checker
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-charcoal-900">
                Topping up Meridian UK by {usd(sc.amount)} would take today&apos;s automated sweeps to{" "}
                {usd(sc.sweptBefore + sc.amount)}, above your {usd(POLICY.cap)} cap. Nothing has moved. Approve a one-off exception?
              </p>
              <p className="mt-1 text-[11px] text-ink-500">Signed in as checker TRS-022</p>
              <div className="mt-2.5 flex gap-2">
                <button type="button" onClick={() => runner.decide("approve")} className="flex items-center gap-1.5 rounded-lg bg-charcoal-900 px-3 py-2 text-[12.5px] font-medium text-paper-0 hover:bg-charcoal-800">
                  <Check size={13} />
                  Approve exception
                </button>
                <button type="button" onClick={() => runner.decide("decline")} className="flex items-center gap-1.5 rounded-lg border border-paper-200 bg-paper-0 px-3 py-2 text-[12.5px] font-medium text-ink-700 hover:bg-paper-50">
                  <X size={13} />
                  Decline
                </button>
              </div>
            </div>
          )}

          {phase === "completed" && sc && (
            <div className="mt-3 rounded-xl border border-emerald-500 bg-emerald-100 p-3.5">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-charcoal-900">
                <ShieldCheck size={15} className="text-emerald-600" />
                {sc.exception ? "Funded after your approval" : "Funded automatically — nobody was awake"}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-charcoal-900">
                {sc.exception
                  ? "The cap did its job: automation stopped, a named person decided, and the approval is on the audit trail."
                  : "Singapore is back at US$2m before the working day starts. No sweep cycle was waited for and no transfer was instructed."}
              </p>
            </div>
          )}
          {phase === "declined" && (
            <div className="mt-3 rounded-xl border border-rose-500 bg-rose-100 p-3.5">
              <p className="text-[13px] font-semibold text-charcoal-900">Declined — nothing moved</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-charcoal-900">
                Meridian UK stays below its floor and the alert stays open for your team this morning. Your decision is recorded.
              </p>
            </div>
          )}

          {feed.length > 0 && (
            <div className="mt-3 rounded-xl border border-paper-200 bg-paper-0 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Automation activity</p>
              <ul className="mt-1.5 space-y-1">
                {feed.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-ink-700">
                    <Check size={12} className="mt-1 shrink-0 text-emerald-600" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* BANK SIDE */}
        <div className="rounded-2xl border border-charcoal-800 bg-charcoal-950 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-paper-200">What the bank is doing</p>
            <span className="font-mono text-[11px] text-ink-400">{sc ? `${clock} HKT` : ""}</span>
          </div>
          <BackendPanel runner={runner} systems={systems} groups={groups} />
        </div>
      </div>
    </div>
  );
}
