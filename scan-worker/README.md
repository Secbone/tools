# scan-worker

Serverless TCP port scanner API for the `scan/` page in this repo.

- API: `POST https://<your-worker>.workers.dev/api/scan`
- Health: `GET https://<your-worker>.workers.dev/api/health`
- Uses the free `*.workers.dev` subdomain (no custom domain).

The actual deployment URL is not stored in this repository. The frontend reads it at
runtime from `scan/config.js` (gitignored; see `scan/config.example.js`).

## API

```bash
curl -s https://<your-worker>.workers.dev/api/scan \
  -H 'content-type: application/json' \
  -d '{"host":"github.com","ports":"22,80,443"}'
```

Response:

```json
{
  "host": "github.com",
  "timeout": 1200,
  "elapsed": 1200,
  "count": 3,
  "results": [
    { "port": 22, "status": "open", "ms": 8 },
    { "port": 80, "status": "open", "ms": 9 },
    { "port": 443, "status": "open", "ms": 8 }
  ]
}
```

`status` is one of `open`, `closed`, `timeout`, `blocked`, `unreachable`.

CORS is open (`Access-Control-Allow-Origin: *`), so the static page can call it from
any origin.

## Limits (Cloudflare Workers)

- Only public targets. Cloudflare blocks private IPs, `localhost`, Cloudflare IP ranges and the Worker's own address.
- TCP port `25` is prohibited by Cloudflare (reported as `blocked`).
- Max 64 ports per request; up to 6 concurrent connections.
- Connection timeout is enforced in the Worker (~1.2s by default, max 5s).
- Free plan: 10ms CPU / request, 100k requests/day. Network wait does not count as CPU.

## Deploy

```bash
cd scan-worker
npx wrangler login   # or set CLOUDFLARE_API_TOKEN
npx wrangler deploy
```

Wrangler prints the generated `https://<worker>.<account>.workers.dev` URL after deploy.
Only the Workers Scripts permission is needed (no zone/DNS access).

## Abuse warning

This is an open port scanner. Scans originate from Cloudflare IPs. Do not use it to scan
hosts you do not own or have permission to test, and consider adding an auth token or
target allowlist before making it widely known.
