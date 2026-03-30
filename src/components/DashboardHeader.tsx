import { Link } from 'react-router-dom';
import { Wifi, WifiOff, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  isScanning: boolean;
  soundEnabled: boolean;
  onToggleScanning: () => void;
  onToggleSound: () => void;
  signalCount: number;
}

export function DashboardHeader({
  isScanning,
  soundEnabled,
  onToggleScanning,
  onToggleSound,
  signalCount,
}: HeaderProps) {
  return (
    <header className="border-b border-border bg-card/80 px-4 py-4 backdrop-blur-sm md:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-lg font-bold font-mono tracking-tight text-foreground transition-opacity hover:opacity-90 sm:text-xl">
              SPREAD<span className="text-primary">NEST</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:gap-3">
          {signalCount > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 rounded-md border border-signal/30 bg-signal/10 px-3 py-1.5 text-xs font-mono font-semibold text-signal"
            >
              <span className="animate-pulse-glow">●</span>
              {signalCount} SIGNAL{signalCount > 1 ? 'S' : ''}
            </motion.div>
          )}

          <button
            onClick={onToggleSound}
            className="rounded-md bg-secondary p-2 text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
          </button>

          <button
            onClick={onToggleScanning}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-mono font-semibold transition-all sm:px-4 sm:text-sm ${
              isScanning
                ? 'border border-primary/30 bg-primary/10 text-primary glow-green'
                : 'border border-border bg-secondary text-muted-foreground'
            }`}
          >
            {isScanning ? (
              <>
                <Wifi className="h-4 w-4 animate-pulse-glow" />
                SCANNING
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" />
                PAUSED
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
