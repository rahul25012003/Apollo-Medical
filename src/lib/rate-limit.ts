/**
 * Simple in-memory rate limiter for API routes.
 *
 * Uses a sliding-window counter keyed by an identifier (e.g. IP address).
 * Stale entries are lazily cleaned up on each check.
 *
 * NOTE: This is per-process. In a multi-instance deployment, replace with
 * a Redis-backed implementation for accurate global rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // epoch ms
}

interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

/**
 * Create a named rate limiter. Each name gets its own independent store.
 *
 * @example
 * const limiter = createRateLimiter("login", { maxRequests: 10, windowSeconds: 900 });
 *
 * // Inside a route handler:
 * const ip = request.headers.get("x-forwarded-for") ?? "unknown";
 * const result = limiter.check(ip);
 * if (!result.allowed) {
 *   return Errors.badRequest(result.message);
 * }
 */
export function createRateLimiter(name: string, config: RateLimitConfig) {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }
  const store = stores.get(name)!;

  // Lazily prune expired entries every 100 checks
  let checkCount = 0;
  function maybePrune() {
    checkCount++;
    if (checkCount % 100 === 0) {
      const now = Date.now();
      for (const [key, entry] of store) {
        if (entry.resetAt <= now) {
          store.delete(key);
        }
      }
    }
  }

  return {
    /**
     * Check whether the identifier is within the rate limit.
     * Returns { allowed: true } or { allowed: false, message: string }.
     */
    check(identifier: string): { allowed: true } | { allowed: false; message: string } {
      maybePrune();
      const now = Date.now();
      const entry = store.get(identifier);

      if (!entry || entry.resetAt <= now) {
        // Start a new window
        store.set(identifier, {
          count: 1,
          resetAt: now + config.windowSeconds * 1000,
        });
        return { allowed: true };
      }

      entry.count++;
      if (entry.count > config.maxRequests) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return {
          allowed: false,
          message: `Too many requests. Please try again in ${retryAfter} seconds.`,
        };
      }

      return { allowed: true };
    },
  };
}

/**
 * Extract a reasonable client identifier from the request for rate limiting.
 * Prefers x-forwarded-for (first IP), falls back to x-real-ip, then "unknown".
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
