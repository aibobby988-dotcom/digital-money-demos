"use client";

import { Columns2, ArrowDownLeft, ArrowUpRight, Clock, Pause, Play, RotateCcw, ShieldCheck, TriangleAlert, Workflow } from "lucide-react";
import { Badge } from "@/components/Badge";
import { cn, units, usd } from "@/lib/utils";
import { BackendPanel } from "./BackendPanel";
import { FlowChart } from "./FlowChart";
import { ClientProgress } from "./ClientProgress";
import { useState } from "react";
import { useStageRunner, type Scenario, type StageDef, type SystemDef } from "./useStageRunner";

const systems: SystemDef[] = [
  { id: "channel", name: "HSBCnet / Treasury API", owner: "Client channel", role: "Where the treasurer or their ERP places the order" },
  { id: "reporting", name: "Client reporting & ERP feed", owner: "Client channel", role: "Contract note, API callback, statement" },
  { id: "entitle", name: "Entitlements & approvals", owner: "Controls", role: "Who may deal, mandate limits, maker-checker" },
  { id: "screen", name: "Financial crime screening", owner: "Controls", role: "Sanctions, AML and PEP checks before value moves" },
  { id: "oms", name: "Fund order management", owner: "HSBC Asset Management", role: "Investor eligibility, dealing rules, concentration limits" },
  { id: "buffer", name: "Fund cash buffer", owner: "HSBC Asset Management", role: "Tokenised deposits the fund holds to pay redemptions while markets are shut" },
  { id: "nav", name: "NAV & pricing", owner: "HSBC Asset Management", role: "Strikes the unit price the order settles at" },
  { id: "registry", name: "Transfer agent & unit register", owner: "HSBC Securities Services", role: "Issues, reserves and cancels fund units — the fund side" },
  { id: "tds", name: "TDS ledger", owner: "GPS · Digital Money", role: "Tokenised deposits: escrow and transfer — the payment side" },
  { id: "settle", name: "Atomic settlement engine", owner: "GPS · Digital Money", role: "Commits both sides together, or neither" },
  { id: "core", name: "Core banking & general ledger", owner: "Books of record", role: "Deposit accounts and accounting entries" },
  { id: "recon", name: "Reconciliation, audit & cases", owner: "Books of record", role: "Ledger, core and register must agree; exceptions get an owner" },
];

const groups = [
  { owner: "Client channel", ids: ["channel", "reporting"] },
  { owner: "Controls", ids: ["entitle", "screen"] },
  { owner: "HSBC Asset Management", ids: ["oms", "buffer", "nav"] },
  { owner: "HSBC Securities Services", ids: ["registry"] },
  { owner: "GPS · Digital Money", ids: ["tds", "settle"] },
  { owner: "Books of record", ids: ["core", "recon"] },
];

const milestones = [
  "Order received",
  "Authorised and compliance-checked",
  "Fund rules checked and price set",
  "Settling cash and units together",
  "Confirmed",
];

