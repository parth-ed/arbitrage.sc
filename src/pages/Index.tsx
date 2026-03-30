import { useEffect } from 'react';
import { useArbitrageScanner } from '@/hooks/useArbitrageScanner';
import { useAlertSound } from '@/hooks/useAlertSound';
import { DashboardHeader } from '@/components/DashboardHeader';
import { SignalFeed } from '@/components/SignalFeed';
import { SignalHistory } from '@/components/SignalHistory';
import { PriceTable } from '@/components/PriceTable';
import { AlertTriangle } from 'lucide-react';

const EXCHANGES_COUNT = 8;

const Index = () => {
  const {
    coins,
    signals,
    history,
    isScanning,
    error,
    toggleScanning,
    clearSignals,
    clearHistory,
    onNewSignal,
  } = useArbitrageScanner();

  const { playAlert, soundEnabled, setSoundEnabled } = useAlertSound();

  useEffect(() => {
    onNewSignal(() => playAlert());
  }, [onNewSignal, playAlert]);

  return (
    <div className="flex flex-col h-screen bg-background terminal-grid">
      <DashboardHeader
        isScanning={isScanning}
        soundEnabled={soundEnabled}
        onToggleScanning={toggleScanning}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        signalCount={signals.length}
      />

      {error && (
        <div className="mx-6 mt-4 flex items-center gap-2 px-4 py-2 rounded-md bg-warning/10 border border-warning/30 text-warning text-xs font-mono">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-semibold font-mono text-foreground">
                LIVE PRICES - {EXCHANGES_COUNT} EXCHANGES x {coins.length} COINS
              </h2>
            </div>
            <PriceTable coins={coins} />
          </div>
        </div>

        <div className="w-80 border-l border-border bg-card/50 hidden md:flex flex-col">
          <div className="flex-1 overflow-hidden border-b border-border">
            <SignalFeed signals={signals} onClear={clearSignals} />
          </div>
          <div className="flex-1 overflow-hidden">
            <SignalHistory history={history} onClear={clearHistory} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
