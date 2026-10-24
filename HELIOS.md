# Helios Desk: how to run it

## What changed in this version
- **Core fixed.** `store.ts` did not compile and its trading loop reset sim markets every tick. The logic now lives in one pure ledger (`src/lib/trading/ledger.ts`) used by both the server worker and the browser fallback.
- **Real settlement.** Paper positions on real Polymarket markets settle only when Polymarket reports a resolution (before, only sim windows ever settled).
- **Honest fills.** Paper fills pay ask + slippage + fee; resting orders expire after 90 s; one open position per market.
- **Model.** `helios-btc-0.5`: rolling realised volatility blended with a prior; window-open prices recovered from Coinbase candles. It never trades the raw model: it trades the market price plus a learned share (the "model trust" weight, refit from settled real trades) of the model's disagreement. Costs use Polymarket's crypto taker fee (0.07 × price × (1 − price) per share, about 1.75¢ at 50¢). Up/Down windows wait 45s after the open, and stake scales with edge (a thin edge gets a quarter of the cap).
- **24/7 paper trial.** `npm run worker` runs the desk with no browser. State survives restarts (`data/desk.json`, `data/journal.jsonl`).
- **Trial page.** Counts only real-market trades: P&L, profit factor, drawdown, Brier score of model vs market price, breakdowns, and a live-eligibility checklist.
- **Live page.** Dry-run and armed modes behind env keys + owner token + passed gate + typed phrase + hard caps. The kill switch disarms it.
- **Context signals.** Polymarket crowd odds on BTC/macro, Fear & Greed, optional World Monitor adapter.

## Run it
```bash
npm install
npm run worker        # terminal 1: the 24/7 desk
npm run dev           # terminal 2: the UI on :8080 (same machine, same data dir)
```
Without the worker the UI runs a paper desk inside the tab (stops when you close it).
Run both under pm2/systemd on a VPS. They must share `HELIOS_DATA_DIR`, so Vercel serverless cannot host the worker; keep the UI on the same box.

## The week-long test
1. Start the worker, set Mode to Auto (paper), leave limits alone.
2. Check **Trial** daily. The gate needs 7 days, 100 settled real-market trades, positive net P&L after costs, profit factor >= 1.1, model Brier better than market Brier, and drawdown inside the breaker.
3. Changed the model? Press **Reset trial** so old results cannot flatter the new version.

Passing the gate is not proof of an edge: 100 trades cannot separate a small edge from luck. Aim for 300+.

## Going live (only after the gate passes)
1. Set the live env vars (`.env.example`) on the server and restart the worker.
2. Run **Dry run** for a day and read the audit log: sizes, prices, token ids.
3. Arm with the typed phrase. Start with the default caps ($5 per order, $25 open, $10/day loss).
4. Compare Live P&L to paper P&L. A big gap means paper fills are too optimistic.

The live module is tested against a mock exchange only. It has not touched the real CLOB from the build environment. Check Polymarket's current terms and eligibility for your location first.

## World Monitor
- REST API is on paid plans (API Starter was $99.99/month when checked; the free tier has no REST key).
- Its prediction-market endpoint relays Polymarket Gamma data, so it adds nothing for Polymarket prices, which Helios reads free.
- Set `WORLDMONITOR_API_KEY` for its Fear & Greed read and extra regime data. Endpoint paths come from public docs and are parsed defensively; the Trial page shows ok/error. On any mismatch it falls back to free sources.

## polymarket-terminal
Included unchanged next to this folder. It is the execution toolbox (maker-rebate MM, copy trader, sniper). Helios is the research and control layer; the terminal bots are separate strategies and are not wired to Helios signals.

## Known pre-existing failures
8 tests in `scripts/grok-pwa-plugin.test.mjs` and `brand-check.test.mjs` (platform share-card metadata) fail in this export, unrelated to trading. eslint flags one empty block in `src/lib/app-data/client.server.ts`.


## Accounts, keys and backtest (latest)

- Run two processes: `npm run worker` (24/7 desks for every user) and `npm run dev` (or the built app).
- Set `HELIOS_MASTER_KEY` first. Sign up at `/login`; set `HELIOS_ALLOW_SIGNUP=0` afterwards if it is just you.
- Each user saves their own Polymarket key, funder address and optional webhook on `/account`. Keys are encrypted at rest and
  never sent back to the browser. Storing a trading key on a server is a real risk: use a dedicated wallet with a small balance.
- Live trading needs: `HELIOS_LIVE_ENABLED=1`, saved key and funder, a passed trial gate, the typed phrase, and the hard caps.
- Real-data backtest: `/lab` (needs server internet access) or `npm run backtest -- --days 7 --max 400`. Settings are picked on a
  validation slice and the test slice is scored once. A good backtest is not proof of an edge.
- The owner-token instructions earlier in this file are obsolete; accounts replaced them.
- Not tested against real services from the build sandbox (no network): Polymarket, Coinbase, World Monitor and the live CLOB path.
  Run the backtest and a paper trial on your own machine first.

## Newer additions
- Signals page: "why blocked" summary, search and window filters. Book page: trade detail and CSV export. Desk page: Today panel.
- Trial page: calibration note and a shadow momentum model scored beside the baseline (never traded).
- Account page: backup/restore and phone alerts (ntfy, Telegram, Discord, Slack).
- `npm run doctor` checks which data sources this machine can reach. VPS: see DEPLOY.md.
- Practice windows are off by default. `HELIOS_SIM_WINDOWS=1` turns them on.
- Storage without a disk: set `HELIOS_DATABASE_URL` (Neon). See DEPLOY.md. `npm run neon:check` shows what is saved.

## Reading the numbers (why pages differ)
- Trial and Audit: every settled trade on a real Polymarket window since the last reset. Practice windows are excluded.
- Book: the whole paper account (cash-based), practice trades and open positions included.
- Desk "Last 24 hours": same record as Trial, rolling 24h. "Equity change today": paper account incl. open positions.
- Reset the trial after upgrading the model or fee settings so old results do not mix with new ones.