function subscribeStages(amount: number): StageDef[] {
  return [
    { id: "instruct", label: "Instruction received", systemIds: ["channel"], milestone: 0, detail: `Subscribe ${usd(amount)} into the tokenised share class; request signed with the client's certificate`, clientSays: "We have your order and are validating it." },
    { id: "entitle", shape: "decision", label: "Entitlements & maker-checker", systemIds: ["entitle"], milestone: 1, detail: "Maker TRS-014 and checker TRS-022 authorised; within the US$75m investment mandate", clientSays: "Confirming the people and limits on your mandate." },
    { id: "screen", shape: "decision", label: "Financial crime screening", systemIds: ["screen"], milestone: 1, detail: "Investing entity, fund and counterparties screened — clear", clientSays: "Running standard security and compliance checks." },
    { id: "eligibility", shape: "decision", label: "Investor eligibility & dealing rules", systemIds: ["oms"], milestone: 2, detail: "Professional-investor class; within per-investor concentration limit; class permits 24/7 dealing", clientSays: "Checking the fund's rules for this order." },
    { id: "price", label: "Price struck", systemIds: ["nav"], milestone: 2, detail: `Constant-NAV class at US$1.0000 per unit → ${units(amount)} units`, clientSays: `Price confirmed: ${units(amount)} units at US$1.0000.` },
    { id: "cashlock", label: "Payment side locked in escrow", systemIds: ["tds"], milestone: 3, detail: `${usd(amount)} of tokenised deposits moved to settlement escrow — not yet released to the fund`, clientSays: `${usd(amount)} is held for settlement. It stays yours until the units are ready.` },
    { id: "assetreserve", label: "Fund side reserved in register", systemIds: ["registry"], milestone: 3, detail: `${units(amount)} units reserved for issue to Party A Holdings (HK)`, clientSays: "Reserving your fund units." },
    { id: "commit", shape: "commit", joinsFrom: ["cashlock"], label: "Atomic DvP commit", systemIds: ["settle", "tds", "registry"], milestone: 3, ms: 1300, detail: "One transaction: cash released to the fund's account and units issued to the investor — both sides or neither", clientSays: "Exchanging cash for units in a single step." },
    { id: "post", label: "Posting & reconciliation", systemIds: ["core", "recon"], milestone: 4, detail: "Core banking, general ledger and unit register agree; audit record sealed", clientSays: "Recording the trade in your accounts." },
    { id: "confirm", label: "Confirmation & reporting", systemIds: ["reporting"], milestone: 4, detail: "Contract note issued; ERP updated by API callback", clientSays: "Sending your confirmation." },
  ];
}

function redeemStages(amount: number): StageDef[] {
  return [
    { id: "instruct", label: "Instruction received", systemIds: ["channel"], milestone: 0, detail: `Redeem ${units(amount)} tokenised units; request signed with the client's certificate`, clientSays: "We have your redemption and are validating it." },
    { id: "entitle", shape: "decision", label: "Entitlements & maker-checker", systemIds: ["entitle"], milestone: 1, detail: "Maker TRS-014 and checker TRS-031 authorised", clientSays: "Confirming the people and limits on your mandate." },
    { id: "screen", shape: "decision", label: "Financial crime screening", systemIds: ["screen"], milestone: 1, detail: "Redeeming entity and destination wallet screened — clear", clientSays: "Running standard security and compliance checks." },
    { id: "dealing", shape: "decision", label: "Dealing rules & redemption limits", systemIds: ["oms"], milestone: 2, detail: "Within the share class's out-of-hours redemption limit; no gate or fee triggered", clientSays: "Checking the fund's rules for this redemption." },
    { id: "liquidity", shape: "decision", label: "Out-of-hours cash sourced", systemIds: ["buffer"], milestone: 2, detail: `Markets are shut, so the fund cannot sell assets until Monday. ${usd(amount)} is paid from its tokenised-deposit cash buffer (US$240,000,000 available); the assets behind it are sold when markets reopen`, clientSays: "Confirming the cash is available now." },
    { id: "price", label: "Price struck", systemIds: ["nav"], milestone: 2, detail: `US$1.0000 per unit → proceeds ${usd(amount)}`, clientSays: `Proceeds confirmed: ${usd(amount)}.` },
    { id: "assetlock", label: "Fund side locked in escrow", systemIds: ["registry"], milestone: 3, detail: `${units(amount)} units moved to settlement escrow in the register`, clientSays: "Your units are held for settlement." },
    { id: "cashreserve", label: "Payment side reserved", systemIds: ["tds"], milestone: 3, detail: `${usd(amount)} of the fund's buffer reserved for payment`, clientSays: "Reserving your proceeds." },
    { id: "commit", shape: "commit", joinsFrom: ["assetlock"], label: "Atomic DvP commit", systemIds: ["settle", "tds", "registry"], milestone: 3, ms: 1300, detail: "One transaction: units cancelled and cash paid to the investor's wallet — both sides or neither", clientSays: "Exchanging units for cash in a single step." },
    { id: "post", label: "Posting & reconciliation", systemIds: ["core", "recon"], milestone: 4, detail: "Core banking, general ledger and unit register agree; audit record sealed", clientSays: "Recording the redemption in your accounts." },
    { id: "confirm", label: "Confirmation & reporting", systemIds: ["reporting"], milestone: 4, detail: "Contract note issued; proceeds available to sweep immediately", clientSays: "Sending your confirmation." },
  ];
}

