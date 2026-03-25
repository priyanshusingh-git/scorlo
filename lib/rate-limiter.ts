import { NextResponse } from "next/server";

// Simple in-memory storage for rate limiting
// Note: This is an in-memory store that resets on server reload.
// For multi-instance production loads, a Redis-based approach would be used.
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  limit: number;      // Max number of requests
  windowMs: number;   // Time window in milliseconds
}

/**
 * Basic In-Memory Rate Limiter
 * @param identifier Typically an IP address or user ID
 * @param config Limit and window duration
 * @returns { success: boolean, remaining: number, reset: number }
 */
export function rateLimit(identifier: string, config: RateLimitConfig) {
  const now = Date.now();
  const userData = rateLimitStore.get(identifier);

  // If new user or window has expired, reset
  if (!userData || now > userData.resetTime) {
    const newResetTime = now + config.windowMs;
    rateLimitStore.set(identifier, { count: 1, resetTime: newResetTime });
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: newResetTime
    };
  }

  // If over limit
  if (userData.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: userData.resetTime
    };
  }

  // Increment count
  userData.count += 1;
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - userData.count,
    reset: userData.resetTime
  };
}

/**
 * Optional: Cleanup the store periodically to prevent memory leaks
 */
if (typeof window === "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 1000 * 60 * 10); // Every 10 minutes
}
