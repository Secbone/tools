import { connect } from "cloudflare:sockets";

const MAX_PORTS = 64;
const DEFAULT_TIMEOUT_MS = 1200;
const MAX_TIMEOUT_MS = 5000;
const CONCURRENCY = 6;
const BLOCKED_PORTS = new Set([25]);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
  });
}

function clampTimeout(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_TIMEOUT_MS;
  return Math.min(Math.max(Math.round(n), 200), MAX_TIMEOUT_MS);
}

function ipv4ToInt(ip) {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let out = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n < 0 || n > 255) return null;
    out = (out << 8) | n;
  }
  return out >>> 0;
}

const PRIVATE_V4 = [
  [0x0a000000, 0xff000000], // 10.0.0.0/8
  [0xac100000, 0xfff00000], // 172.16.0.0/12
  [0xc0a80000, 0xffff0000], // 192.168.0.0/16
  [0x7f000000, 0xff000000], // 127.0.0.0/8
  [0xa9fe0000, 0xffff0000], // 169.254.0.0/16
  [0x64400000, 0xffc00000], // 100.64.0.0/10
  [0x00000000, 0xff000000], // 0.0.0.0/8
  [0xe0000000, 0xf0000000], // 224.0.0.0/4
  [0xf0000000, 0xf0000000], // 240.0.0.0/4
];

function isPrivateHost(host) {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) {
    return true;
  }
  const v4 = ipv4ToInt(h);
  if (v4 !== null) {
    return PRIVATE_V4.some(([net, mask]) => ((v4 & mask) >>> 0) === (net >>> 0));
  }
  if (h.includes(":")) {
    return (
      h === "::1" ||
      h === "::" ||
      h.startsWith("fc") ||
      h.startsWith("fd") ||
      h.startsWith("fe80") ||
      h.startsWith("ff")
    );
  }
  return false;
}

function parseHost(input) {
  let host = String(input ?? "").trim();
  if (!host) return null;
  host = host.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  host = host.split("/")[0].split("?")[0].split("#")[0];
  host = host.replace(/^\[|\]$/g, "");
  if (!host || /[\s"'<>]/.test(host)) return null;
  if (host.length > 253) return null;
  if (isPrivateHost(host)) return null;
  return host;
}

function parsePorts(input) {
  const raw = Array.isArray(input) ? input.join(",") : String(input ?? "");
  const set = new Set();
  for (const part of raw.split(/[,\s]+/)) {
    if (!part) continue;
    const m = part.match(/^(\d{1,5})(?:-(\d{1,5}))?$/);
    if (!m) continue;
    const start = Number(m[1]);
    const end = m[2] ? Number(m[2]) : start;
    if (start < 1 || end > 65535 || start > end) continue;
    for (let p = start; p <= end && set.size < MAX_PORTS; p++) set.add(p);
  }
  return [...set].sort((a, b) => a - b);
}

async function scanPort(host, port, timeoutMs) {
  const started = Date.now();
  if (BLOCKED_PORTS.has(port)) {
    return { port, status: "blocked", ms: 0, note: "port 25 is blocked by Cloudflare" };
  }

  let socket;
  let timer;
  try {
    socket = connect({ hostname: host, port });
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
    });
    await Promise.race([socket.opened, timeout]);
    return { port, status: "open", ms: Date.now() - started };
  } catch (err) {
    const message = String(err?.message || err);
    let status = "closed";
    if (/timeout/i.test(message)) status = "timeout";
    else if (/disallowed|private|localhost|cloudflare|prohibited|loop/i.test(message)) status = "blocked";
    else if (/cannot connect to the specified address/i.test(message)) status = "unreachable";
    return { port, status, ms: Date.now() - started, error: message.slice(0, 140) };
  } finally {
    if (timer) clearTimeout(timer);
    try {
      socket?.close();
    } catch {
      /* ignore */
    }
  }
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      out[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return out;
}

async function handleScan(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }

  const host = parseHost(body.host);
  if (!host) {
    return json({ error: "invalid or private host" }, 400);
  }

  const ports = parsePorts(body.ports);
  if (!ports.length) {
    return json({ error: `no valid ports (max ${MAX_PORTS})` }, 400);
  }

  const timeout = clampTimeout(body.timeout);
  const started = Date.now();
  const results = await mapLimit(ports, CONCURRENCY, (port) => scanPort(host, port, timeout));

  return json({
    host,
    timeout,
    elapsed: Date.now() - started,
    count: results.length,
    results,
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/api/scan") {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS });
      }
      if (request.method !== "POST") {
        return json({ error: "use POST" }, 405);
      }
      return handleScan(request);
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "scan" });
    }

    if (url.pathname === "/") {
      return json({
        service: "scan",
        api: "POST /api/scan",
        health: "GET /api/health",
      });
    }

    return json({ error: "not found" }, 404);
  },
};
