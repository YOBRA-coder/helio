/** Browser-safe live constants (kept apart from live.ts so the exchange SDK never reaches the client bundle). */
export const ARM_PHRASE = "I understand this trades real money";
export const LIVE_CEILING = { maxStake: 25, maxExposure: 100, dailyLossLimit: 50 };
