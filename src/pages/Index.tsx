import { useEffect } from 'react';
import { useArbitrageScanner } from '@/hooks/useArbitrageScanner';
import { useAlertSound } from '@/hooks/useAlertSound';
import { DashboardHeader } from '@/components/DashboardHeader';
import { SignalFeed } from '@/components/SignalFeed';
import { PriceTable } from '@/components/PriceTable';
import { AlertTriangle } from 'lucide-react';

const EXCHANGES_COUNT = 8;

const Index = () => {
  const {
    coins,
    signals,
    isScanning,
    error,
    toggleScanning,
    clearSignals,
    onNewSignal,
  } = useArbitrageScanner();

  const { playAlert, soundEnabled, setSoundEnabled } = useAlertSound();

  useEffect(() => {
    onNewSignal(() => playAlert());
  }, [onNewSignal, playAlert]);

  return (
    <div className="flex min-h-screen flex-col bg-background terminal-grid">
      <DashboardHeader
        isScanning={isScanning}
        soundEnabled={soundEnabled}
        onToggleScanning={toggleScanning}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        signalCount={signals.length}
      />

      {error && (
        <div className="mx-4 mt-4 flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-4 py-2 text-xs font-mono text-warning md:mx-6">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-xs font-semibold font-mono text-foreground sm:text-sm">
                LIVE PRICES - {EXCHANGES_COUNT} EXCHANGES x {coins.length} COINS
              </h2>
            </div>
            <PriceTable coins={coins} />
          </div>
        </div>

        <div className="border-t border-border bg-card/50 md:flex md:w-80 md:flex-col md:border-l md:border-t-0">
          <div className="max-h-[60vh] overflow-hidden md:max-h-none md:flex-1">
            <SignalFeed signals={signals} onClear={clearSignals} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
