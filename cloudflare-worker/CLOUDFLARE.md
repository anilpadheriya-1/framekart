# LensGigs — Cloudflare Worker Deployment

The edge worker (`cloudflare-worker/`) runs in front of your Railway/Render backend.
It handles CORS, rate limiting, caching, and security headers at the edge — globally.

## What's already done for you
- ✅ KV Namespace `LENSGIGS_RL_KV` created in your Cloudflare account
- ✅ Namespace ID `22a3042625f04224895f59e3de9d6954` already set in `wrangler.toml`
- ✅ Worker code written with rate limiting, caching, and security headers

## Deploy in 5 steps

### 1. Install Wrangler CLI
```bash
cd cloudflare-worker
npm install
```

### 2. Login to Cloudflare
```bash
npx wrangler login
```

### 3. Set your backend URL as a secret
```bash
npx wrangler secret put BACKEND_URL
# Enter: https://your-backend.railway.app
```

### 4. Deploy
```bash
npm run deploy
# Worker URL: https://lensgigs-edge.<your-subdomain>.workers.dev
```

### 5. For production (with custom domain)
After you register `lensgigs.app` (or your chosen domain):
```bash
# Add to wrangler.toml routes:
# { pattern = "lensgigs.app/*", zone_name = "lensgigs.app" }
npm run deploy:production
```

## Architecture with the Worker

```
User → Cloudflare Edge Worker (lensgigs-edge)
              ↓
    [CORS] [Rate Limit] [Cache]
              ↓
    Railway Backend (FastAPI)
              ↓
    MongoDB Atlas + Cloudinary
```

## Rate limits configured
| Endpoint | Limit | Window |
|---|---|---|
| `/api/auth/login` | 5 requests | 15 minutes per IP |
| `/api/auth/register` | 5 requests | 15 minutes per IP |
| All other `/api/*` | 120 requests | 1 minute per IP |

## Cache TTLs
| Endpoint | Cache Duration |
|---|---|
| `GET /api/gigs` | 30 seconds |
| `GET /api/categories` | 1 hour |
| `GET /api/cities` | 1 hour |
| All other routes | Not cached |

## Environment variables in Cloudflare dashboard
Go to Workers & Pages → lensgigs-edge → Settings → Variables:
- `BACKEND_URL` = your Railway/Render backend URL

## KV Namespace
Already created: `LENSGIGS_RL_KV`
ID: `22a3042625f04224895f59e3de9d6954`
Used for: per-IP rate limit counters with automatic TTL expiry
