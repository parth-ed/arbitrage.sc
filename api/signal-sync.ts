import { createClient } from '@supabase/supabase-js';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const MIN_PROFIT_MARGIN = 4.0;
const KEEP_ALIVE_MARGIN = 1.5;
const ACTIONABLE_TIME = 60000;
const SYNC_CACHE_MS = 2 * 60 * 1000;

const EXCHANGES = [
  { id: 'binance', name: 'Binance', takerFee: 0.10 },
  { id: 'bybit', name: 'Bybit', takerFee: 0.10 },
  { id: 'kraken', name: 'Kraken', takerFee: 0.26 },
  { id: 'coinbase', name: 'Coinbase', takerFee: 0.40 },
  { id: 'kucoin', name: 'KuCoin', takerFee: 0.10 },
  { id: 'gate', name: 'Gate.io', takerFee: 0.20 },
  { id: 'htx', name: 'HTX', takerFee: 0.20 },
  { id: 'okx', name: 'OKX', takerFee: 0.10 },
] as const;

const TOP_25_COINS = [
  'bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana',
  'ripple', 'usd-coin', 'dogecoin', 'cardano', 'tron',
  'avalanche-2', 'chainlink', 'polkadot', 'polygon', 'shiba-inu',
  'litecoin', 'uniswap', 'bitcoin-cash', 'stellar', 'cosmos',
  'monero', 'ethereum-classic', 'filecoin', 'aptos', 'arbitrum',
] as const;

const COIN_SYMBOLS: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  tether: 'USDT',
  binancecoin: 'BNB',
  solana: 'SOL',
  ripple: 'XRP',
  'usd-coin': 'USDC',
  dogecoin: 'DOGE',
  cardano: 'ADA',
  tron: 'TRX',
  'avalanche-2': 'AVAX',
  chainlink: 'LINK',
  polkadot: 'DOT',
  polygon: 'MATIC',
  'shiba-inu': 'SHIB',
  litecoin: 'LTC',
  uniswap: 'UNI',
  'bitcoin-cash': 'BCH',
  stellar: 'XLM',
  cosmos: 'ATOM',
  monero: 'XMR',
  'ethereum-classic': 'ETC',
  filecoin: 'FIL',
  aptos: 'APT',
  arbitrum: 'ARB',
};

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

function simulateExchangePrices(basePrice: number, coinId: string) {
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
      volume24h: basePrice * (1000 + ((pairSeed % 50000) + 1000)),
    };
  });
}

function makeSignalKey(coinId: string, buyExchange: string, sellExchange: string) {
  return `${coinId}:${buyExchange}:${sellExchange}`;
}

