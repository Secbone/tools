const WS_URL = window.DROP_WS_URL;

const HIGH_WATER = 512 * 1024;
const MEMORY_LIMIT = 256 * 1024 * 1024;

const ICE_SERVERS = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
];

const state = {
  ws: null,
  myId: null,
  room: null,
  manualRoom: "",
  name: initialName(),
  peers: new Map(),
  reconnectTimer: null,
  stopReconnect: false,
  modalOpen: false,
  modalCallback: null,
};

const peerEls = new Map();

const DEVICE_ICON = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <rect x="4" y="3" width="16" height="14" rx="2"></rect>
  <path d="M9 21h6"></path>
  <path d="M12 17v4"></path>
</svg>`;

const els = {
  status: document.getElementById("status"),
  room: document.getElementById("room"),
  join: document.getElementById("join"),
  auto: document.getElementById("auto"),
  roomInfo: document.getElementById("room-info"),
  nameInput: document.getElementById("name"),
  saveName: document.getElementById("save-name"),
  radarLabel: document.getElementById("radar-label"),
  radar: document.getElementById("radar"),
  radarEmpty: document.getElementById("radar-empty"),
  peers: document.getElementById("peers"),
  target: document.getElementById("target"),
  dropzone: document.getElementById("dropzone"),
  file: document.getElementById("file"),
  text: document.getElementById("text"),
  sendText: document.getElementById("send-text"),
  transfers: document.getElementById("transfers"),
  received: document.getElementById("received"),
  messages: document.getElementById("messages"),
  modal: document.getElementById("modal"),
  modalMeta: document.getElementById("modal-meta"),
  accept: document.getElementById("accept"),
  reject: document.getElementById("reject"),
};

localStorage.setItem("drop-name", state.name);
if (els.nameInput) els.nameInput.value = state.name;
if (els.radarLabel) els.radarLabel.textContent = state.name;

function defaultDeviceName() {
  const ua = navigator.userAgent || "";
  let os = "设备";
  if (/iPhone/.test(ua)) os = "iPhone";
  else if (/iPad/.test(ua)) os = "iPad";
  else if (/Android/.test(ua)) os = "Android";
  else if (/Mac OS X|Macintosh/.test(ua)) os = "Mac";
  else if (/Windows/.test(ua)) os = "Windows";
  else if (/Linux/.test(ua)) os = "Linux";

  let browser = "浏览器";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/CriOS/.test(ua)) browser = "Chrome";
  else if (/FxiOS/.test(ua)) browser = "Firefox";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua)) browser = "Safari";

  return `${os} · ${browser}`;
}

function initialName() {
  const saved = (localStorage.getItem("drop-name") || "").trim();
  if (saved && !/^设备-[a-z0-9]{4}$/i.test(saved)) return saved;
  return defaultDeviceName();
}

function saveName() {
  const clean = (els.nameInput?.value || "").trim().replace(/\s+/g, " ").slice(0, 32);
  state.name = clean || defaultDeviceName();
  localStorage.setItem("drop-name", state.name);
  if (els.nameInput) els.nameInput.value = state.name;
  if (els.radarLabel) els.radarLabel.textContent = state.name;
  if (state.ws && state.ws.readyState === WebSocket.OPEN) {
    state.ws.send(JSON.stringify({ type: "hello", name: state.name }));
  }
}

function formatSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

function setStatus(text) {
  els.status.textContent = text;
}

function updateRoomInfo() {
  els.roomInfo.textContent = state.manualRoom
    ? `手动房间：${state.manualRoom}`
    : "自动：同一公网 IP 下的设备会自动出现在列表里";
}

/* ---------------- signaling ---------------- */

function connect() {
  if (!WS_URL) {
    setStatus("缺少 config.js：请配置 window.DROP_WS_URL");
    return;
  }

  state.stopReconnect = false;
  clearTimeout(state.reconnectTimer);
  closePeers();

  if (state.ws) {
    const old = state.ws;
    state.ws = null;
    try {
      old.close();
    } catch {
      /* ignore */
    }
  }

  const url = new URL(WS_URL);
  if (state.manualRoom) url.searchParams.set("room", state.manualRoom);
  url.searchParams.set("name", state.name);

  const ws = new WebSocket(url.toString());
  state.ws = ws;
  setStatus("连接信令…");

  ws.onopen = () => {
    setStatus("信令已连接，等待设备…");
    updateRoomInfo();
  };

  ws.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    handleSignalMessage(msg);
  };

  ws.onerror = () => {
    setStatus("信令错误");
  };

  ws.onclose = () => {
    if (state.ws !== ws) return;
    state.ws = null;
    closePeers();
    if (state.stopReconnect) {
      setStatus("连接已关闭");
      return;
    }
    setStatus("信令断开，3 秒后重连…");
    state.reconnectTimer = setTimeout(connect, 3000);
  };
}

function reconnect() {
  state.stopReconnect = false;
  connect();
}

function handleSignalMessage(msg) {
  if (msg.type === "welcome") {
    state.myId = msg.peerId;
    state.room = msg.room;
    setStatus(`已进入房间，当前 ${msg.peers.length + 1} 台设备`);
    for (const p of msg.peers) {
      ensurePeer(p.peerId, p.name);
      if (state.myId < p.peerId) initiate(p.peerId);
    }
    renderPeers();
    return;
  }

  if (msg.type === "peer-joined") {
    ensurePeer(msg.peerId, msg.name);
    if (state.myId < msg.peerId) initiate(msg.peerId);
    renderPeers();
    return;
  }

  if (msg.type === "peer-left") {
    removePeer(msg.peerId);
    return;
  }

  if (msg.type === "peer-updated") {
    const peer = state.peers.get(msg.peerId);
    if (peer) {
      peer.name = msg.name || peer.name;
      renderPeers();
    }
    return;
  }

  if (msg.type === "signal") {
    handleRtcSignal(msg.from, msg.data);
    return;
  }

  if (msg.type === "error") {
    if (msg.code === "room-full") {
      state.stopReconnect = true;
      setStatus("房间已满（最多 8 台设备）");
      try {
        state.ws?.close();
      } catch {
        /* ignore */
      }
    }
  }
}

function sendSignal(target, data) {
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return;
  state.ws.send(JSON.stringify({ type: "signal", target, data }));
}

/* ---------------- peers / WebRTC ---------------- */

function ensurePeer(id, name = "") {
  let peer = state.peers.get(id);
  if (peer) {
    if (name) peer.name = name;
    return peer;
  }
  peer = {
    id,
    name: name || `设备-${id.slice(0, 4)}`,
    pc: null,
    dc: null,
    state: "idle",
    candidates: [],
    incoming: null,
    outgoing: null,
  };
  state.peers.set(id, peer);
  renderPeers();
  return peer;
}

function createPC(peer) {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  peer.pc = pc;

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      sendSignal(peer.id, { candidate: event.candidate });
    }
  };

  pc.onconnectionstatechange = () => {
    peer.state = pc.connectionState;
    renderPeers();
  };

  pc.ondatachannel = (event) => {
    setupDataChannel(peer, event.channel);
  };

  return pc;
}

async function initiate(id) {
  const peer = ensurePeer(id);
  if (peer.pc) return;

  const pc = createPC(peer);
  const dc = pc.createDataChannel("drop", { ordered: true });
  setupDataChannel(peer, dc);

  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal(id, { description: pc.localDescription });
  } catch (err) {
    peer.state = "failed";
    renderPeers();
  }
}

async function handleRtcSignal(from, data) {
  if (!from || !data) return;
  const peer = ensurePeer(from);

  try {
    if (data.description) {
      if (!peer.pc) createPC(peer);
      const pc = peer.pc;

      if (pc.signalingState === "have-local-offer" && data.description.type === "offer") {
        return;
      }

      await pc.setRemoteDescription(data.description);
      await flushCandidates(peer);

      if (data.description.type === "offer") {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal(from, { description: pc.localDescription });
      }
      return;
    }

    if (data.candidate) {
      if (peer.pc && peer.pc.remoteDescription) {
        await peer.pc.addIceCandidate(data.candidate).catch(() => {});
      } else {
        peer.candidates.push(data.candidate);
      }
    }
  } catch (err) {
    peer.state = "failed";
    renderPeers();
  }
}

async function flushCandidates(peer) {
  if (!peer.pc || !peer.pc.remoteDescription) return;
  const list = peer.candidates.splice(0);
  for (const candidate of list) {
    await peer.pc.addIceCandidate(candidate).catch(() => {});
  }
}

function setupDataChannel(peer, dc) {
  peer.dc = dc;
  dc.binaryType = "arraybuffer";
  dc.bufferedAmountLowThreshold = HIGH_WATER;

  dc.onopen = () => {
    peer.state = "connected";
    renderPeers();
  };

  dc.onclose = () => {
    peer.state = "closed";
    renderPeers();
  };

  dc.onmessage = (event) => handleData(peer, event.data);
}

function sendControl(peer, obj) {
  if (peer.dc && peer.dc.readyState === "open") {
    peer.dc.send(JSON.stringify(obj));
    return true;
  }
  return false;
}

function handleData(peer, data) {
  if (typeof data === "string") {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }
    handleControl(peer, msg);
    return;
  }

  onChunk(peer, data);
}

function handleControl(peer, msg) {
  if (msg.t === "text") {
    addMessage(peer.name, String(msg.text || ""));
    return;
  }

  if (msg.t === "file-start") {
    onFileStart(peer, msg);
    return;
  }

  if (msg.t === "file-accept") {
    if (peer.outgoing) peer.outgoing.accept(true);
    return;
  }

  if (msg.t === "file-reject") {
    if (peer.outgoing) peer.outgoing.accept(false);
    return;
  }

  if (msg.t === "file-cancel") {
    if (peer.incoming) {
      abortIncoming(peer);
    }
    return;
  }

  if (msg.t === "file-end") {
    onFileEnd(peer);
  }
}

function removePeer(id) {
  const peer = state.peers.get(id);
  if (!peer) return;
  if (peer.outgoing) peer.outgoing.row?.fail("设备断开");
  abortIncoming(peer);
  try {
    peer.dc?.close();
    peer.pc?.close();
  } catch {
    /* ignore */
  }
  state.peers.delete(id);
  renderPeers();
}

function closePeers() {
  for (const peer of Array.from(state.peers.values())) {
    if (peer.outgoing) peer.outgoing.row?.fail("信令断开");
    abortIncoming(peer);
    try {
      peer.dc?.close();
      peer.pc?.close();
    } catch {
      /* ignore */
    }
  }
  state.peers.clear();
  renderPeers();
}

/* ---------------- file transfer ---------------- */

async function onFileStart(peer, msg) {
  if (peer.incoming || state.modalOpen) {
    sendControl(peer, { t: "file-reject" });
    return;
  }

  const meta = {
    name: String(msg.name || "file").slice(0, 200),
    size: Number(msg.size) || 0,
    mime: String(msg.mime || "application/octet-stream"),
  };

  peer.incoming = { meta, sink: null, received: 0, accepted: false, queue: Promise.resolve(), row: null };

  openModal(meta, async (ok) => {
    if (!ok) {
      sendControl(peer, { t: "file-reject" });
      peer.incoming = null;
      return;
    }

    const sink = await chooseSink(meta);
    if (!sink) {
      sendControl(peer, { t: "file-reject" });
      peer.incoming = null;
      return;
    }

    peer.incoming.sink = sink;
    peer.incoming.accepted = true;
    peer.incoming.row = addTransfer("receive", peer.name, meta.name, meta.size, peer);
    sendControl(peer, { t: "file-accept" });
  });
}

function onChunk(peer, data) {
  const inc = peer.incoming;
  if (!inc || !inc.accepted || !inc.sink) return;

  const chunk = new Uint8Array(data);
  inc.queue = inc.queue
    .then(async () => {
      await writeChunk(inc.sink, chunk);
      inc.received += chunk.byteLength;
      inc.row?.progress(inc.meta.size ? inc.received / inc.meta.size : 0);
    })
    .catch((err) => {
      inc.row?.fail(err.message || "写入失败");
    });
}

async function onFileEnd(peer) {
  const inc = peer.incoming;
  if (!inc) return;
  peer.incoming = null;

  try {
    await inc.queue;
    const result = await finishSink(inc.sink, inc.meta);
    inc.row?.done();
    addReceived(inc.meta, result);
  } catch (err) {
    inc.row?.fail(err.message || "保存失败");
    await abortSink(inc.sink);
  }
}

function abortIncoming(peer) {
  const inc = peer.incoming;
  if (!inc) return;
  peer.incoming = null;
  inc.row?.fail("已取消");
  if (inc.sink) abortSink(inc.sink);
  if (state.modalOpen) closeModal();
}

async function sendFile(peer, file) {
  if (!peer.dc || peer.dc.readyState !== "open") {
    alert("设备未连接");
    return;
  }
  if (peer.outgoing) {
    alert("该设备已有文件在传输");
    return;
  }

  const row = addTransfer("send", peer.name, file.name, file.size, peer);

  const accepted = await new Promise((resolve) => {
    peer.outgoing = {
      row,
      accept: (ok) => resolve(!!ok),
    };
    sendControl(peer, {
      t: "file-start",
      name: file.name,
      size: file.size,
      mime: file.type || "application/octet-stream",
    });
    setTimeout(() => resolve(false), 60000);
  });

  if (!accepted) {
    peer.outgoing = null;
    row.fail("对方拒绝或超时");
    sendControl(peer, { t: "file-cancel" });
    return;
  }

  try {
    let sent = 0;

    if (file.stream) {
      const reader = file.stream().getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        await waitForBuffer(peer.dc);
        peer.dc.send(value);
        sent += value.byteLength;
        row.progress(file.size ? sent / file.size : 0);
      }
    } else {
      const STEP = 64 * 1024;
      for (let offset = 0; offset < file.size; offset += STEP) {
        const buffer = await file.slice(offset, offset + STEP).arrayBuffer();
        await waitForBuffer(peer.dc);
        peer.dc.send(buffer);
        sent += buffer.byteLength;
        row.progress(file.size ? sent / file.size : 0);
      }
    }

    sendControl(peer, { t: "file-end" });
    row.done();
  } catch (err) {
    row.fail(err.message || "发送失败");
  } finally {
    peer.outgoing = null;
  }
}

function waitForBuffer(dc) {
  if (dc.bufferedAmount < HIGH_WATER) return Promise.resolve();

  return new Promise((resolve) => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      dc.removeEventListener("bufferedamountlow", finish);
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(finish, 1000);
    dc.addEventListener("bufferedamountlow", finish);
  });
}

/* ---------------- receivers: disk / OPFS / memory ---------------- */

async function chooseSink(meta) {
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({ suggestedName: meta.name });
      const writable = await handle.createWritable();
      return { kind: "disk", writable };
    } catch (err) {
      if (err?.name === "AbortError") return null;
      // fall through to OPFS / memory
    }
  }

  if (navigator.storage?.getDirectory) {
    try {
      const root = await navigator.storage.getDirectory();
      const safe = meta.name.replace(/[\\/:*?"<>|]/g, "_").slice(0, 120) || "file";
      const name = `drop-${Date.now()}-${safe}`;
      const handle = await root.getFileHandle(name, { create: true });
      const writable = await handle.createWritable();
      return { kind: "opfs", root, name, handle, writable };
    } catch (err) {
      alert(`浏览器临时存储不可用：${err.message || err}`);
    }
  }

  if (meta.size > MEMORY_LIMIT) {
    alert(`当前浏览器不支持落盘，内存模式最多 ${formatSize(MEMORY_LIMIT)}`);
    return null;
  }

  return { kind: "memory", chunks: [] };
}

async function writeChunk(sink, chunk) {
  if (sink.kind === "memory") {
    sink.chunks.push(chunk);
    return;
  }
  await sink.writable.write(chunk);
}

async function finishSink(sink, meta) {
  if (sink.kind === "disk") {
    await sink.writable.close();
    return { kind: "saved" };
  }

  if (sink.kind === "opfs") {
    await sink.writable.close();
    const file = await sink.handle.getFile();
    const url = URL.createObjectURL(file);
    return {
      kind: "download",
      url,
      name: meta.name,
      size: file.size,
      cleanup: async () => {
        URL.revokeObjectURL(url);
        await sink.root.removeEntry(sink.name).catch(() => {});
      },
    };
  }

  const blob = new Blob(sink.chunks, { type: meta.mime });
  const url = URL.createObjectURL(blob);
  return {
    kind: "download",
    url,
    name: meta.name,
    size: blob.size,
    cleanup: () => URL.revokeObjectURL(url),
  };
}

async function abortSink(sink) {
  if (!sink) return;
  if (sink.kind === "memory") {
    sink.chunks = [];
    return;
  }
  try {
    await sink.writable.abort();
  } catch {
    /* ignore */
  }
  if (sink.kind === "opfs") {
    await sink.root.removeEntry(sink.name).catch(() => {});
  }
}

/* ---------------- UI ---------------- */

function renderPeers() {
  const list = Array.from(state.peers.values());
  const n = list.length;

  for (const [id, el] of peerEls) {
    if (!list.some((p) => p.id === id)) {
      el.classList.add("leave");
      peerEls.delete(id);
      setTimeout(() => el.remove(), 500);
    }
  }

  const size = els.radar?.clientWidth || 360;
  const radius = size * 0.33;

  list.forEach((peer, index) => {
    let el = peerEls.get(peer.id);
    if (!el) {
      el = createPeerEl(peer);
      el.classList.add("enter");
      els.peers.appendChild(el);
      peerEls.set(peer.id, el);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => el.classList.remove("enter"));
      });
      el.addEventListener("click", () => selectPeer(peer.id));
    }

    const angle = n === 1 ? -Math.PI / 2 : -Math.PI / 2 + (index * 2 * Math.PI) / n;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    el.style.setProperty("--x", `${x.toFixed(1)}px`);
    el.style.setProperty("--y", `${y.toFixed(1)}px`);

    updatePeerEl(el, peer);
    el.classList.toggle("selected", els.target.value === peer.id);
  });

  if (els.radarEmpty) els.radarEmpty.hidden = n > 0;

  const selected = els.target.value;
  els.target.innerHTML = "";

  const connected = list.filter((p) => p.dc && p.dc.readyState === "open");
  const options = connected.length ? connected : list;

  if (!options.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "无可用设备";
    els.target.appendChild(opt);
    els.target.disabled = true;
  } else {
    for (const peer of options) {
      const opt = document.createElement("option");
      opt.value = peer.id;
      opt.textContent = `${peer.name}${connected.length ? "" : "（未连接）"}`;
      els.target.appendChild(opt);
    }
    els.target.disabled = !connected.length;
    if (selected && options.some((p) => p.id === selected)) {
      els.target.value = selected;
    }
  }

  for (const [id, el] of peerEls) {
    el.classList.toggle("selected", id === els.target.value);
  }

  if (state.ws && state.ws.readyState === WebSocket.OPEN) {
    setStatus(n ? `找到 ${n} 台设备 · 点击设备选择` : "正在寻找附近设备…");
  }
}

function createPeerEl(peer) {
  const el = document.createElement("div");
  el.className = "peer-bubble";
  el.dataset.peerId = peer.id;

  const ring = document.createElement("div");
  ring.className = "peer-ring";

  const core = document.createElement("div");
  core.className = "peer-core";
  core.innerHTML = DEVICE_ICON;

  const dot = document.createElement("span");
  dot.className = "peer-dot";

  const name = document.createElement("div");
  name.className = "peer-name";
  name.textContent = peer.name;

  el.append(ring, core, dot, name);
  return el;
}

function updatePeerEl(el, peer) {
  const name = el.querySelector(".peer-name");
  if (name) name.textContent = peer.name;
  const connected = peer.dc && peer.dc.readyState === "open";
  el.classList.toggle("connected", !!connected);
  el.classList.toggle("failed", peer.state === "failed");
}

function selectPeer(id) {
  if (!state.peers.has(id)) return;
  els.target.value = id;
  for (const [peerId, el] of peerEls) {
    el.classList.toggle("selected", peerId === id);
  }
}

function setPeerProgress(peer, ratio) {
  if (!peer) return;
  const el = peerEls.get(peer.id);
  if (!el) return;
  const value = Math.max(0, Math.min(1, Number(ratio) || 0));
  el.style.setProperty("--p", String(value * 100));
  el.classList.toggle("transferring", value > 0 && value < 0.999);
}

function addTransfer(direction, peerName, fileName, size, peer) {
  const el = document.createElement("div");
  el.className = "transfer";

  const title = document.createElement("div");
  title.className = "transfer-title";
  title.textContent = fileName;

  const meta = document.createElement("div");
  meta.className = "transfer-meta";
  meta.textContent = `${direction === "send" ? "发送" : "接收"} · ${peerName} · ${formatSize(size)}`;

  const bar = document.createElement("div");
  bar.className = "progress";
  const fill = document.createElement("i");
  bar.appendChild(fill);

  el.append(title, meta, bar);
  els.transfers.prepend(el);

  return {
    progress(ratio) {
      fill.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
      if (peer) setPeerProgress(peer, ratio);
    },
    done() {
      this.progress(1);
      meta.textContent += " · 完成";
      if (peer) setTimeout(() => setPeerProgress(peer, 0), 500);
    },
    fail(reason) {
      el.classList.add("failed");
      meta.textContent += ` · 失败：${reason}`;
      if (peer) setPeerProgress(peer, 0);
    },
  };
}

function addReceived(meta, result) {
  const item = document.createElement("div");
  item.className = "received-item";

  const left = document.createElement("div");
  const name = document.createElement("div");
  name.className = "received-name";
  name.textContent = meta.name;

  const info = document.createElement("div");
  info.className = "received-meta";
  info.textContent = formatSize(meta.size);

  left.append(name, info);
  item.appendChild(left);

  if (result.kind === "saved") {
    const saved = document.createElement("span");
    saved.className = "received-meta";
    saved.textContent = "已保存到磁盘";
    item.appendChild(saved);
  } else {
    const actions = document.createElement("div");

    const link = document.createElement("a");
    link.href = result.url;
    link.download = meta.name;
    link.textContent = "下载";

    const clear = document.createElement("button");
    clear.type = "button";
    clear.textContent = "清除";
    clear.addEventListener("click", async () => {
      await result.cleanup();
      item.remove();
    });

    actions.append(link, document.createTextNode(" "), clear);
    item.appendChild(actions);
  }

  els.received.prepend(item);
}

function addMessage(from, text) {
  const el = document.createElement("div");
  el.className = "message";

  const who = document.createElement("div");
  who.className = "message-from";
  who.textContent = from;

  const body = document.createElement("div");
  body.textContent = text;

  el.append(who, body);
  els.messages.prepend(el);
}

function openModal(meta, callback) {
  if (state.modalOpen) {
    callback(false);
    return;
  }
  state.modalOpen = true;
  state.modalCallback = callback;
  els.modalMeta.textContent = `${meta.name} · ${formatSize(meta.size)}`;
  els.modal.hidden = false;
}

function closeModal() {
  state.modalOpen = false;
  state.modalCallback = null;
  els.modal.hidden = true;
}

/* ---------------- events ---------------- */

function targetPeer() {
  const id = els.target.value;
  if (!id) return null;
  return state.peers.get(id) || null;
}

function sendSelectedFile(file) {
  const peer = targetPeer();
  if (!peer) {
    alert("没有可用设备");
    return;
  }
  sendFile(peer, file);
}

els.accept.addEventListener("click", () => {
  const cb = state.modalCallback;
  closeModal();
  if (cb) cb(true);
});

els.reject.addEventListener("click", () => {
  const cb = state.modalCallback;
  closeModal();
  if (cb) cb(false);
});

els.saveName?.addEventListener("click", saveName);

els.nameInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    saveName();
  }
});

els.join.addEventListener("click", () => {
  const room = els.room.value.trim();
  state.manualRoom = room;
  updateRoomInfo();
  reconnect();
});

els.auto.addEventListener("click", () => {
  els.room.value = "";
  state.manualRoom = "";
  updateRoomInfo();
  reconnect();
});

els.dropzone.addEventListener("click", () => els.file.click());

els.file.addEventListener("change", () => {
  const file = els.file.files?.[0];
  if (file) sendSelectedFile(file);
  els.file.value = "";
});

els.dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  els.dropzone.classList.add("over");
});

els.dropzone.addEventListener("dragleave", () => {
  els.dropzone.classList.remove("over");
});

els.dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  els.dropzone.classList.remove("over");
  const file = event.dataTransfer?.files?.[0];
  if (file) sendSelectedFile(file);
});

els.sendText.addEventListener("click", () => {
  const peer = targetPeer();
  const text = els.text.value.trim();
  if (!peer || !text) return;
  if (!sendControl(peer, { t: "text", text })) {
    alert("设备未连接");
    return;
  }
  addMessage("我", text);
  els.text.value = "";
});

els.text.addEventListener("keydown", (event) => {
  if (event.key === "Enter") els.sendText.click();
});

window.addEventListener("beforeunload", () => {
  state.stopReconnect = true;
  try {
    state.ws?.close();
  } catch {
    /* ignore */
  }
  closePeers();
});

updateRoomInfo();
renderPeers();
connect();
