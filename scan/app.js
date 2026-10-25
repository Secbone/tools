const API_URL = window.SCAN_API_URL;

const form = document.getElementById("scan-form");
const hostInput = document.getElementById("host");
const portsInput = document.getElementById("ports");
const submitBtn = document.getElementById("submit");
const summary = document.getElementById("summary");
const errorBox = document.getElementById("error");
const table = document.getElementById("results");
const tbody = table.querySelector("tbody");

const SERVICES = {
  20: "FTP-data", 21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS",
  67: "DHCP", 69: "TFTP", 79: "Finger", 80: "HTTP", 110: "POP3", 111: "rpcbind",
  119: "NNTP", 123: "NTP", 135: "MS RPC", 137: "NetBIOS", 138: "NetBIOS",
  139: "NetBIOS", 143: "IMAP", 161: "SNMP", 162: "SNMP-trap", 179: "BGP",
  389: "LDAP", 443: "HTTPS", 445: "SMB", 465: "SMTPS", 514: "Syslog",
  587: "SMTP-sub", 636: "LDAPS", 993: "IMAPS", 995: "POP3S", 1080: "SOCKS",
  1433: "MSSQL", 1521: "Oracle", 1723: "PPTP", 2049: "NFS", 2181: "ZooKeeper",
  2375: "Docker", 2376: "Docker TLS", 3000: "Grafana/Node", 3306: "MySQL",
  3389: "RDP", 5432: "PostgreSQL", 5672: "RabbitMQ", 5900: "VNC", 6379: "Redis",
  6443: "K8s API", 7001: "WebLogic", 8000: "HTTP-alt", 8080: "HTTP-alt",
  8081: "HTTP-alt", 8443: "HTTPS-alt", 8888: "HTTP-alt", 9000: "HTTP-alt",
  9090: "Prometheus", 9200: "Elasticsearch", 11211: "Memcached", 27017: "MongoDB",
};

const STATUS_TEXT = {
  open: "开放",
  closed: "关闭",
  timeout: "超时",
  blocked: "禁止",
  unreachable: "不可达",
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clearOutput() {
  errorBox.hidden = true;
  errorBox.textContent = "";
  summary.hidden = true;
  table.hidden = true;
  tbody.innerHTML = "";
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function render(data) {
  const results = [...data.results].sort((a, b) => a.port - b.port);
  const open = results.filter((r) => r.status === "open").length;

  summary.innerHTML =
    `目标 <strong>${escapeHtml(data.host)}</strong> · ` +
    `扫描 <strong>${results.length}</strong> 个端口 · ` +
    `开放 <strong>${open}</strong> 个 · ` +
    `耗时 <strong>${data.elapsed} ms</strong>`;
  summary.hidden = false;

  tbody.innerHTML = results
    .map((r) => {
      const service = SERVICES[r.port] || "";
      const time = r.status === "blocked" ? "—" : `${r.ms} ms`;
      const title = r.error ? ` title="${escapeHtml(r.error)}"` : "";
      return `<tr${title}>
        <td>${r.port}</td>
        <td class="muted">${escapeHtml(service)}</td>
        <td><span class="badge ${r.status}">${STATUS_TEXT[r.status] || r.status}</span></td>
        <td class="muted">${time}</td>
      </tr>`;
    })
    .join("");

  table.hidden = false;
}

async function scan() {
  if (!API_URL) {
    showError("缺少 API 配置：请创建 scan/config.js（参考 config.example.js）");
    return;
  }
  clearOutput();
  submitBtn.disabled = true;
  submitBtn.textContent = "扫描中…";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: hostInput.value.trim(),
        ports: portsInput.value.trim(),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `请求失败 (${response.status})`);
    }
    render(data);
  } catch (err) {
    showError(err.message || "扫描失败");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "开始扫描";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  scan();
});

document.querySelectorAll(".presets button").forEach((button) => {
  button.addEventListener("click", () => {
    portsInput.value = button.dataset.ports;
    portsInput.focus();
  });
});