interface FundScenario extends Scenario {
  title: string;
  when: string;
  kind: "subscribe" | "redeem";
  amount: number;
  start: { cash: number; units: number };
  conventional: string;
  exception?: boolean;
}

const scenarios: FundScenario[] = [
  {
    key: "redeem",
    title: "Sunday night — raise cash for Monday payroll",
    when: "Sun 13 Sep · 23:10 HKT",
    kind: "redeem",
    amount: 20_000_000,
    start: { cash: 12_400_000, units: 50_000_000 },
    clockStart: { h: 23, m: 10, label: "Sun 13 Sep" },
    stages: redeemStages(20_000_000),
    conventional:
      "Conventional share class: a Sunday instruction waits for Monday's dealing cycle. So a treasurer who might need cash out of hours keeps a buffer like this US$50m as a low-yielding deposit instead — about US$16k of yield forgone per weekend at an illustrative 4%.",
  },
  {
    key: "subscribe",
    title: "Friday evening — invest after the cut-off",
    when: "Fri 11 Sep · 18:40 HKT",
    kind: "subscribe",
    amount: 50_000_000,
    start: { cash: 62_400_000, units: 0 },
    clockStart: { h: 18, m: 40, label: "Fri 11 Sep" },
    stages: subscribeStages(50_000_000),
    conventional:
      "Conventional share class: the order sits pending until Monday's dealing cycle. Settling tonight does not add weekend yield — the fund cannot invest until markets open — but the treasurer ends the week with the position done, not a Monday cut-off to chase.",
  },
  {
    key: "exception",
    title: "Exception — units cannot be issued",
    when: "Fri 11 Sep · 18:40 HKT",
    kind: "subscribe",
    amount: 50_000_000,
    start: { cash: 62_400_000, units: 0 },
    clockStart: { h: 18, m: 40, label: "Fri 11 Sep" },
    stages: subscribeStages(50_000_000),
    exception: true,
    failAt: "assetreserve",
    failDetail:
      "Transfer agent cannot issue units: investor due-diligence on the register is incomplete for Party A Holdings (HK). No units reserved.",
    reversal: [
      { label: "Payment side released from escrow", systemIds: ["tds", "settle"], detail: "US$50,000,000 returned to Party A's tokenised deposit wallet — value never left the client" },
      { label: "Exception case opened", systemIds: ["recon"], detail: "Owned by Securities Services onboarding; client told what is needed, not which check fired" },
    ],
    conventional:
      "The same safeguard exists on the conventional route. The difference is that the client sees the outcome in seconds and the cash was never at risk, rather than finding out the next business day.",
  },
];

