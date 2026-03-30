import { HistorySignal } from '@/lib/exchanges';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ArrowRight, Trash2, Clock, DollarSign, Star } from 'lucide-react';

interface SignalHistoryProps {
  history: HistorySignal[];
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

function HistoryCard({ signal }: { signal: HistorySignal }) {
  const isTop = signal.averageNetProfitMargin >= 7;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`p-3 rounded-lg border transition-colors ${
        isTop ? 'bg-profit/5 border-profit/30' : 'bg-secondary/30 border-border/60'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5 gap-3">
        <span className="text-xs font-mono font-bold text-foreground flex items-center gap-1">
          {isTop && <Star className="h-3 w-3 text-warning fill-warning" />}
          {signal.symbol}
        </span>
        <span
          className={`text-[11px] font-mono font-bold text-right ${
            signal.averageNetProfitMargin >= 7
              ? 'text-profit'
              : signal.averageNetProfitMargin >= 5
                ? 'text-warning'
                : 'text-signal'
          }`}
        >
          +{signal.averageNetProfitMargin.toFixed(2)}% avg
          <span className="text-muted-foreground"> (+{signal.peakNetProfitMargin.toFixed(2)}% peak)</span>
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-mono">
        <span className="text-profit">BUY {signal.buyExchange}</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <span className="text-loss">SELL {signal.sellExchange}</span>
      </div>
      <div className="flex items-center justify-between mt-1.5 text-xs font-mono text-muted-foreground">
        <span>
          ${signal.buyPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to $
          {signal.sellPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <DollarSign className="h-2.5 w-2.5" />
          Fees: ${signal.totalFees.toFixed(2)}
        </span>
        <span className="text-profit font-semibold">
          Net: ${signal.netProfitAmount.toFixed(2)}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />
          Active for {formatDuration(signal.duration)}
        </span>
        <span>{new Date(signal.expiredAt).toLocaleTimeString()}</span>
      </div>
    </motion.div>
  );
}

export function SignalHistory({ history, onClear }: SignalHistoryProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-warning" />
          <h2 className="text-sm font-semibold font-mono text-foreground">SIGNAL HISTORY</h2>
          {history.length > 0 && (
            <span className="text-[10px] font-mono text-muted-foreground">({history.length})</span>
          )}
        </div>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm font-mono">
            <History className="h-8 w-8 mb-2 opacity-30" />
            <p>No history yet</p>
            <p className="text-xs mt-1">Expired signals will appear here</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {history.map((signal) => (
              <div key={signal.id} className="mb-2">
                <HistoryCard signal={signal} />
              </div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
