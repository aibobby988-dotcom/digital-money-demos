import { ArrowDown, ArrowUpRight, Eye, Layers, Server, TriangleAlert } from "lucide-react";
import { FundDemo } from "@/components/demo/FundDemo";
import { PoolingDemo } from "@/components/demo/PoolingDemo";

function Source({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-brand-600 underline decoration-brand-100 underline-offset-2 hover:decoration-brand-500">
      {children}
      <ArrowUpRight size={11} />
    </a>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-charcoal-800 bg-charcoal-950">
        <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8">
          <p className="text-[12px] font-semibold uppercase tracking-wider text-brand-400">Concept demos · Digital Money</p>
          <h1 className="mt-3 max-w-4xl text-[30px] font-semibold leading-tight tracking-tight text-paper-0 sm:text-[38px]">
            Putting the tokenised payment side to work inside HSBC
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-paper-200">
            The Tokenised Deposit Service already moves money 24/7. These two demos propose ways to make it more useful.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <a href="#demo-1" className="group rounded-xl border border-charcoal-700 bg-charcoal-900 p-4 hover:border-brand-500">
              <p className="text-[12px] font-semibold text-brand-400">Demo 1 · Cash to asset</p>
              <p className="mt-1 text-[15px] font-semibold text-paper-0">Keep the cash buffer invested, get it back at any hour</p>
              <p className="mt-1 flex items-center gap-1 text-[12.5px] text-ink-400 group-hover:text-paper-200">Delivery-versus-payment, 24/7 <ArrowDown size={12} /></p>
            </a>
            <a href="#demo-2" className="group rounded-xl border border-charcoal-700 bg-charcoal-900 p-4 hover:border-brand-500">
              <p className="text-[12px] font-semibold text-brand-400">Demo 2 · Cash to cash</p>
              <p className="mt-1 text-[15px] font-semibold text-paper-0">Automated cash pooling on the 24/7 rail</p>
              <p className="mt-1 flex items-center gap-1 text-[12.5px] text-ink-400 group-hover:text-paper-200">Enabling more AI automation capabilities for users <ArrowDown size={12} /></p>
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-16 px-5 py-10 sm:px-8">
        <section className="grid gap-3 md:grid-cols-3">
          {[
            { icon: Eye, title: "Left: what the client sees", body: "A handful of plain milestones, a moving indicator and exactly where the money is at every moment — never a frozen screen." },
            { icon: Server, title: "Right: what the bank is doing", body: "Every system touched, every stage that must pass before finality, and the audit trail being written as it happens." },
            { icon: Layers, title: "Both driven by one engine", body: "The two views read the same state, so they can never disagree. Use Pause to explain any stage mid-flight." },
          ].map((c) => (
            <div key={c.title} className="flex gap-3 rounded-xl border border-paper-200 bg-paper-0 p-4">
              <c.icon size={18} className="mt-0.5 shrink-0 text-brand-500" />
              <div>
                <p className="text-[14px] font-semibold text-charcoal-900">{c.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{c.body}</p>
              </div>
            </div>
          ))}
        </section>

        {/* DEMO 1 */}
        <section id="demo-1" className="scroll-mt-6 space-y-6">
          <div className="max-w-4xl">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-brand-600">Demo 1 · Cash to asset</p>
            <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-charcoal-900">
              Keep the cash buffer invested, get it back at any hour
            </h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-ink-700">
              Money-market funds deal only on business days, so treasurers keep a precautionary buffer in plain deposits in case
              cash is needed when the fund is shut. Party A Holdings puts its US$50m buffer in a tokenised share class instead: at 16:40
              on Friday, before the 17:00 cut-off, it invests with tokenised deposits and the units earn the weekend&apos;s yield. At
              23:10 on Sunday, Singapore&apos;s Monday payroll needs US$20m — the treasurer redeems units into tokenised deposits in
              seconds, as a single exchange of units for cash, and the rest stays invested.
            </p>
            <div className="mt-4 inline-flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-paper-200 bg-paper-0 px-4 py-3">
              <span className="text-[24px] font-semibold tabular-nums tracking-tight text-charcoal-900">≈ US$16k</span>
              <span className="text-[13.5px] text-ink-700">per weekend earned by keeping a US$50m buffer invested instead of idle, at a 4% yield</span>
              <span className="w-full text-[11.5px] text-ink-400">
                Illustrative: US$50,000,000 × 4% × 3 days (Fri–Mon) ÷ 365 = US$16,438, against a buffer earning close to nothing. Funds accrue interest on calendar days, so units already held at Friday&apos;s cut-off earn the weekend — round-the-clock redemption is what makes it safe to hold them. Subscribing at the weekend adds no yield: it starts on the next business day.
              </span>
            </div>
          </div>

          <FundDemo />

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-paper-200 bg-paper-0 p-5">
              <p className="text-[14px] font-semibold text-charcoal-900">What HSBC already has</p>
              <ul className="mt-2.5 space-y-2.5 text-[13px] leading-relaxed text-ink-700">
                <li>
                  The Tokenised Deposit Service — a 24/7 tokenised payment side, live in six markets.{" "}
                  <Source href="https://www.about.us.hsbc.com/newsroom/press-releases/hsbc-expands-tokenized-deposit-service-to-the-united-states">HSBC</Source>
                </li>
                <li>
                  Tokenised fund infrastructure: HSBC is tokenisation agent, trustee and registrar for CSOP&apos;s tokenised HKD
                  money-market ETF class (June 2026).{" "}
                  <Source href="https://www.asiaasset.com/exchange-traded-funds/hong-kong-asset-manager-csop-and-hsbc-to-launch-tokenised-money-market-etf/">Asia Asset Management</Source>
                </li>
                <li>
                  Its own money-market funds through HSBC Asset Management.{" "}
                  <Source href="https://www.assetmanagement.hsbc.com.hk/individual-investor/mmf">HSBC AM</Source>
                </li>
                <li>
                  Market direction: the HKMA&apos;s EnsembleTX pilot made tokenised deposits settling tokenised money-market fund
                  transactions its initial focus.{" "}
                  <Source href="https://www.hkma.gov.hk/eng/news-and-media/press-releases/2025/11/20251113-3/">HKMA</Source>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
              <p className="text-[14px] font-semibold text-charcoal-900">What is new</p>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-700">
                Joining the pieces. The payment side, the registrar capability and the funds exist separately; a treasurer on TDS cannot
                yet buy or sell an HSBC fund atomically, out of hours, with no settlement gap. This demo is that join — delivered
                entirely inside HSBC, with no external platform in the path.
              </p>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-700">
                It also rehearses the harder, larger prize: once the join works for HSBC&apos;s own funds, the same payment side can serve
                third-party funds on shared networks.
              </p>
            </div>
            <div className="rounded-2xl border border-paper-200 bg-paper-0 p-5">
              <p className="flex items-center gap-1.5 text-[14px] font-semibold text-charcoal-900">
                <TriangleAlert size={15} className="text-amber-500" />
                The hard parts
              </p>
              <ul className="mt-2.5 space-y-2 text-[13px] leading-relaxed text-ink-700">
                <li><strong className="font-semibold text-charcoal-900">The fund, not the rail, sets the clock.</strong> Out-of-hours dealing needs a share class whose terms and pricing allow it, approved by the fund regulator.</li>
                <li><strong className="font-semibold text-charcoal-900">The register must run 24/7</strong> — transfer agency operations and exception handling included.</li>
                <li><strong className="font-semibold text-charcoal-900">Legal finality of the exchange</strong> has to be confirmed per jurisdiction, not assumed from atomic settlement.</li>
                <li><strong className="font-semibold text-charcoal-900">Who pays out while markets are shut.</strong> Weekend redemptions come from the fund&apos;s cash buffer, sized to expected demand. Beyond it, the realistic fallback is an HSBC loan to the investor secured on its units — many markets restrict a bank from propping up its own fund.</li>
                <li><strong className="font-semibold text-charcoal-900">Fund liquidity rules</strong> — redemption limits, gates and fees — must be enforced in the flow, not after it.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* DEMO 2 */}
        <section id="demo-2" className="scroll-mt-6 space-y-6">
          <div className="max-w-4xl">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-brand-600">Demo 2 · Cash to cash</p>
            <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-charcoal-900">
              Automated cash pooling on the 24/7 rail
            </h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-ink-700">
              At 02:15 on Monday, Singapore&apos;s payroll batch drops its balance below the floor the treasurer set. Nobody is awake,
              and nobody needs to be. The rule decides, the controls check, and the money moves — and when a top-up would breach
              the client&apos;s own daily cap, automation stops and a named person decides.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-paper-200 bg-paper-0 p-5">
            <p className="text-[14px] font-semibold text-charcoal-900">Why this is new: treasurers currently choose between automation and availability</p>
            <table className="mt-3 w-full min-w-[620px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-paper-200 text-[11.5px] uppercase tracking-wide text-ink-400">
                  <th className="py-2 pr-4 font-medium"></th>
                  <th className="py-2 pr-4 font-medium">Moves by rule?</th>
                  <th className="py-2 pr-4 font-medium">Moves any hour?</th>
                  <th className="py-2 font-medium">What is missing</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-paper-100">
                  <td className="py-3 pr-4 font-semibold text-charcoal-900">Conventional cash pooling</td>
                  <td className="py-3 pr-4 text-emerald-600">Yes</td>
                  <td className="py-3 pr-4 text-rose-600">No</td>
                  <td className="py-3 text-ink-700">Sweeps run on scheduled cycles, usually end of day, bound by cut-offs and business days</td>
                </tr>
                <tr className="border-b border-paper-100">
                  <td className="py-3 pr-4 font-semibold text-charcoal-900">Tokenised Deposit Service today</td>
                  <td className="py-3 pr-4 text-rose-600">No</td>
                  <td className="py-3 pr-4 text-emerald-600">Yes</td>
                  <td className="py-3 text-ink-700">Every movement still has to be spotted and instructed by a person or a client system</td>
                </tr>
                <tr className="bg-brand-50">
                  <td className="py-3 pr-4 font-semibold text-charcoal-900">This proposal</td>
                  <td className="py-3 pr-4 text-emerald-600">Yes</td>
                  <td className="py-3 pr-4 text-emerald-600">Yes</td>
                  <td className="py-3 text-ink-700">Nothing on the rail — the new parts are the policy engine, the limits and the intercompany record</td>
                </tr>
              </tbody>
            </table>
          </div>

          <PoolingDemo />

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
              <p className="text-[14px] font-semibold text-charcoal-900">What is new</p>
              <ul className="mt-2.5 space-y-2 text-[13px] leading-relaxed text-ink-700">
                <li>A <strong className="font-semibold text-charcoal-900">policy engine</strong> that turns balance events into funding decisions, so the trigger is a rule rather than a person.</li>
                <li><strong className="font-semibold text-charcoal-900">Client-owned limits</strong> — per-transfer, daily group cap and hub reserve — enforced before anything is reserved.</li>
                <li>An <strong className="font-semibold text-charcoal-900">intercompany record</strong> for every sweep, so interest allocation and group accounting keep up with money that now moves at 2am.</li>
                <li>A <strong className="font-semibold text-charcoal-900">human exception path</strong>: the cap stops automation and routes a decision to a named checker, on the audit trail.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-paper-200 bg-paper-0 p-5">
              <p className="flex items-center gap-1.5 text-[14px] font-semibold text-charcoal-900">
                <TriangleAlert size={15} className="text-amber-500" />
                The hard parts
              </p>
              <ul className="mt-2.5 space-y-2 text-[13px] leading-relaxed text-ink-700">
                <li><strong className="font-semibold text-charcoal-900">Tax and intercompany rules.</strong> Cross-border sweeps create intercompany loans; transfer pricing, and in some markets currency or pooling restrictions, decide which corridors are possible.</li>
                <li><strong className="font-semibold text-charcoal-900">Legal finality per corridor</strong> — an unapproved corridor should be refused by the engine, not discovered later.</li>
                <li><strong className="font-semibold text-charcoal-900">A misconfigured policy could drain the hub</strong> — hence the client cap, the reserved hub minimum and suspension after repeated triggers.</li>
                <li><strong className="font-semibold text-charcoal-900">Always-on is a real operating cost</strong> — someone owns a held sweep at 5am.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-paper-200 bg-paper-0">
        <div className="mx-auto max-w-[1400px] px-5 py-6 text-[12px] leading-relaxed text-ink-500 sm:px-8">
          Independent concept prototype for discussion. Not affiliated with or endorsed by HSBC. Clients, balances, prices, limits
          and system names are simulated and illustrative; the integration map describes plausible system roles, not HSBC&apos;s actual
          internal architecture. Product and market facts link to public sources.
        </div>
      </footer>
    </div>
  );
}
