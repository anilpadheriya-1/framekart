/**
 * FrameKart Edge Worker
 * Cloudflare Worker that sits in front of the FastAPI backend.
 *
 * Features:
 *  - CORS handling at edge (zero backend overhead)
 *  - Edge-level rate limiting per IP (uses Workers KV)
 *  - Cache-Control headers for GET /api/gigs and /api/categories
 *  - Security headers on every response
 *  - Health check endpoint at /edge-health
 */

// ─── Config ────────────────────────────────────────────────────────────────
const BACKEND_URL = "https://your-backend.railway.app"; // ← set in Worker env vars
const ALLOWED_ORIGINS = [
  "https://framekart.app",
  "https://framekart.co.in",
  "https://framekart.studio",
  "https://framekartindia.com",
  "http://localhost:3000",
];

// Rate limit: max requests per window per IP
const RL_WINDOW_SECONDS = 60;
const RL_MAX_REQUESTS = 120;          // per minute (generous for marketplace)
const RL_LOGIN_MAX_REQUESTS = 5;      // strict for auth endpoints
const RL_LOGIN_WINDOW_SECONDS = 900;  // 15 minutes

// Cache TTLs in seconds
const CACHE_GIGS_LIST = 30;        // gig listings: 30s (fresh enough, saves DB)
const CACHE_CATEGORIES = 3600;     // categories never change: 1 hour
const CACHE_CITIES = 3600;         // cities list: 1 hour

// ─── Security headers added to every response ───────────────────────────────
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function getCorsOrigin(request) {
  const origin = request.headers.get("Origin");
  if (origin && ALLOWED_ORIGINS.includes(origin)) return origin;
  return null;
}

function corsHeaders(request) {
  const origin = getCorsOrigin(request);
  if (!origin) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function addHeaders(response, extra = {}) {
  const res = new Response(response.body, response);
  Object.entries({ ...SECURITY_HEADERS, ...extra }).forEach(([k, v]) => {
    res.headers.set(k, v);
  });
  return res;
}

function isLoginEndpoint(pathname) {
  return pathname === "/api/auth/login" || pathname === "/api/auth/register";
}

function isCacheableGet(pathname) {
  if (pathname.startsWith("/api/gigs") && !pathname.match(/\/gigs\/.+/)) return CACHE_GIGS_LIST;
  if (pathname === "/api/categories") return CACHE_CATEGORIES;
  if (pathname === "/api/cities") return CACHE_CITIES;
  return 0;
}

// ─── Rate limiter using KV ──────────────────────────────────────────────────
async function checkRateLimit(env, ip, isLogin) {
  if (!env.RL_KV) return { limited: false }; // KV not bound → skip

  const window = isLogin ? RL_LOGIN_WINDOW_SECONDS : RL_WINDOW_SECONDS;
  const max = isLogin ? RL_LOGIN_MAX_REQUESTS : RL_MAX_REQUESTS;
  const key = `rl:${isLogin ? "login" : "api"}:${ip}`;

  const raw = await env.RL_KV.get(key);
  const now = Math.floor(Date.now() / 1000);

  if (!raw) {
    await env.RL_KV.put(key, JSON.stringify({ count: 1, start: now }), { expirationTtl: window });
    return { limited: false, remaining: max - 1, reset: now + window };
  }

  const data = JSON.parse(raw);
  if (now - data.start > window) {
    await env.RL_KV.put(key, JSON.stringify({ count: 1, start: now }), { expirationTtl: window });
    return { limited: false, remaining: max - 1, reset: now + window };
  }

  if (data.count >= max) {
    return { limited: true, remaining: 0, reset: data.start + window };
  }

  data.count++;
  await env.RL_KV.put(key, JSON.stringify(data), { expirationTtl: window });
  return { limited: false, remaining: max - data.count, reset: data.start + window };
}

// ─── Main handler ────────────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, search } = url;
    const method = request.method;

    // Edge health check — never proxied to backend
    if (pathname === "/edge-health") {
      return addHeaders(
        new Response(JSON.stringify({ status: "ok", edge: "cloudflare", ts: new Date().toISOString() }), {
          headers: { "Content-Type": "application/json" },
        })
      );
    }

    // Preflight CORS
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    // Rate limiting
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const isLogin = isLoginEndpoint(pathname);
    const rl = await checkRateLimit(env, ip, isLogin);

    if (rl.limited) {
      return addHeaders(
        new Response(
          JSON.stringify({ detail: isLogin
            ? "Too many login attempts. Try again in 15 minutes."
            : "Rate limit exceeded. Slow down." }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(rl.reset - Math.floor(Date.now() / 1000)),
              ...corsHeaders(request),
            },
          }
        )
      );
    }

    // Cache for safe GET endpoints
    const cacheTtl = method === "GET" ? isCacheableGet(pathname) : 0;

    if (cacheTtl > 0) {
      const cacheKey = new Request(`${BACKEND_URL}${pathname}${search}`, request);
      const cache = caches.default;
      const cached = await cache.match(cacheKey);
      if (cached) {
        return addHeaders(cached, {
          "X-Cache": "HIT",
          "X-Cache-TTL": String(cacheTtl),
          ...corsHeaders(request),
        });
      }
    }

    // Proxy to backend
    const backendUrl = `${env.BACKEND_URL || BACKEND_URL}${pathname}${search}`;
    const backendRequest = new Request(backendUrl, {
      method,
      headers: request.headers,
      body: ["GET", "HEAD"].includes(method) ? undefined : request.body,
      redirect: "follow",
    });

    let response;
    try {
      response = await fetch(backendRequest);
    } catch (err) {
      return addHeaders(
        new Response(JSON.stringify({ detail: "Backend unavailable. Please try again." }), {
          status: 503,
          headers: { "Content-Type": "application/json", ...corsHeaders(request) },
        })
      );
    }

    // Store cacheable responses
    if (cacheTtl > 0 && response.status === 200) {
      const cacheKey = new Request(`${BACKEND_URL}${pathname}${search}`, request);
      const toCache = new Response(response.clone().body, response);
      toCache.headers.set("Cache-Control", `public, max-age=${cacheTtl}`);
      ctx.waitUntil(caches.default.put(cacheKey, toCache));
    }

    // Rate limit headers on response
    const rlHeaders = rl.remaining !== undefined
      ? { "X-RateLimit-Remaining": String(rl.remaining), "X-RateLimit-Reset": String(rl.reset) }
      : {};

    return addHeaders(response, {
      ...corsHeaders(request),
      ...rlHeaders,
      "X-Cache": cacheTtl > 0 ? "MISS" : "BYPASS",
    });
  },
};
