import { Link } from 'react-router-dom';
import { ArrowRight, Banknote, CandlestickChart, ChevronRight, ShieldCheck, Waypoints } from 'lucide-react';

const steps = [
  {
    label: '1. Find the mismatch',
    copy: 'The same coin can trade at different prices on different exchanges for a short window of time.',
  },
  {
    label: '2. Buy on the lower exchange',
    copy: 'If Bitcoin is cheaper on Kraken, that is where the position begins.',
  },
  {
    label: '3. Sell on the higher exchange',
    copy: 'If Binance is quoting a higher price, the trade closes there and captures the spread after fees.',
  },
];

const principles = [
  {
    icon: CandlestickChart,
    title: 'Live opportunity scanning',
    text: 'The scanner watches cross-exchange price gaps and surfaces signals when the spread is meaningful.',
  },
  {
    icon: Waypoints,
    title: 'Cross-exchange decision making',
    text: 'This is not a normal directional trade. It is about comparing the same asset across venues.',
  },
  {
    icon: ShieldCheck,
    title: 'Net profit matters',
    text: 'Fees, timing, and execution speed decide whether a spread is truly worth acting on.',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#efe7db] text-[#2f2a24]">
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10 lg:px-12">
        <header className="flex items-center justify-between py-4">
          <Link to="/" className="block">
            <p className="font-['Space_Grotesk'] text-3xl font-bold tracking-[0.18em] text-[#6f5948] md:text-4xl">
              SPREADNEST
            </p>
            <h1 className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-[#26231f]">
              Clear arbitrage, explained simply.
            </h1>
          </Link>

          <Link
            to="/scanner"
            className="inline-flex items-center gap-2 rounded-full bg-[#26473c] px-5 py-2.5 text-sm font-semibold text-[#f7f2ea] transition hover:bg-[#1f3c33]"
          >
            Go
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <section className="grid gap-8 py-10 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="rounded-[2rem] bg-[#f8f3ec] p-8 shadow-[0_20px_50px_rgba(80,59,40,0.08)] md:p-10">
            <div className="inline-flex items-center rounded-full bg-[#e7ddd0] px-4 py-2 text-sm font-medium text-[#65584b]">
              Buy lower on one exchange. Sell higher on another.
            </div>

            <h2 className="mt-6 max-w-3xl font-['Space_Grotesk'] text-5xl font-semibold leading-[1.02] text-[#2b2621] md:text-6xl">
              Understand how arbitrage can make money before entering the live signal terminal.
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5a5044]">
              Arbitrage happens when the same asset is priced differently across two exchanges. If Bitcoin is cheaper
              on one platform and more expensive on another, a trader may buy on the cheaper exchange and sell on the
              expensive exchange. The gap between those two prices is the opportunity, and the scanner helps surface it
              in real time.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/scanner"
                className="inline-flex items-center gap-2 rounded-full bg-[#b5674d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#a55a43]"
              >
                Open terminal
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#process"
                className="inline-flex items-center gap-2 rounded-full border border-[#d4c5b5] bg-white px-6 py-3 text-sm font-semibold text-[#4c4339] transition hover:bg-[#faf6f1]"
              >
                See the process
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {principles.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="rounded-[1.5rem] border border-[#e7dbcf] bg-white p-5">
                    <div className="inline-flex rounded-2xl bg-[#f3e6d8] p-3 text-[#9e6245]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-['Space_Grotesk'] text-xl font-semibold text-[#2c2823]">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#62584d]">{item.text}</p>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#2b2a28] p-5 text-[#f3ecdf] shadow-[0_28px_65px_rgba(43,42,40,0.22)]">
            <div className="rounded-[1.5rem] border border-white/10 bg-[#232220] p-5 md:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.32em] text-[#d0b79d]">Example signal</p>
                  <h3 className="mt-2 font-['Space_Grotesk'] text-2xl font-semibold text-white">BTC cross-exchange spread</h3>
                </div>
                <div className="rounded-full bg-[#33483f] px-3 py-2 text-sm font-semibold text-[#d6eadf]">
                  Net +2.18%
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.35rem] bg-[#342f2b] p-5">
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-[#d3b193]">Buy side</p>
                  <h4 className="mt-3 font-['Space_Grotesk'] text-2xl font-semibold text-white">Kraken</h4>
                  <p className="mt-3 text-4xl font-semibold text-[#f5eadf]">$63,420</p>
                  <p className="mt-4 text-sm leading-7 text-[#d1c2b1]">
                    The scanner identifies Kraken as the cheaper exchange, so this is where the trade begins.
                  </p>
                </div>

                <div className="rounded-[1.35rem] bg-[#21352f] p-5">
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-[#bfd8c4]">Sell side</p>
                  <h4 className="mt-3 font-['Space_Grotesk'] text-2xl font-semibold text-white">Binance</h4>
                  <p className="mt-3 text-4xl font-semibold text-[#eef7ef]">$64,980</p>
                  <p className="mt-4 text-sm leading-7 text-[#d7e6da]">
                    Binance is pricing higher in this example, so that is where the trader sells.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-[1.35rem] border border-dashed border-white/15 bg-[#2f2e2b] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-[0.3em] text-[#d0b79d]">What the signal means</p>
                    <p className="mt-3 text-sm leading-8 text-[#ddd2c4]">
                      This signal says the same coin appears underpriced on Kraken and overpriced on Binance at the same
                      time. A trader buys BTC on Kraken at $63,420, then sells BTC on Binance at $64,980. The scanner
                      highlights the opportunity, but real profit depends on fees, transfer limits, and execution speed.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#9d5f46] p-3 text-white">
                    <Banknote className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[#3b3834] p-4">
                    <p className="text-[11px] font-mono uppercase tracking-[0.28em] text-[#cfbaa5]">Gross spread</p>
                    <p className="mt-2 text-xl font-semibold text-white">$1,560</p>
                  </div>
                  <div className="rounded-2xl bg-[#3b3834] p-4">
                    <p className="text-[11px] font-mono uppercase tracking-[0.28em] text-[#cfbaa5]">Estimated fees</p>
                    <p className="mt-2 text-xl font-semibold text-white">$177</p>
                  </div>
                  <div className="rounded-2xl bg-[#274239] p-4">
                    <p className="text-[11px] font-mono uppercase tracking-[0.28em] text-[#c9e3d1]">Net outcome</p>
                    <p className="mt-2 text-xl font-semibold text-[#eef8f0]">$1,383</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="process" className="pb-14">
          <div className="mb-6">
            <p className="text-xs font-mono uppercase tracking-[0.34em] text-[#8a705c]">How the process works</p>
            <h3 className="mt-2 font-['Space_Grotesk'] text-3xl font-semibold text-[#2b2621]">
              Buying on one exchange and selling on another
            </h3>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="grid gap-4">
              {steps.map((step) => (
                <article key={step.label} className="rounded-[1.6rem] bg-[#f8f3ec] p-6 shadow-[0_14px_36px_rgba(80,59,40,0.06)]">
                  <p className="text-xs font-mono uppercase tracking-[0.3em] text-[#8b7765]">{step.label}</p>
                  <p className="mt-3 text-base leading-8 text-[#594f43]">{step.copy}</p>
                </article>
              ))}
            </div>

            <aside className="rounded-[1.8rem] bg-[#26473c] p-6 text-[#f4eee4] shadow-[0_22px_50px_rgba(38,71,60,0.2)]">
              <p className="text-xs font-mono uppercase tracking-[0.3em] text-[#cfe0d4]">Before you press Go</p>
              <h4 className="mt-3 font-['Space_Grotesk'] text-2xl font-semibold text-white">What the terminal shows</h4>
              <div className="mt-5 space-y-4 text-sm leading-7 text-[#e2ded5]">
                <p>It compares exchanges side by side and highlights where the same asset is cheaper in one place and more expensive in another.</p>
                <p>It also tracks whether that spread is temporary noise or a persistent signal with average and peak arbitrage worth reviewing.</p>
              </div>
              <Link
                to="/scanner"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#f2ddc8] px-5 py-3 text-sm font-semibold text-[#26473c] transition hover:bg-[#f7e7d7]"
              >
                Go to live signals
                <ArrowRight className="h-4 w-4" />
              </Link>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
