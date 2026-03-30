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
    <header className="border-b border-border bg-card/80 backdrop-blur-sm px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-xl font-bold font-mono tracking-tight text-foreground hover:opacity-90 transition-opacity">
              SPREAD<span className="text-primary">NEST</span>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {signalCount > 0 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-signal/10 border border-signal/30 text-signal text-xs font-mono font-semibold"
            >
              <span className="animate-pulse-glow">●</span>
              {signalCount} SIGNAL{signalCount > 1 ? 'S' : ''}
            </motion.div>
          )}

          <button
            onClick={onToggleSound}
            className="p-2 rounded-md bg-secondary hover:bg-secondary/80 transition-colors text-secondary-foreground"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
          </button>

          <button
            onClick={onToggleScanning}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-mono font-semibold transition-all ${
              isScanning
                ? 'bg-primary/10 border border-primary/30 text-primary glow-green'
                : 'bg-secondary border border-border text-muted-foreground'
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
