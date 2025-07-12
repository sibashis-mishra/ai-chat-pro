interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimitService {
  private rateLimits: Map<string, RateLimitEntry> = new Map();

  checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.rateLimits.get(key);

    if (!entry || now > entry.resetTime) {
      // First attempt or window expired
      this.rateLimits.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }

    if (entry.count >= maxAttempts) {
      return false; // Rate limit exceeded
    }

    // Increment count
    entry.count++;
    return true;
  }

  getRemainingAttempts(key: string): number {
    const entry = this.rateLimits.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return 0; // No active rate limit
    }
    return Math.max(0, entry.count);
  }

  resetRateLimit(key: string): void {
    this.rateLimits.delete(key);
  }

  // Clean up expired entries (call periodically)
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.rateLimits.entries()) {
      if (now > entry.resetTime) {
        this.rateLimits.delete(key);
      }
    }
  }
} 