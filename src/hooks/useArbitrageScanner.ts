import { useState, useEffect, useCallback, useRef } from 'react';
import { CoinData, ArbitrageSignal, HistorySignal, EXCHANGES, TOP_25_COINS, COIN_SYMBOLS } from '@/lib/exchanges';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const REFRESH_INTERVAL = 10000;
const MIN_PROFIT_MARGIN = 4.0;
const KEEP_ALIVE_MARGIN = 1.5;
const ACTIONABLE_TIME = 60000;
const MAX_HISTORY = 200;

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function slowNoise(seed: number, timeMinutes: number): number {
  const x = Math.sin(seed * 12.9898 + timeMinutes * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function simulateExchangePrices(basePrice: number, coinId: string): { exchange: string; price: number; volume: number }[] {
  const timeMinutes = Math.floor(Date.now() / 60000);
  const timeFraction = (Date.now() % 60000) / 60000;

  return EXCHANGES.map((ex) => {
    const pairSeed = simpleHash(`${coinId}:${ex.id}`);
    const baseVariance = ((pairSeed % 200) - 100) / 5000;
    const noise1 = slowNoise(pairSeed, timeMinutes);
    const noise2 = slowNoise(pairSeed, timeMinutes + 1);
    const smoothNoise = noise1 * (1 - timeFraction) + noise2 * timeFraction;
    const fastJitter = (Math.random() - 0.5) * 0.002;
    const totalVariance = baseVariance + (smoothNoise - 0.5) * 0.03 + fastJitter;

    return {
      exchange: ex.id,
      price: basePrice * (1 + totalVariance),
      volume: basePrice * (1000 + Math.random() * 50000),
    };
  });
}

function makeSignalKey(coinId: string, buyExchange: string, sellExchange: string) {
  return `${coinId}:${buyExchange}:${sellExchange}`;
}

export function useArbitrageScanner() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [signals, setSignals] = useState<ArbitrageSignal[]>([]);
  const [history, setHistory] = useState<HistorySignal[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [lastSweep, setLastSweep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const newSignalCallback = useRef<((signal: ArbitrageSignal) => void) | null>(null);
  const prevSignalsRef = useRef<ArbitrageSignal[]>([]);

  const onNewSignal = useCallback((cb: (signal: ArbitrageSignal) => void) => {
    newSignalCallback.current = cb;
  }, []);

  const fetchPrices = useCallback(async () => {
    try {
      setError(null);
      const ids = TOP_25_COINS.join(',');
      const res = await fetch(
        `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=25&page=1&sparkline=false`
      );

      if (!res.ok) {
        if (res.status === 429) {
          setError('Rate limited - will retry shortly');
          return;
        }
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      const now = Date.now();

      const coinData: CoinData[] = data.map((coin: any) => {
        const exchangePrices = simulateExchangePrices(coin.current_price, coin.id);
        return {
          id: coin.id,
          symbol: COIN_SYMBOLS[coin.id] || coin.symbol.toUpperCase(),
          name: coin.name,
          image: coin.image,
          prices: exchangePrices.map((ep) => ({
            exchange: ep.exchange,
            price: ep.price,
            volume24h: ep.volume,
            lastUpdated: now,
          })),
        };
      });

      setCoins(coinData);
      setLastSweep(now);

      const newSignals: ArbitrageSignal[] = [];
      const prevByKey = new Map(prevSignalsRef.current.map((signal) => [signal.signalKey, signal]));

      coinData.forEach((coin) => {
        const prices = coin.prices.filter((price) => price.price > 0);
        if (prices.length < 2) return;

        for (let i = 0; i < prices.length; i++) {
          for (let j = 0; j < prices.length; j++) {
            if (i === j) continue;

            const buyPrice = prices[i];
            const sellPrice = prices[j];
            if (sellPrice.price <= buyPrice.price) continue;

            const buyExInfo = EXCHANGES.find((exchange) => exchange.id === buyPrice.exchange);
            const sellExInfo = EXCHANGES.find((exchange) => exchange.id === sellPrice.exchange);
            if (!buyExInfo || !sellExInfo) continue;

            const buyFee = buyPrice.price * (buyExInfo.takerFee / 100);
            const sellFee = sellPrice.price * (sellExInfo.takerFee / 100);
            const totalFees = buyFee + sellFee;
            const grossProfit = sellPrice.price - buyPrice.price;
            const netProfit = grossProfit - totalFees;
            const netMargin = (netProfit / buyPrice.price) * 100;

            const signalKey = makeSignalKey(coin.id, buyExInfo.name, sellExInfo.name);
            const prevSignal = prevByKey.get(signalKey);
            const threshold = prevSignal ? KEEP_ALIVE_MARGIN : MIN_PROFIT_MARGIN;

            if (netMargin >= threshold) {
              const observationCount = prevSignal ? prevSignal.observationCount + 1 : 1;
              const netProfitMarginSum = prevSignal ? prevSignal.netProfitMarginSum + netMargin : netMargin;
              const peakNetProfitMargin = prevSignal
                ? Math.max(prevSignal.peakNetProfitMargin, netMargin)
                : netMargin;

              newSignals.push({
                id: `${coin.id}-${buyExInfo.id}-${sellExInfo.id}-${now}`,
                coin: coin.name,
                symbol: coin.symbol,
                buyExchange: buyExInfo.name,
                sellExchange: sellExInfo.name,
                buyPrice: buyPrice.price,
                sellPrice: sellPrice.price,
                profitMargin: (grossProfit / buyPrice.price) * 100,
                profitAmount: grossProfit,
                buyFee,
                sellFee,
                totalFees,
                netProfitMargin: netMargin,
                netProfitAmount: netProfit,
                timestamp: now,
                signalKey,
                firstSeen: prevSignal ? prevSignal.firstSeen : now,
                netProfitMarginSum,
                observationCount,
                averageNetProfitMargin: netProfitMarginSum / observationCount,
                peakNetProfitMargin,
              });
            }
          }
        }
      });

      newSignals.sort((a, b) => b.netProfitMargin - a.netProfitMargin);

      const newSignalKeys = new Set(newSignals.map((signal) => signal.signalKey));
      const expiredSignals: HistorySignal[] = prevSignalsRef.current
        .filter((signal) => !newSignalKeys.has(signal.signalKey) && (now - signal.firstSeen) >= ACTIONABLE_TIME)
        .map((signal) => ({
          ...signal,
          expiredAt: now,
          duration: now - signal.firstSeen,
        }));

      if (expiredSignals.length > 0) {
        setHistory((prev) => {
          const combined = [...expiredSignals, ...prev].slice(0, MAX_HISTORY);
          combined.sort((a, b) => b.averageNetProfitMargin - a.averageNetProfitMargin);
          return combined;
        });
      }

      const prevKeySet = new Set(prevSignalsRef.current.map((signal) => signal.signalKey));
      newSignals
        .filter((signal) => !prevKeySet.has(signal.signalKey))
        .forEach((signal) => newSignalCallback.current?.(signal));

      prevSignalsRef.current = newSignals;
      setSignals(newSignals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
    }
  }, []);

  useEffect(() => {
    if (!isScanning) return;
    fetchPrices();
    const interval = setInterval(fetchPrices, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [isScanning, fetchPrices]);

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
