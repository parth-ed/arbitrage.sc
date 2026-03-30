import { CoinData, EXCHANGES } from '@/lib/exchanges';
import { motion } from 'framer-motion';

interface PriceTableProps {
  coins: CoinData[];
}

function formatPrice(price: number): string {
  if (price >= 1) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 0.001) return price.toFixed(6);
  return price.toFixed(8);
}

export function PriceTable({ coins }: PriceTableProps) {
  if (coins.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground font-mono text-sm">
        Loading price data...
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-muted-foreground font-medium sticky left-0 bg-card z-10">COIN</th>
            {EXCHANGES.map(ex => (
              <th key={ex.id} className="text-right py-3 px-3 text-muted-foreground font-medium whitespace-nowrap">
                <a
                  href={ex.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
                >
                  {ex.name.toUpperCase()}
                </a>
              </th>
            ))}
            <th className="text-right py-3 px-4 text-muted-foreground font-medium">SPREAD</th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin, idx) => {
            const prices = coin.prices.filter(p => p.price > 0);
            const min = Math.min(...prices.map(p => p.price));
            const max = Math.max(...prices.map(p => p.price));
            const spread = min > 0 ? ((max - min) / min) * 100 : 0;

            return (
              <motion.tr
                key={coin.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
              >
                <td className="py-3 px-4 sticky left-0 bg-card z-10">
                  <div className="flex items-center gap-2">
                    <img src={coin.image} alt={coin.name} className="w-5 h-5 rounded-full" />
                    <span className="font-semibold text-foreground">{coin.symbol}</span>
                    <span className="text-muted-foreground hidden lg:inline">{coin.name}</span>
                  </div>
                </td>
                {EXCHANGES.map(ex => {
                  const ep = coin.prices.find(p => p.exchange === ex.id);
                  const price = ep?.price || 0;
                  const isMin = price === min && prices.length > 1;
                  const isMax = price === max && prices.length > 1;
                  return (
                    <td
                      key={ex.id}
                      className={`text-right py-3 px-3 tabular-nums ${
                        isMin ? 'text-profit font-semibold' : isMax ? 'text-loss font-semibold' : 'text-foreground'
                      }`}
                    >
                      ${formatPrice(price)}
                    </td>
                  );
                })}
                <td className="text-right py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    spread >= 1 ? 'bg-profit/10 text-profit' : spread >= 0.3 ? 'bg-warning/10 text-warning' : 'text-muted-foreground'
                  }`}>
                    {spread.toFixed(2)}%
                  </span>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
