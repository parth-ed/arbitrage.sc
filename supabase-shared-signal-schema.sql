create table if not exists public.market_prices (
  row_key text primary key,
  coin_id text not null,
  symbol text not null,
  name text not null,
  image text not null,
  exchange text not null,
  price numeric not null,
  volume_24h numeric not null,
  last_updated timestamptz not null
);

create table if not exists public.active_signals (
  signal_key text primary key,
  coin_id text not null,
  coin text not null,
  symbol text not null,
  buy_exchange text not null,
  sell_exchange text not null,
  buy_price numeric not null,
  sell_price numeric not null,
  profit_margin numeric not null,
  profit_amount numeric not null,
  buy_fee numeric not null,
  sell_fee numeric not null,
  total_fees numeric not null,
  net_profit_margin numeric not null,
  net_profit_amount numeric not null,
  timestamp timestamptz not null,
  first_seen timestamptz not null,
  net_profit_margin_sum numeric not null,
  observation_count integer not null,
  average_net_profit_margin numeric not null,
  peak_net_profit_margin numeric not null
);

alter table public.market_prices enable row level security;
alter table public.active_signals enable row level security;

create policy "Allow public read market prices"
on public.market_prices
for select
to anon
using (true);

create policy "Allow public read active signals"
on public.active_signals
for select
to anon
using (true);
