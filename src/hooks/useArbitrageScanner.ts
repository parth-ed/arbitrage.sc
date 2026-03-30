import { useState, useEffect, useCallback, useRef } from 'react';
import { CoinData, ArbitrageSignal, HistorySignal } from '@/lib/exchanges';
import { supabase } from '@/lib/supabase';

const REFRESH_INTERVAL = 15000;
const MAX_HISTORY = 200;
const SYNC_COOLDOWN_MS = 3 * 60 * 1000;

interface MarketPriceRow {
  row_key: string;
  coin_id: string;
  symbol: string;
  name: string;
  image: string;
  exchange: string;
  price: string | number;
  volume_24h: string | number;
  last_updated: string;
}

interface ActiveSignalRow {
  signal_key: string;
  coin_id: string;
  coin: string;
  symbol: string;
  buy_exchange: string;
  sell_exchange: string;
  buy_price: string | number;
  sell_price: string | number;
  profit_margin: string | number;
  profit_amount: string | number;
  buy_fee: string | number;
  sell_fee: string | number;
  total_fees: string | number;
  net_profit_margin: string | number;
  net_profit_amount: string | number;
  timestamp: string;
  first_seen: string;
  net_profit_margin_sum: string | number;
  observation_count: number;
  average_net_profit_margin: string | number;
  peak_net_profit_margin: string | number;
}

interface HistorySignalRow {
  id: string;
  symbol: string;
  buy_exchange: string;
  sell_exchange: string;
  buy_price: string | number;
  sell_price: string | number;
  average_net_profit_margin: string | number;
  peak_net_profit_margin: string | number;
  net_profit_amount: string | number;
  duration: number;
  expired_at: string;
  created_at: string;
}

function toNumber(value: string | number) {
  return typeof value === 'number' ? value : Number(value);
}

function mapMarketRows(rows: MarketPriceRow[]): CoinData[] {
  const grouped = new Map<string, CoinData>();

  rows.forEach((row) => {
    if (!grouped.has(row.coin_id)) {
      grouped.set(row.coin_id, {
        id: row.coin_id,
        symbol: row.symbol,
        name: row.name,
        image: row.image,
        prices: [],
      });
    }

    grouped.get(row.coin_id)?.prices.push({
      exchange: row.exchange as CoinData['prices'][number]['exchange'],
      price: toNumber(row.price),
      volume24h: toNumber(row.volume_24h),
      lastUpdated: new Date(row.last_updated).getTime(),
    });
  });

  return Array.from(grouped.values());
}

function mapActiveSignals(rows: ActiveSignalRow[]): ArbitrageSignal[] {
  return rows.map((row) => ({
    id: row.signal_key,
    coin: row.coin,
    symbol: row.symbol,
    buyExchange: row.buy_exchange,
    sellExchange: row.sell_exchange,
    buyPrice: toNumber(row.buy_price),
    sellPrice: toNumber(row.sell_price),
    profitMargin: toNumber(row.profit_margin),
    profitAmount: toNumber(row.profit_amount),
    buyFee: toNumber(row.buy_fee),
    sellFee: toNumber(row.sell_fee),
    totalFees: toNumber(row.total_fees),
    netProfitMargin: toNumber(row.net_profit_margin),
    netProfitAmount: toNumber(row.net_profit_amount),
    timestamp: new Date(row.timestamp).getTime(),
    signalKey: row.signal_key,
    firstSeen: new Date(row.first_seen).getTime(),
    netProfitMarginSum: toNumber(row.net_profit_margin_sum),
    observationCount: row.observation_count,
    averageNetProfitMargin: toNumber(row.average_net_profit_margin),
    peakNetProfitMargin: toNumber(row.peak_net_profit_margin),
  }));
}

