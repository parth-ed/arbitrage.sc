export const EXCHANGES = [
  { id: 'binance', name: 'Binance', url: 'https://www.binance.com/', color: '#F0B90B', takerFee: 0.10, withdrawalFee: 0.0005 },
  { id: 'bybit', name: 'Bybit', url: 'https://www.bybit.com/', color: '#F7A600', takerFee: 0.10, withdrawalFee: 0.0005 },
  { id: 'kraken', name: 'Kraken', url: 'https://www.kraken.com/', color: '#5741D9', takerFee: 0.26, withdrawalFee: 0.00015 },
  { id: 'coinbase', name: 'Coinbase', url: 'https://www.coinbase.com/', color: '#0052FF', takerFee: 0.40, withdrawalFee: 0.0 },
  { id: 'kucoin', name: 'KuCoin', url: 'https://www.kucoin.com/', color: '#23AF91', takerFee: 0.10, withdrawalFee: 0.0005 },
  { id: 'gate', name: 'Gate.io', url: 'https://www.gate.io/', color: '#2354E6', takerFee: 0.20, withdrawalFee: 0.001 },
  { id: 'htx', name: 'HTX', url: 'https://www.htx.com/', color: '#2BAF72', takerFee: 0.20, withdrawalFee: 0.001 },
  { id: 'okx', name: 'OKX', url: 'https://www.okx.com/', color: '#FFFFFF', takerFee: 0.10, withdrawalFee: 0.0004 },
] as const;

export type ExchangeId = typeof EXCHANGES[number]['id'];
export type ExchangeInfo = typeof EXCHANGES[number];

export function getExchangeByName(name: string): ExchangeInfo | undefined {
  return EXCHANGES.find((exchange) => exchange.name === name);
}

export const TOP_25_COINS = [
  'bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana',
  'ripple', 'usd-coin', 'dogecoin', 'cardano', 'tron',
  'avalanche-2', 'chainlink', 'polkadot', 'polygon', 'shiba-inu',
  'litecoin', 'uniswap', 'bitcoin-cash', 'stellar', 'cosmos',
  'monero', 'ethereum-classic', 'filecoin', 'aptos', 'arbitrum',
] as const;

export const COIN_SYMBOLS: Record<string, string> = {
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

export interface ExchangePrice {
  exchange: ExchangeId;
  price: number;
  volume24h: number;
  lastUpdated: number;
}

export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  prices: ExchangePrice[];
}

export interface ArbitrageSignal {
  id: string;
  coin: string;
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  profitMargin: number;
  profitAmount: number;
  buyFee: number;
  sellFee: number;
  totalFees: number;
  netProfitMargin: number;
  netProfitAmount: number;
  timestamp: number;
  signalKey: string;
  firstSeen: number;
  netProfitMarginSum: number;
  observationCount: number;
  averageNetProfitMargin: number;
  peakNetProfitMargin: number;
}

export interface HistorySignal extends ArbitrageSignal {
  expiredAt: number;
  duration: number;
}
