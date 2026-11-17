# Helios strategy guide (helios-btc-0.6, "closer")

## 1. The game you are playing
Polymarket's "Bitcoin Up or Down" markets (5m, 15m, 1h, 4h) pay $1 per share if BTC finishes the window above its opening price, else $0.
A share priced at 70¢ means the crowd thinks Up is 70% likely. You make money only when you pay less than the true probability, after fees and spread.

The crowd already sees the same Coinbase/Binance price you see. So "BTC is above the open, buy Up" is not an edge; everyone knows it, and it is already in the price.

## 2. Why 0.5 lost (14W / 33L)
Three things combined:
1. **The model was under-confident late in a window.** It floored the time left at 3 minutes and shrank its z-score by 10%. With 60 seconds left and BTC clearly ahead, the model said "about 70%" while the crowd said "90%".
2. **It always bought the side with the larger gap, which was the crowd's underdog.** Model 70% Yes vs crowd 90% Yes made the *No* side (priced about 10¢) look cheap on paper.
3. **Underdogs lose most of the time.** Buying around 30¢ wins about 30% of trades. Add the fee (1.75¢ per share at 50¢) and spread, and a 30% win rate at ~30¢ is a slow bleed. That is exactly your 47 trades: 14 wins, 33 losses.

The lab reproduces this (`npm run lab:strategy`): in a world where the crowd tracks BTC instantly, 0.5 wins 28% at an average price of 29¢ and loses money. The cause is structural, not bad luck, so no parameter tweak fixes it.

## 3. What 0.6 does instead (plain words)
Wait until the window is mostly decided, then buy the side that is clearly ahead, but only if the crowd is underpricing it by more than every cost.

| Rule | Why |
|---|---|
| Act only in the last 40% of the window (min 60s, max 20 min), and never in the last 20s | Early in a window nothing is decided and the crowd is as informed as you. Last seconds are too risky to fill. |
| BTC must be at least **1.0 standard deviations** from the open | The outcome has to be largely decided, not a coin flip. |
| Buy only the side the model says is ahead, priced **55¢-97¢** | Never buy underdogs. This alone removes the failure above. |
| Net edge (after slippage and fee) at least **2¢** per share | Trade only when there is a real gap. |
| Model is judged *conservatively*: volatility inflated 20%, then blended toward the market price by a learned trust weight | A fat-tail jump or a wrong volatility guess should not turn into a big loss. The trust weight is refit from your own settled trades. |
| Gaps over 25 points are treated as a data problem and blocked | If the "model" and market disagree that much, your open price is probably wrong, not the market. |
| Stake scales with edge and trust, capped by your limits | Unproven model means smaller bets. |

### Worked example
5m window opens at $81,000. With 60s left BTC is $81,120. Over the remaining 60 seconds, one standard deviation of BTC movement is about $71 (including fat-tail widening, price staleness, and the Coinbase-vs-Polymarket price-source gap). So BTC is 1.68 sd ahead.
Raw model: 95% Up. Conservative model blended 50% toward the market's 78%: 85%.
Ask is 79¢ (79.4¢ with slippage), fee about 1.2¢. Net edge about 4.4¢. Trade: buy Up with a $47 stake.
If BTC stays above the open: win about 20¢ per share. If it flips: lose about 80¢ per share. You need to win more than roughly 80% of such trades. That is why the model must be calibrated, and why the thresholds above exist.

## 4. What to expect (honest)
- **Win rate rises a lot** (about 75-90% in the lab) because you buy favourites. **But wins are small and losses are big** (about $10 win vs $33 loss), so profit depends on being right more than ~80% of the time.
- **Far fewer trades.** In the lab about 2-5 per 100 five-minute windows, roughly 6-14 a day on 5m plus some on 15m/1h/4h. The old strategy made about 25 per 100 windows.
- **Whether the curve rises depends on one number: how many seconds Polymarket's price trails BTC.** Lab results (5m windows, 12,000 windows each):

| Crowd lag | Old 0.5: win% / net | New 0.6: win% / net |
|---|---|---|
| 0 s (as fast as the feed) | 28% / **-$2,078** | 79% / +$13 |
| 1 s | 29% / -$580 | 80% / +$68 |
| 2 s | 30% / +$1,067 | 81% / +$106 |
| 5 s | 41% / +$8,050 | 88% / +$1,003 |

  (net = per 3,000 windows, about 10 days of 5m windows, from $10,000 with $80 max stake.) Your real result looks like the 0 s row, which says the crowd is fast and the old strategy had no edge. Against a crowd that fast, nothing can honestly promise a steep curve. 0.6 stops the bleeding and takes profit only when a gap exists.
