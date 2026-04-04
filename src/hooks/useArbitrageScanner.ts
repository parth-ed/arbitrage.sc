import { useState, useEffect, useCallback, useRef } from 'react';
import { CoinData, ArbitrageSignal, EXCHANGES, TOP_25_COINS, COIN_SYMBOLS } from '@/lib/exchanges';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const REFRESH_INTERVAL = 30000;
const MIN_PROFIT_MARGIN = 4.0;
const KEEP_ALIVE_MARGIN = 1.5;

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

  return EXCHANGES.map((exchange) => {
    const pairSeed = simpleHash(`${coinId}:${exchange.id}`);
    const baseVariance = ((pairSeed % 200) - 100) / 5000;
    const noise1 = slowNoise(pairSeed, timeMinutes);
    const noise2 = slowNoise(pairSeed, timeMinutes + 1);
    const smoothNoise = noise1 * (1 - timeFraction) + noise2 * timeFraction;
    const totalVariance = baseVariance + (smoothNoise - 0.5) * 0.03;

    return {
      exchange: exchange.id,
      price: basePrice * (1 + totalVariance),
      volume: basePrice * (1000 + ((pairSeed % 50000) + 1000)),
    };
  });
}

function makeSignalKey(coinId: string, buyExchange: string, sellExchange: string) {
  return `${coinId}:${buyExchange}:${sellExchange}`;
}

export function useArbitrageScanner() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [signals, setSignals] = useState<ArbitrageSignal[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [lastSweep, setLastSweep] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const newSignalCallback = useRef<((signal: ArbitrageSignal) => void) | null>(null);
  const previousSignalsRef = useRef<ArbitrageSignal[]>([]);

  const onNewSignal = useCallback((cb: (signal: ArbitrageSignal) => void) => {
    newSignalCallback.current = cb;
  }, []);

  const fetchPrices = useCallback(async () => {
    try {
      setError(null);
      const ids = TOP_25_COINS.join(',');
      const response = await fetch(
        `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=25&page=1&sparkline=false`
      );

      if (!response.ok) {
        if (response.status === 429) {
          setError('Rate limited. Showing the last successful scan.');
          return;
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const now = Date.now();

      const nextCoins: CoinData[] = data.map((coin: any) => ({
        id: coin.id,
        symbol: COIN_SYMBOLS[coin.id] || coin.symbol.toUpperCase(),
        name: coin.name,
        image: coin.image,
        prices: simulateExchangePrices(coin.current_price, coin.id).map((price) => ({
          exchange: price.exchange,
          price: price.price,
          volume24h: price.volume,
          lastUpdated: now,
        })),
      }));

      setCoins(nextCoins);
      setLastSweep(now);

      const previousByKey = new Map(previousSignalsRef.current.map((signal) => [signal.signalKey, signal]));
      const nextSignals: ArbitrageSignal[] = [];

      nextCoins.forEach((coin) => {
        const prices = coin.prices.filter((price) => price.price > 0);
        if (prices.length < 2) return;

        for (let i = 0; i < prices.length; i++) {
          for (let j = 0; j < prices.length; j++) {
            if (i === j) continue;

            const buyPrice = prices[i];
            const sellPrice = prices[j];
            if (sellPrice.price <= buyPrice.price) continue;

            const buyExchange = EXCHANGES.find((exchange) => exchange.id === buyPrice.exchange);
            const sellExchange = EXCHANGES.find((exchange) => exchange.id === sellPrice.exchange);
            if (!buyExchange || !sellExchange) continue;

            const buyFee = buyPrice.price * (buyExchange.takerFee / 100);
            const sellFee = sellPrice.price * (sellExchange.takerFee / 100);
            const totalFees = buyFee + sellFee;
            const grossProfit = sellPrice.price - buyPrice.price;
            const netProfit = grossProfit - totalFees;
            const netProfitMargin = (netProfit / buyPrice.price) * 100;
            const signalKey = makeSignalKey(coin.id, buyExchange.name, sellExchange.name);
            const previous = previousByKey.get(signalKey);
            const threshold = previous ? KEEP_ALIVE_MARGIN : MIN_PROFIT_MARGIN;

            if (netProfitMargin >= threshold) {
              const observationCount = previous ? previous.observationCount + 1 : 1;
              const netProfitMarginSum = previous ? previous.netProfitMarginSum + netProfitMargin : netProfitMargin;
              const peakNetProfitMargin = previous
                ? Math.max(previous.peakNetProfitMargin, netProfitMargin)
                : netProfitMargin;

              nextSignals.push({
                id: `${coin.id}-${buyExchange.id}-${sellExchange.id}-${now}`,
                coin: coin.name,
                symbol: coin.symbol,
                buyExchange: buyExchange.name,
                sellExchange: sellExchange.name,
                buyPrice: buyPrice.price,
                sellPrice: sellPrice.price,
                profitMargin: (grossProfit / buyPrice.price) * 100,
                profitAmount: grossProfit,
                buyFee,
                sellFee,
                totalFees,
                netProfitMargin,
                netProfitAmount: netProfit,
                timestamp: now,
                signalKey,
                firstSeen: previous ? previous.firstSeen : now,
                netProfitMarginSum,
                observationCount,
                averageNetProfitMargin: netProfitMarginSum / observationCount,
                peakNetProfitMargin,
              });
            }
          }
        }
      });

      nextSignals.sort((a, b) => b.netProfitMargin - a.netProfitMargin);

      const previousKeys = new Set(previousSignalsRef.current.map((signal) => signal.signalKey));
      nextSignals
        .filter((signal) => !previousKeys.has(signal.signalKey))
        .forEach((signal) => newSignalCallback.current?.(signal));

      previousSignalsRef.current = nextSignals;
      setSignals(nextSignals);
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

  return {
    coins,
    signals,
    isScanning,
    lastSweep,
    error,
    toggleScanning,
    clearSignals,
    onNewSignal,
  };
}
