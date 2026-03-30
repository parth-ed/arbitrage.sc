import { ArbitrageSignal } from '@/lib/exchanges';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, ArrowRight, Trash2, Star, DollarSign, Clock, CheckCircle2, Timer } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

interface SignalFeedProps {
  signals: ArbitrageSignal[];
  onClear: () => void;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainSec = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainSec}s`;
  const hours = Math.floor(minutes / 60);
  const remainMin = minutes % 60;
  return `${hours}h ${remainMin}m`;
}

const CONFIRM_TIME = 60000;

function SignalCard({ signal, highlight, isActionable }: { signal: ArbitrageSignal; highlight?: boolean; isActionable?: boolean }) {
  const [elapsed, setElapsed] = useState(Date.now() - signal.firstSeen);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Date.now() - signal.firstSeen), 1000);
    return () => clearInterval(timer);
  }, [signal.firstSeen]);

  const actionable = elapsed >= CONFIRM_TIME;
  const confirmProgress = Math.min(elapsed / CONFIRM_TIME, 1);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={`p-3 rounded-lg border transition-colors ${
        isActionable
          ? 'bg-profit/10 border-profit/40 hover:border-profit/60'
          : highlight
            ? 'bg-warning/5 border-warning/30 hover:border-warning/50'
            : 'bg-secondary/50 border-border hover:border-primary/30'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono font-bold text-foreground flex items-center gap-1">
          {isActionable && <CheckCircle2 className="h-3 w-3 text-profit" />}
          {highlight && !isActionable && <Star className="h-3 w-3 text-warning fill-warning" />}
          {signal.symbol}
        </span>
        <div className="flex items-center gap-2">
          {actionable ? (
            <span className="text-[9px] font-mono font-bold text-profit bg-profit/15 px-1.5 py-0.5 rounded">
              ✓ ACTIONABLE
            </span>
          ) : (
            <span className="text-[9px] font-mono text-muted-foreground bg-secondary px-1.5 py-0.5 rounded flex items-center gap-1">
              <Clock className="h-2.5 w-2.5 animate-pulse" />
              CONFIRMING
            </span>
          )}
          <span className={`text-xs font-mono font-bold ${signal.netProfitMargin >= 7 ? 'text-profit' : signal.netProfitMargin >= 5 ? 'text-warning' : 'text-signal'}`}>
            +{signal.netProfitMargin.toFixed(2)}% net
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs font-mono">
        <span className="text-profit">BUY {signal.buyExchange}</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-loss">SELL {signal.sellExchange}</span>
      </div>

      <div className="flex items-center justify-between mt-2 text-xs font-mono text-muted-foreground">
        <span>
          ${signal.buyPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to $
          {signal.sellPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className="text-foreground/60">
          Gross: +{signal.profitMargin.toFixed(2)}%
        </span>
      </div>

      <div className="mt-2 flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <DollarSign className="h-2.5 w-2.5" />
          Buy fee: ${signal.buyFee.toFixed(2)}
        </span>
        <span className="flex items-center gap-0.5">
          <DollarSign className="h-2.5 w-2.5" />
          Sell fee: ${signal.sellFee.toFixed(2)}
        </span>
        <span className="text-profit font-semibold">
          Net: ${signal.netProfitAmount.toFixed(2)}
        </span>
      </div>

      {!actionable && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground mb-0.5">
            <span>Confirming...</span>
            <span>{Math.floor(confirmProgress * 100)}%</span>
          </div>
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-signal/60 rounded-full transition-all duration-1000"
              style={{ width: `${confirmProgress * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-2.5 w-2.5 text-signal" />
          Active {formatDuration(elapsed)}
        </span>
        <span>{new Date(signal.timestamp).toLocaleTimeString()}</span>
      </div>
    </motion.div>
  );
}

function useForceUpdate() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((tick) => tick + 1), 1000);
    return () => clearInterval(timer);
  }, []);
}

export function SignalFeed({ signals, onClear }: SignalFeedProps) {
  useForceUpdate();

  const now = Date.now();
  const actionableSignals = useMemo(
    () => signals.filter((signal) => now - signal.firstSeen >= CONFIRM_TIME),
    [signals, now]
  );
  const confirmingSignals = useMemo(
    () => signals.filter((signal) => now - signal.firstSeen < CONFIRM_TIME),
    [signals, now]
  );

  const actionableBest = actionableSignals.filter((signal) => signal.netProfitMargin >= 7);
  const actionableRegular = actionableSignals.filter((signal) => signal.netProfitMargin < 7);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-signal" />
          <h2 className="text-sm font-semibold font-mono text-foreground">ARBITRAGE SIGNALS</h2>
        </div>
        {signals.length > 0 && (
          <button
            onClick={onClear}
            className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {signals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm font-mono">
            <TrendingUp className="h-8 w-8 mb-2 opacity-30" />
            <p>Scanning for opportunities...</p>
            <p className="text-xs mt-1">Signals appear when net spread {'>='} 4%</p>
          </div>
        ) : (
          <>
            {actionableSignals.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-profit" />
                  <span className="text-[11px] font-mono font-bold text-profit uppercase tracking-wider">
                    Actionable - Persistent 1min+ ({actionableSignals.length})
                  </span>
                </div>

                {actionableBest.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-1 mb-1.5 px-1">
                      <Star className="h-3 w-3 text-warning fill-warning" />
                      <span className="text-[10px] font-mono font-semibold text-warning uppercase tracking-wider">
                        Best 7%+
                      </span>
                    </div>
                    <AnimatePresence initial={false}>
                      {actionableBest.map((signal) => (
                        <div key={signal.signalKey} className="mb-2">
                          <SignalCard signal={signal} highlight isActionable />
                        </div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {actionableRegular.map((signal) => (
                    <div key={signal.signalKey} className="mb-2">
                      <SignalCard signal={signal} isActionable />
                    </div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {confirmingSignals.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2 px-1">
                  <Timer className="h-3.5 w-3.5 text-muted-foreground animate-pulse" />
                  <span className="text-[11px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                    Confirming - Under 1min ({confirmingSignals.length})
                  </span>
                </div>
                <AnimatePresence initial={false}>
                  {confirmingSignals.map((signal) => (
                    <div key={signal.signalKey} className="mb-2">
                      <SignalCard signal={signal} />
                    </div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