- This is a simulation I built, with its own assumptions (volatility regimes, jumps, quote noise). It checks the logic and the failure mode. It is **not** evidence of a real-market edge. The paper trial on real Polymarket data is the evidence.

## 5. How to check it is working
1. **Reset the trial** (Trial page) so 0.5's results do not mix with 0.6. The header should read `helios-btc-0.6`.
2. Watch **win rate and average price** on Trial. Expect most trades between 60¢ and 95¢. If you see trades under 55¢ something is wrong.
3. Watch **Brier: model vs market**. Model better than market means the strategy has information; the blend weight will rise by itself. Model equal or worse means do not go live.
4. The gate still needs 7 days and 100 trades. At 6-14 trades a day that takes 1-2 weeks. Do not loosen it.
5. A run of losses is more damaging here than before (big loss per trade). The existing breakers stay on: 4 losses in a row pauses for an hour, daily loss limit, drawdown limit.

## 6. Commands
```bash
npm run lab:strategy -- --windows 3000 --seeds 4 --lags 0,2,5      # old vs new, 5m windows
npm run lab:strategy -- --len 900 --windows 1000 --lags 0,2        # 15m windows
npm run backtest -- --days 7 --max 400                             # real Polymarket history (needs internet, run on your machine)
```
The real-data backtest only has 1-minute BTC candles, so its last decision point is about 60 seconds before the close. It underrates this strategy. The live paper trial (6-second BTC prints) is the better test.

## 7. Knobs (src/lib/trading/engine.ts, `CLOSER` and constants)
- `minZ` (1.0): higher = fewer, safer trades. 1.5 wins about 91-94% in the lab but trades about half as often.
- `minEdge` (0.02): also set by "Min edge" on the Controls page (higher wins).
- `priceLo/priceHi` (0.55 / 0.97): the favourites-only band.
- `zoneFraction`: how much of the window the strategy may act in.
- `VOL_DOUBT`, `FAT_TAIL`, `BASIS_BP`: how wide the model's error bars are. Wider = fewer trades, fewer blow-ups.
- Old logic is still available with `strategy: "legacy"` for comparison; practice (sim) windows still use it.

## 8. What would actually add edge next (not built, in order of value)
1. ~~Faster BTC feed~~ **Built (section 9).**
2. **Maker orders instead of taker.** Posting limit orders avoids the taker fee (1.75¢ at 50¢). It needs a fill and adverse-selection model and real order-book data to test.
3. **Match Polymarket's settlement source** (the price feed it resolves on) instead of Coinbase, to remove the basis term.
4. **Fit the volatility and the trust weight per window type** (5m vs 1h) once there are 300+ real settled trades.

## 9. Live BTC feed (built)
The worker now reads BTC from Coinbase's websocket (`src/lib/trading/feed.ts`), so the price the desk trades on is usually under a second old instead of up to 6 seconds old.
- **Automatic fallback.** If the socket drops, goes silent for 15s, or its newest print is over 3s old, the desk uses the old 6-second REST price. It reconnects by itself (1s, 2s, 4s ... up to 30s). Absurd prints (over 5% from the previous one) are dropped.
- **Honest staleness.** The model now widens its error bars by the real age of the price, not a fixed 6s, so a fresh print means more confident, more frequent trades.
- **Volatility is unchanged.** The vol estimate still samples every 6 seconds, so it means the same as before.
- **Setting:** `HELIOS_WS_FEED=1` (default). `0` turns it off. The worker log line each minute shows `BTC feed: live (...)`, tick count and reconnects. The Desk page's BTC source reads "Coinbase websocket BTC-USD" while it is live.
- Needs Node 22 (the Dockerfile uses it). On older Node the feed stays off and everything works as before.

Lab effect (new strategy, 5m windows, 12,000 windows per row, net per 3,000 windows):

| Crowd lag | BTC read every 6s | BTC read every 1s |
|---|---|---|
| 0 s | 79% win, +$24, 3.4 trades/100w | 84% win, +$18, 0.5 trades/100w |
| 1 s | 81%, +$99 | 86%, +$153 |
| 2 s | 82%, +$148 | 87%, +$565 |
| 5 s | 88%, +$1,093 | 88%, +$2,240 |

Read this carefully: the faster feed does not create an edge against a crowd that is already instant (0 s row: it just trades less, more safely). It helps only when the crowd is a second or more behind, where it roughly triples profit in the lab. The Polymarket side (order book quotes) is still polled every ~2.5s; a websocket for that is the next speed-up.
**Not tested against the real Coinbase socket** (this build environment has no outbound access). The logic is tested with a fake socket. After deploying, check the worker log shows `BTC feed: live`.
