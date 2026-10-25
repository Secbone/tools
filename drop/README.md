# drop

A small AirDrop-style file transfer tool:

- **static frontend** in this folder
- **Cloudflare Worker + Durable Object** for WebSocket signaling only
- files travel **directly browser-to-browser** over WebRTC (DTLS encrypted)
- no files are uploaded to Cloudflare or any server

## Layout

```
drop/
├── index.html
├── app.js
├── style.css
├── config.example.js   # template for the runtime WS endpoint
├── config.js           # NOT in git (gitignored) — real Worker URL
└── worker/
    ├── src/index.js    # Worker + Durable Object signaling
    └── wrangler.toml
```

## How discovery works

The Worker reads `CF-Connecting-IP` and derives a room key:

- IPv4: `ipv4:<address>`
- IPv6: `ipv6:<first 4 groups>::/64`
- manual: `?room=<code>` overrides the IP

All clients in the same room exchange SDP/ICE through the Worker's Durable Object.
After WebRTC connects, the signaling relay is no longer used.

This means devices behind the **same NAT/public IP** find each other automatically
without a room code. CGNAT, public Wi-Fi and VPNs can put unrelated users in the same
room, so treat the peer list as untrusted and always confirm incoming files.

A manual room code can be used for devices on different networks.

## Configuration

The real Worker URL is **not stored in this repository** (this repo is public). The page
reads it at runtime from `drop/config.js`, which is gitignored:

```js
window.DROP_WS_URL = "wss://<your-worker>.workers.dev/ws";
```

Copy `config.example.js` to `config.js` on the server and set the deployed URL. Missing
`config.js` shows a configuration error in the status bar.

## Deploy the Worker

```bash
cd drop/worker
npx wrangler login   # or set CLOUDFLARE_API_TOKEN
npx wrangler deploy
```

Wrangler prints the generated `https://<worker>.<account>.workers.dev` URL. Convert it to
`wss://.../ws` and put it in `drop/config.js` on the server — do not commit it.

The Worker uses a **SQLite-backed Durable Object**, which is available on the Workers
Free plan.

## File storage on the receiver

Files are never buffered fully in memory unless no disk-backed option exists:

1. **Chromium**: `showSaveFilePicker()` → chunks are written directly to the file the
   user picks. Supports multi-GB files.
2. **Other modern browsers**: **OPFS** (`navigator.storage.getDirectory()`) → chunks are
   written to a temporary on-disk file, then exposed as a download.
3. **Fallback**: memory, capped at 256 MiB.

The sender always streams with `file.stream()` (or `slice()` fallback), so it never loads
the whole file into memory. The practical limit is disk space / browser quota, not RAM.

## Signaling protocol

Client → Worker (WebSocket at `/ws`):

```json
{"type":"signal","target":"<peer-id>","data":{"description":{...}}}
{"type":"signal","target":"<peer-id>","data":{"candidate":{...}}}
{"type":"hello","name":"..."}
{"type":"ping"}
```

Server → client:

- `welcome` — `{peerId, name, room, peers}`
- `peer-joined` / `peer-left` / `peer-updated`
- `signal` — `{from, data}`
- `error` — `{code:"room-full"}`

DataChannel messages:

- JSON: `{t:"text"}`, `{t:"file-start"}`, `{t:"file-accept"}`, `{t:"file-reject"}`,
  `{t:"file-cancel"}`, `{t:"file-end"}`
- binary: file chunks, in order

## Limits

- Max 8 peers per room.
- No TURN is configured in this version: same-NAT/LAN transfers work directly; some
  cross-network pairs may fail to connect. Add TURN if you need that.
- No offline delivery, resume, or storage.
- Signaling relay availability depends on Cloudflare Workers.

## Security

- The Worker checks the WebSocket `Origin` against an allowlist.
- WebRTC encrypts the file data end-to-end.
- Incoming files always require confirmation.
- The room is public to everyone sharing the same public IP (or knowing the room code);
  do not accept files from unknown peers.

## Abuse warning

This is a peer-to-peer file transfer tool, not a file hosting service. Do not use it to
distribute illegal content or to attack other users.
