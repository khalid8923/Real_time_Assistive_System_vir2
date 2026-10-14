const cache = new Map<string, { count: number; resetAt: number }>();

// ✅ Cleanup كل 5 دقايق (unref عشان مش يمنع الخروج)
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of cache.entries()) {
      if (record.resetAt < now) cache.delete(key);
    }
  }, 5 * 60 * 1000);
  if (typeof timer === "object" && "unref" in timer) {
    (timer as { unref: () => void }).unref();
  }
}

export function rateLimit(
  key: string,
  max: number = 30,
  windowMs: number = 60_000
): { ok: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = cache.get(key);

  if (!record || record.resetAt < now) {
    cache.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, resetIn: windowMs };
  }

  if (record.count >= max) {
    return { ok: false, remaining: 0, resetIn: record.resetAt - now };
  }

  record.count++;
  return {
    ok: true,
    remaining: max - record.count,
    resetIn: record.resetAt - now,
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}