export default async function handler(_req: any, res: any) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: 'Missing Supabase server credentials' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const now = Date.now();

    const { data: latestMarketRow, error: latestMarketError } = await supabase
      .from('market_prices')
      .select('last_updated')
      .order('last_updated', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestMarketError) {
      throw latestMarketError;
    }

    if (latestMarketRow?.last_updated) {
      const lastUpdatedAt = new Date(latestMarketRow.last_updated).getTime();
      if (now - lastUpdatedAt < SYNC_CACHE_MS) {
        return res.status(200).json({
          ok: true,
          cached: true,
          lastUpdated: latestMarketRow.last_updated,
        });
      }
    }

    const ids = TOP_25_COINS.join(',');
    const response = await fetch(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=25&page=1&sparkline=false`
    );

    if (!response.ok) {
      const { data: activeSignals } = await supabase.from('active_signals').select('signal_key').limit(1);
      const { data: marketRows } = await supabase.from('market_prices').select('row_key').limit(1);

      if ((activeSignals?.length ?? 0) > 0 || (marketRows?.length ?? 0) > 0) {
        return res.status(200).json({
          ok: true,
          cached: true,
          stale: true,
          warning: `CoinGecko error ${response.status}`,
        });
      }

      return res.status(response.status).json({ error: `CoinGecko error ${response.status}` });
    }

    const data = await response.json();

    const coins = data.map((coin: any) => ({
      id: coin.id,
      symbol: COIN_SYMBOLS[coin.id] || coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image,
      prices: simulateExchangePrices(coin.current_price, coin.id),
    }));

    const marketRows = coins.flatMap((coin: any) =>
      coin.prices.map((price: any) => ({
        row_key: `${coin.id}:${price.exchange}`,
        coin_id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        image: coin.image,
        exchange: price.exchange,
        price: price.price,
        volume_24h: price.volume24h,
        last_updated: new Date(now).toISOString(),
      }))
    );

    const { data: existingSignals, error: existingError } = await supabase.from('active_signals').select('*');
    if (existingError) {
      throw existingError;
    }

    const previousByKey = new Map((existingSignals ?? []).map((signal: any) => [signal.signal_key, signal]));
    const nextSignals: any[] = [];

    for (const coin of coins) {
      const prices = coin.prices.filter((price: any) => price.price > 0);
      if (prices.length < 2) continue;

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
          const profitMargin = (grossProfit / buyPrice.price) * 100;
          const netProfitMargin = (netProfit / buyPrice.price) * 100;
          const signalKey = makeSignalKey(coin.id, buyExchange.name, sellExchange.name);
          const previous = previousByKey.get(signalKey);
          const threshold = previous ? KEEP_ALIVE_MARGIN : MIN_PROFIT_MARGIN;

          if (netProfitMargin >= threshold) {
            const observationCount = previous ? previous.observation_count + 1 : 1;
            const netProfitMarginSum = previous ? Number(previous.net_profit_margin_sum) + netProfitMargin : netProfitMargin;
            const peakNetProfitMargin = previous
              ? Math.max(Number(previous.peak_net_profit_margin), netProfitMargin)
              : netProfitMargin;
            const firstSeen = previous ? previous.first_seen : new Date(now).toISOString();

            nextSignals.push({
              signal_key: signalKey,
              coin_id: coin.id,
              coin: coin.name,
              symbol: coin.symbol,
              buy_exchange: buyExchange.name,
              sell_exchange: sellExchange.name,
              buy_price: buyPrice.price,
              sell_price: sellPrice.price,
              profit_margin: profitMargin,
              profit_amount: grossProfit,
              buy_fee: buyFee,
              sell_fee: sellFee,
              total_fees: totalFees,
              net_profit_margin: netProfitMargin,
              net_profit_amount: netProfit,
              timestamp: new Date(now).toISOString(),
              first_seen: firstSeen,
              net_profit_margin_sum: netProfitMarginSum,
              observation_count: observationCount,
              average_net_profit_margin: netProfitMarginSum / observationCount,
              peak_net_profit_margin: peakNetProfitMargin,
            });
          }
        }
      }
    }

    const nextKeys = new Set(nextSignals.map((signal) => signal.signal_key));
    const expiredSignals = (existingSignals ?? []).filter((signal: any) => {
      const duration = now - new Date(signal.first_seen).getTime();
      return !nextKeys.has(signal.signal_key) && duration >= ACTIONABLE_TIME;
    });

    if (expiredSignals.length > 0) {
      const historyRows = expiredSignals.map((signal: any) => ({
        symbol: signal.symbol,
        buy_exchange: signal.buy_exchange,
        sell_exchange: signal.sell_exchange,
        buy_price: signal.buy_price,
        sell_price: signal.sell_price,
        average_net_profit_margin: signal.average_net_profit_margin,
        peak_net_profit_margin: signal.peak_net_profit_margin,
        net_profit_amount: signal.net_profit_amount,
        duration: now - new Date(signal.first_seen).getTime(),
        expired_at: new Date(now).toISOString(),
      }));

      const { error: historyError } = await supabase.from('signal_history').insert(historyRows);
      if (historyError) {
        throw historyError;
      }
    }

    const staleKeys = (existingSignals ?? [])
      .map((signal: any) => signal.signal_key)
      .filter((signalKey: string) => !nextKeys.has(signalKey));

    if (marketRows.length > 0) {
      const { error: marketError } = await supabase.from('market_prices').upsert(marketRows, { onConflict: 'row_key' });
      if (marketError) {
        throw marketError;
      }
    }

    if (nextSignals.length > 0) {
      const { error: activeError } = await supabase.from('active_signals').upsert(nextSignals, { onConflict: 'signal_key' });
      if (activeError) {
        throw activeError;
      }
    }

    if (staleKeys.length > 0) {
      const { error: deleteError } = await supabase.from('active_signals').delete().in('signal_key', staleKeys);
      if (deleteError) {
        throw deleteError;
      }
    }

    return res.status(200).json({
      ok: true,
      cached: false,
      activeSignals: nextSignals.length,
      expiredSignals: expiredSignals.length,
      marketRows: marketRows.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown sync error';
    return res.status(500).json({ error: message });
  }
}
