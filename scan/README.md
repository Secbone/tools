# scan

TCP port scanner: a **static frontend** served by Caddy, plus a **Cloudflare Worker**
that performs the actual TCP connections.

## Layout

```
scan/
├── index.html          # frontend (served at /scan/)
├── app.js              # reads window.SCAN_API_URL
├── style.css
├── config.example.js   # template for the runtime config
├── config.js           # NOT in git (gitignored) — real Worker URL
└── worker/
    ├── src/index.js    # Cloudflare Worker API
    └── wrangler.toml
```

The frontend files stay at the root of `scan/` so the public URL is still
`https://tools.secbone.com/scan/`. The Worker lives in `scan/worker/` so the whole
feature is one directory.

## Configuration (important)

The real Worker URL is **not stored in this repository** (this repo is public). The
frontend reads it at runtime from `scan/config.js`, which is gitignored:

```js
window.SCAN_API_URL = "https://<your-worker>.workers.dev/api/scan";
```

Copy `config.example.js` to `config.js` on the server and set the deployed URL. If
`config.js` is missing, the page shows a configuration error instead of calling an
unknown endpoint.

## Deploy the Worker

```bash
cd scan/worker
npx wrangler login   # or set CLOUDFLARE_API_TOKEN
npx wrangler deploy
```

Wrangler prints the generated `https://<worker>.<account>.workers.dev` URL. Put that URL
into `scan/config.js` on the server — do not commit it.

The Worker uses the free `*.workers.dev` subdomain; no custom domain is configured.

## API

```
POST <worker-url>/api/scan
Content-Type: application/json

{"host": "github.com", "ports": "22,80,443"}
```

Response:

```json
{
  "host": "github.com",
  "timeout": 1200,
  "elapsed": 8,
  "count": 3,
  "results": [
    { "port": 22, "status": "open", "ms": 7 },
    { "port": 80, "status": "open", "ms": 9 },
    { "port": 443, "status": "open", "ms": 6 }
  ]
}
```

`status` is one of `open`, `closed`, `timeout`, `blocked`, `unreachable`.

CORS is open (`Access-Control-Allow-Origin: *`), so the page can call the Worker from a
different origin.

## Limits (Cloudflare Workers)

- Public targets only. Cloudflare blocks private IPs, `localhost`, Cloudflare IP ranges
  and the Worker's own address.
- TCP port `25` is prohibited by Cloudflare (reported as `blocked`).
- Max 64 ports per request; up to 6 concurrent connections.
- Connection timeout is enforced in the Worker (~1.2s by default, max 5s).
- Free plan: 10ms CPU / request, 100k requests/day. Network wait does not count as CPU.

## Frontend

`scan/` is served as static files by Caddy from `/www/tools/scan`. There is no PHP.

## Abuse warning

This is an open port scanner. Scans originate from Cloudflare IPs. Do not use it to scan
hosts you do not own or have permission to test, and consider adding an auth token or
target allowlist before making it widely known.
