import { DurableObject } from "cloudflare:workers";

const MAX_PEERS = 8;
const MAX_NAME = 32;

const ALLOWED_ORIGINS = new Set([
  "https://tools.secbone.com",
  "https://tools.2huo.us",
]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function isAllowedOrigin(origin) {
  if (!origin) return true; // non-browser clients (tests, CLI)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return ALLOWED_ORIGINS.has(origin);
}

function ipv6Prefix64(raw) {
  let ip = String(raw).split("%")[0].toLowerCase();
  if (ip.includes(".")) {
    // IPv4-mapped IPv6, e.g. ::ffff:203.0.113.5
    const v4 = ip.split(":").pop();
    if (v4) return `v4:${v4}`;
  }
  let groups;
  if (ip.includes("::")) {
    const [head, tail] = ip.split("::");
    const left = head ? head.split(":") : [];
    const right = tail ? tail.split(":") : [];
    const missing = 8 - left.length - right.length;
    groups = [...left, ...Array(Math.max(missing, 0)).fill("0"), ...right];
  } else {
    groups = ip.split(":");
  }
  return `${groups.slice(0, 4).map((g) => (g || "0").padStart(4, "0")).join(":")}::/64`;
}

function roomKeyFor(request) {
  const url = new URL(request.url);
  const manual = url.searchParams.get("room");
  if (manual) {
    const clean = manual.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32);
    if (clean.length >= 3) return `room:${clean}`;
  }

  const ip =
    request.headers.get("cf-connecting-ip") ||
    (request.headers.get("x-forwarded-for") || "").split(",")[0].trim();

  if (!ip) return "ip:unknown";
  if (ip.includes(":")) return `ipv6:${ipv6Prefix64(ip)}`;
  return `ipv4:${ip}`;
}

function peerNameFrom(request) {
  const url = new URL(request.url);
  const name = (url.searchParams.get("name") || "").trim().slice(0, MAX_NAME);
  return name || null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return json({
        service: "drop",
        signaling: "GET /ws",
        info: "GET /api/ip",
        note: "WebSocket: /ws (?room= optional, ?name= optional)",
      });
    }

    if (url.pathname === "/api/ip") {
      const ip =
        request.headers.get("cf-connecting-ip") ||
        (request.headers.get("x-forwarded-for") || "").split(",")[0].trim();
      return json({ ip: ip || null, room: roomKeyFor(request) });
    }

    if (url.pathname === "/ws") {
      const origin = request.headers.get("origin");
      if (!isAllowedOrigin(origin)) {
        return new Response("forbidden origin", { status: 403 });
      }
      if ((request.headers.get("upgrade") || "").toLowerCase() !== "websocket") {
        return new Response("expected websocket", { status: 426 });
      }

      const roomKey = roomKeyFor(request);
      const name = peerNameFrom(request);
      const headers = new Headers(request.headers);
      headers.set("x-room-key", roomKey);
      if (name) headers.set("x-peer-name", name);

      const id = env.ROOMS.idFromName(roomKey);
      const stub = env.ROOMS.get(id);
      return stub.fetch(new Request(request, { headers }));
    }

    return json({ error: "not found" }, 404);
  },
};

export class Room extends DurableObject {
  async fetch(request) {
    if ((request.headers.get("upgrade") || "").toLowerCase() !== "websocket") {
      return new Response("expected websocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    const existing = this.ctx.getWebSockets();
    if (existing.length >= MAX_PEERS) {
      this.ctx.acceptWebSocket(server);
      server.send(JSON.stringify({ type: "error", code: "room-full" }));
      server.close(4001, "room full");
      return new Response(null, { status: 101, webSocket: client });
    }

    const peerId = crypto.randomUUID();
    const name =
      request.headers.get("x-peer-name") ||
      `设备-${peerId.slice(0, 4)}`;
    const roomKey = request.headers.get("x-room-key") || "";

    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ peerId, name });

    const peers = existing.map((ws) => {
      const meta = ws.deserializeAttachment() || {};
      return { peerId: meta.peerId, name: meta.name };
    });

    server.send(
      JSON.stringify({
        type: "welcome",
        peerId,
        name,
        room: roomKey,
        peers,
      }),
    );

    for (const ws of existing) {
      try {
        ws.send(JSON.stringify({ type: "peer-joined", peerId, name }));
      } catch {
        /* peer went away */
      }
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, message) {
    if (typeof message !== "string") return;

    let msg;
    try {
      msg = JSON.parse(message);
    } catch {
      return;
    }

    const self = ws.deserializeAttachment() || {};

    if (msg.type === "signal") {
      if (!msg.target || !msg.data) return;
      const target = this.ctx
        .getWebSockets()
        .find((w) => (w.deserializeAttachment() || {}).peerId === msg.target);
      if (target) {
        try {
          target.send(
            JSON.stringify({
              type: "signal",
              from: self.peerId,
              data: msg.data,
            }),
          );
        } catch {
          /* target closed */
        }
      }
      return;
    }

    if (msg.type === "hello") {
      const name = String(msg.name || "").trim().slice(0, MAX_NAME);
      if (!name) return;
      ws.serializeAttachment({ ...self, name });
      for (const w of this.ctx.getWebSockets()) {
        if (w === ws) continue;
        try {
          w.send(
            JSON.stringify({
              type: "peer-updated",
              peerId: self.peerId,
              name,
            }),
          );
        } catch {
          /* ignore */
        }
      }
      return;
    }

    if (msg.type === "ping") {
      try {
        ws.send(JSON.stringify({ type: "pong" }));
      } catch {
        /* ignore */
      }
    }
  }

  async webSocketClose(ws) {
    this.broadcastPeerLeft(ws);
  }

  async webSocketError(ws) {
    this.broadcastPeerLeft(ws);
  }

  broadcastPeerLeft(ws) {
    const self = ws.deserializeAttachment() || {};
    for (const w of this.ctx.getWebSockets()) {
      if (w === ws) continue;
      try {
        w.send(JSON.stringify({ type: "peer-left", peerId: self.peerId }));
      } catch {
        /* ignore */
      }
    }
  }
}