function mapHistoryRows(rows: HistorySignalRow[]): HistorySignal[] {
  return rows.map((row) => ({
    id: row.id,
    coin: row.symbol,
    symbol: row.symbol,
    buyExchange: row.buy_exchange,
    sellExchange: row.sell_exchange,
    buyPrice: toNumber(row.buy_price),
    sellPrice: toNumber(row.sell_price),
    profitMargin: 0,
    profitAmount: 0,
    buyFee: 0,
    sellFee: 0,
    totalFees: 0,
    netProfitMargin: toNumber(row.average_net_profit_margin),
    netProfitAmount: toNumber(row.net_profit_amount),
    timestamp: new Date(row.expired_at).getTime(),
    signalKey: `${row.symbol}:${row.buy_exchange}:${row.sell_exchange}:${row.expired_at}`,
    firstSeen: new Date(row.created_at).getTime() - row.duration,
    netProfitMarginSum: toNumber(row.average_net_profit_margin),
    observationCount: 1,
    averageNetProfitMargin: toNumber(row.average_net_profit_margin),
    peakNetProfitMargin: toNumber(row.peak_net_profit_margin),
    expiredAt: new Date(row.expired_at).getTime(),
    duration: row.duration,
  }));
}

async function triggerSharedSync() {
  const cacheKey = 'spreadnest-last-sync';
  const lastSync = Number(window.localStorage.getItem(cacheKey) ?? '0');

  if (Date.now() - lastSync < SYNC_COOLDOWN_MS) {
    return;
  }

  const response = await fetch('/api/signal-sync', { method: 'GET' });
  if (!response.ok) {
    throw new Error('Could not sync shared signal data');
  }

  window.localStorage.setItem(cacheKey, String(Date.now()));
}

export function useArbitrageScanner() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [signals, setSignals] = useState<ArbitrageSignal[]>([]);
  const [history, setHistory] = useState<HistorySignal[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [lastSweep, setLastSweep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const newSignalCallback = useRef<((signal: ArbitrageSignal) => void) | null>(null);
  const previousSignalKeysRef = useRef<Set<string>>(new Set());

  const onNewSignal = useCallback((cb: (signal: ArbitrageSignal) => void) => {
    newSignalCallback.current = cb;
  }, []);

  const loadSharedData = useCallback(async () => {
    if (!supabase) {
      setError('Supabase is not configured');
      return;
    }

    try {
      setError(null);

      try {
        await triggerSharedSync();
      } catch (syncError) {
        console.error(syncError);
      }

      const [{ data: marketData, error: marketError }, { data: activeData, error: activeError }, { data: historyData, error: historyError }] =
        await Promise.all([
          supabase.from('market_prices').select('*').order('coin_id', { ascending: true }),
          supabase.from('active_signals').select('*').order('net_profit_margin', { ascending: false }),
          supabase.from('signal_history').select('*').order('expired_at', { ascending: false }).limit(MAX_HISTORY),
        ]);

      if (marketError) throw marketError;
      if (activeError) throw activeError;
      if (historyError) throw historyError;

      const nextCoins = mapMarketRows((marketData ?? []) as MarketPriceRow[]);
      const nextSignals = mapActiveSignals((activeData ?? []) as ActiveSignalRow[]);
      const nextHistory = mapHistoryRows((historyData ?? []) as HistorySignalRow[]);

      const previousKeys = previousSignalKeysRef.current;
      nextSignals
        .filter((signal) => !previousKeys.has(signal.signalKey))
        .forEach((signal) => newSignalCallback.current?.(signal));

      previousSignalKeysRef.current = new Set(nextSignals.map((signal) => signal.signalKey));
      setCoins(nextCoins);
      setSignals(nextSignals);
      setHistory(nextHistory);

      const latestUpdate = nextCoins
        .flatMap((coin) => coin.prices.map((price) => price.lastUpdated))
        .sort((a, b) => b - a)[0];

      if (latestUpdate) {
        setLastSweep(latestUpdate);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load shared signal data');
    }
  }, []);

  useEffect(() => {
    loadSharedData();
  }, [loadSharedData]);

  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(loadSharedData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [isScanning, loadSharedData]);

  const toggleScanning = useCallback(() => setIsScanning((prev) => !prev), []);
  const clearSignals = useCallback(() => setSignals([]), []);
  const clearHistory = useCallback(() => setHistory([]), []);

  return {
    coins,
    signals,
    history,
    isScanning,
    lastSweep,
    error,
    toggleScanning,
    clearSignals,
    clearHistory,
    onNewSignal,
  };
}