export function FundDemo() {
  const runner = useStageRunner();
  const [tab, setTab] = useState<"side" | "flow">("side");
  const { scenario, statuses, reversalStatuses, phase, paused, clock } = runner;
  const sc = scenario as FundScenario | null;

  const idx = (id: string) => (sc ? sc.stages.findIndex((s) => s.id === id) : -1);
  const done = (id: string) => sc !== null && statuses[idx(id)] === "done";
  const reversed = reversalStatuses[0] === "reversed";

  let cash = sc?.start.cash ?? scenarios[0].start.cash;
  let held = 0;
  let unitHolding = sc?.start.units ?? scenarios[0].start.units;
  let pendingUnits = 0;
  if (sc) {
    if (sc.kind === "subscribe") {
      if (done("cashlock") && !reversed) held = sc.amount;
      if (done("assetreserve") && !done("commit")) pendingUnits = sc.amount;
      if (done("commit")) {
        cash -= sc.amount;
        held = 0;
        pendingUnits = 0;
        unitHolding += sc.amount;
      }
    } else {
      if (done("assetlock") && !done("commit")) pendingUnits = sc.amount;
      if (done("commit")) {
        pendingUnits = 0;
        unitHolding -= sc.amount;
        cash += sc.amount;
      }
    }
  }

  const running = phase === "running";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {scenarios.map((s) => (
          <button
            key={s.key}
            type="button"
            disabled={running}
            onClick={() => runner.start(s)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              sc?.key === s.key ? "border-brand-500 bg-brand-50 text-charcoal-900" : "border-paper-200 bg-paper-0 text-ink-700 hover:bg-paper-50",
              s.exception && sc?.key !== s.key && "border-rose-100"
            )}
          >
            {s.exception ? <TriangleAlert size={14} className="text-rose-500" /> : s.kind === "subscribe" ? <ArrowUpRight size={14} className="text-emerald-600" /> : <ArrowDownLeft size={14} className="text-blue-600" />}
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
        <div className="rounded-2xl border-2 border-brand-500 bg-paper-50 p-4 shadow-[0_0_0_4px_rgba(219,0,17,0.08)] xl:sticky xl:top-4 xl:self-start">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">What the client sees</p>
            <Badge tone="neutral">HSBCnet · Liquidity & Investments (mock)</Badge>
          </div>

          <div className="rounded-xl border border-paper-200 bg-paper-0 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold text-charcoal-900">Party A Holdings (HK)</p>
                <p className="text-[12px] text-ink-500">Group treasury</p>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-ink-500">
                <Clock size={13} />
                {sc ? `${sc.clockStart.label} · ${clock} HKT` : "Choose a scenario"}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-paper-50 p-3">
                <p className="text-[11px] text-ink-500">Tokenised USD deposits</p>
                <p className="mt-1 font-mono text-[18px] font-semibold tabular-nums text-charcoal-900">{usd(cash)}</p>
                {held > 0 && <p className="mt-1 animate-pulse text-[11.5px] font-medium text-blue-600">{usd(held)} held for settlement</p>}
                {reversed && sc?.exception && <p className="mt-1 text-[11.5px] font-medium text-emerald-600">Hold released — funds available</p>}
              </div>
              <div className="rounded-lg bg-paper-50 p-3">
                <p className="text-[11px] text-ink-500">USD money-market fund · tokenised units</p>
                <p className="mt-1 font-mono text-[18px] font-semibold tabular-nums text-charcoal-900">{units(unitHolding)}</p>
                {pendingUnits > 0 && <p className="mt-1 animate-pulse text-[11.5px] font-medium text-blue-600">{units(pendingUnits)} units settling</p>}
              </div>
            </div>

            {sc && (
              <div className="mt-3 rounded-lg border border-paper-200 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{sc.kind === "subscribe" ? "Subscription order" : "Redemption order"}</p>
                <p className="mt-0.5 text-[13px] font-medium text-charcoal-900">
                  {sc.kind === "subscribe" ? `Invest ${usd(sc.amount)}` : `Redeem ${units(sc.amount)} units`} · settle with tokenised deposits
                </p>
              </div>
            )}
          </div>

          <div className="mt-3">
            <ClientProgress runner={runner} milestones={milestones} />
          </div>

          {phase === "completed" && sc && (
            <div className="mt-3 rounded-xl border border-emerald-500 bg-emerald-100 p-3.5">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-charcoal-900">
                <ShieldCheck size={15} className="text-emerald-600" />
                {sc.kind === "subscribe" ? `${units(sc.amount)} units issued` : `${usd(sc.amount)} in your wallet`}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-charcoal-900">
                {sc.kind === "subscribe"
                  ? "Settled and confirmed tonight — nothing left pending for Monday. Yield starts on the next business day, when the fund can invest the cash, and the units can be redeemed at any hour."
                  : "Proceeds arrived on Sunday night and can be swept straight to Singapore for Monday's payroll — which is Demo 2. The other 30,000,000 units stay invested."}
              </p>
            </div>
          )}
          {phase === "failed" && sc && (
            <div className="mt-3 rounded-xl border border-rose-500 bg-rose-100 p-3.5">
              <p className="text-[13px] font-semibold text-charcoal-900">Order not completed — no money moved</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-charcoal-900">
                The {usd(sc.amount)} held for settlement has been released back to your account. We need one more registration step before units can be issued; your relationship team will contact you. Ref FND-40218.
              </p>
            </div>
          )}

          {sc && (
            <p className="mt-3 rounded-lg border border-dashed border-paper-200 px-3 py-2 text-[12px] leading-relaxed text-ink-500">
              <strong className="font-semibold text-ink-700">Versus today:</strong> {sc.conventional}
            </p>
          )}
        </div>

        {/* BANK SIDE */}
        <div className="flex flex-col rounded-2xl border border-charcoal-800 bg-charcoal-950 p-4">
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
