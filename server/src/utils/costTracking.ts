import { config } from '../config/environment.js';

// Global cost tracking
let totalTokensUsed = 0;
let totalCost = 0;

export const costTracking = {
  // Calculate cost based on token usage
  calculateCost: (tokens: number): number => {
    return (tokens / 1000) * config.COST_PER_1K_TOKENS;
  },

  // Add to total usage
  addUsage: (tokens: number, cost: number): void => {
    totalTokensUsed += tokens;
    totalCost += cost;
  },

  // Get total usage
  getTotalUsage: () => ({
    totalTokensUsed,
    totalCost
  }),

  // Reset totals
  resetTotals: (): void => {
    totalTokensUsed = 0;
    totalCost = 0;
  }
};

export default costTracking; 