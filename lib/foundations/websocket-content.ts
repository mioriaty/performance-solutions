export interface WebSocketSimStep {
  stepNumber: number
  phase: string
  readyState: "0 CONNECTING" | "1 OPEN" | "2 CLOSING" | "3 CLOSED"
  clientMetrics: {
    activeTabs: string
    tcpSockets: string
    lastSeqId: string
    backoffDelay: string
    bufferedBytes: string
  }
  clientQueue: string[]
  wireFrames: string[]
  serverState: string[]
  consoleLogs: string[]
  explanation: {
    vi: string
    en: string
  }
}

export interface WebSocketSimScenario {
  id: string
  badge: string
  title: {
    vi: string
    en: string
  }
  subtitle: {
    vi: string
    en: string
  }
  code: string
  steps: WebSocketSimStep[]
}

export interface WebSocketFailurePlaybookItem {
  id: string
  shortLabel: {
    vi: string
    en: string
  }
  category: string
  title: {
    vi: string
    en: string
  }
  problem: {
    vi: string
    en: string
  }
  rootCause: {
    vi: string
    en: string
  }
  solution: {
    vi: string
    en: string
  }
  outcome: {
    vi: string
    en: string
  }
  codeTitle: string
  code: string
}

export interface TransportComparisonRow {
  feature: {
    vi: string
    en: string
  }
  websocket: {
    vi: string
    en: string
  }
  sse: {
    vi: string
    en: string
  }
  longPolling: {
    vi: string
    en: string
  }
  webTransport: {
    vi: string
    en: string
  }
}

export interface CloseCodeReference {
  code: string
  name: string
  reconnectPolicy: "reconnect-backoff" | "refresh-auth" | "fatal-stop"
  meaning: {
    vi: string
    en: string
  }
  action: {
    vi: string
    en: string
  }
}

export const WEBSOCKET_SIM_SCENARIOS: WebSocketSimScenario[] = [
  {
    id: "handshake-heartbeat",
    badge: "1. Handshake & Heartbeat",
    title: {
      vi: "1. Bắt tay HTTP 101 Upgrade, Full-Duplex Framing & Heartbeat",
      en: "1. HTTP 101 Upgrade Handshake, Full-Duplex Framing & Heartbeat",
    },
    subtitle: {
      vi: "Quá trình nâng cấp từ HTTP/1.1 sang TCP Full-Duplex và cơ chế phát hiện Zombie Socket bằng Ping/Pong.",
      en: "How HTTP/1.1 upgrades to a persistent Full-Duplex TCP socket and detects Zombie connections via Ping/Pong.",
    },
    code: `// 1. Client initiates HTTP/1.1 Upgrade Handshake
const ws = new WebSocket("wss://stream.perfgarden.dev/v1/market?last_seq=1040");

ws.addEventListener("open", () => {
  // readyState === WebSocket.OPEN (1)
  startHeartbeat(ws, { intervalMs: 15_000, timeoutMs: 5_000 });
});

function startHeartbeat(ws: WebSocket, cfg: { intervalMs: number; timeoutMs: number }) {
  let pongTimer: ReturnType<typeof setTimeout> | null = null;

  const pingInterval = setInterval(() => {
    if (ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "PING", ts: Date.now() }));

    // Dead-man switch: if PONG doesn't arrive within 5s, socket is Half-Open (Zombie)
    pongTimer = setTimeout(() => {
      console.warn("[WS] Zombie socket detected! Forcing close & reconnect...");
      ws.close(4000, "Heartbeat timeout");
    }, cfg.timeoutMs);
  }, cfg.intervalMs);

  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.type === "PONG" && pongTimer) clearTimeout(pongTimer);
  });
}`,
    steps: [
      {
        stepNumber: 1,
        phase: "HTTP/1.1 Upgrade Request (Client → Server)",
        readyState: "0 CONNECTING",
        clientMetrics: {
          activeTabs: "1 Tab",
          tcpSockets: "1 Handshaking",
          lastSeqId: "seq #1040",
          backoffDelay: "0ms",
          bufferedBytes: "0 B",
        },
        clientQueue: ["new WebSocket('wss://...')"],
        wireFrames: [
          "GET /v1/market?last_seq=1040 HTTP/1.1",
          "Connection: Upgrade | Upgrade: websocket",
          "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==",
        ],
        serverState: [
          "Validate Origin & Auth Token",
          "SHA-1(Key + GUID) → Sec-WebSocket-Accept",
        ],
        consoleLogs: [
          "[WS] Connecting to wss://stream.perfgarden.dev/v1/market...",
        ],
        explanation: {
          vi: "Trình duyệt mở kết nối TCP/TLS và gửi một **HTTP/1.1 GET Request** đặc biệt kèm header `Upgrade: websocket` và `Sec-WebSocket-Key` ngẫu nhiên. Lúc này `ws.readyState` đang ở trạng thái `0 (CONNECTING)`.",
          en: "The browser opens a TCP/TLS connection and sends an **HTTP/1.1 GET request** with `Upgrade: websocket` and a random `Sec-WebSocket-Key`. `ws.readyState` is `0 (CONNECTING)`.",
        },
      },
      {
        stepNumber: 2,
        phase: "101 Switching Protocols & Full-Duplex Open",
        readyState: "1 OPEN",
        clientMetrics: {
          activeTabs: "1 Tab",
          tcpSockets: "1 Established",
          lastSeqId: "seq #1042",
          backoffDelay: "0ms",
          bufferedBytes: "0 B",
        },
        clientQueue: ["onopen() fired", "Heartbeat timer armed (15s)"],
        wireFrames: [
          "HTTP/1.1 101 Switching Protocols",
          "Frame [FIN=1, Opcode=0x1 Text]: { seq: 1041, price: 94210 }",
          "Frame [FIN=1, Opcode=0x1 Text]: { seq: 1042, price: 94225 }",
        ],
        serverState: [
          "Socket registered in Gateway Epoll/Kqueue",
          "Subscribed to Redis Pub/Sub channel: market.btc",
        ],
        consoleLogs: [
          "[WS] Handshake 101 OK -> Full-Duplex tunnel active (readyState = 1)",
          "[WS] Received Frame seq=1041, seq=1042 (2–6 bytes framing overhead)",
        ],
        explanation: {
          vi: "Server trả về **`101 Switching Protocols`**. Kể từ giây phút này, HTTP biến mất — đường ống TCP trở thành kênh **Full-Duplex hai chiều** chỉ tốn **2–6 bytes header** cho mỗi Frame (không còn hàngKB HTTP Header mỗi lần gửi).",
          en: "The server replies with **`101 Switching Protocols`**. HTTP is now upgraded to a persistent **Full-Duplex binary/text framing tunnel** with only **2–6 bytes** of header overhead per frame.",
        },
      },
      {
        stepNumber: 3,
        phase: "Heartbeat Ping/Pong & Zombie Socket Detection",
        readyState: "1 OPEN",
        clientMetrics: {
          activeTabs: "1 Tab",
          tcpSockets: "1 Healthy",
          lastSeqId: "seq #1045",
          backoffDelay: "0ms",
          bufferedBytes: "0 B",
        },
        clientQueue: ["Send PING { ts }", "Clear dead-man timeout on PONG"],
        wireFrames: [
          "Client → Server: Frame [PING / Opcode 0x9]",
          "Server → Client: Frame [PONG / Opcode 0xA] (RTT: 18ms)",
        ],
        serverState: [
          "Gateway refreshes connection TTL (60s)",
          "Prevents AWS ALB / Cloudflare idle timeout disconnect",
        ],
        consoleLogs: [
          "[WS] Heartbeat PING sent -> PONG received in 18ms (Connection healthy)",
        ],
        explanation: {
          vi: "Sau mỗi 15–25 giây, Client gửi gói **`PING`** và đặt hẹn giờ 5 giây (**Dead-man switch**). Cơ chế này vừa giữ cho Load Balancer/NAT không cắt kết nối rảnh (idle timeout), vừa giúp phát hiện ngay trạng thái **Half-Open (Zombie Socket)** khi rớt mạng ngầm.",
          en: "Every 15–25s, the client sends a **`PING`** and starts a 5s **dead-man timer**. This prevents Load Balancer idle timeouts and immediately catches **Half-Open (Zombie) sockets** when a mobile network drops silently.",
        },
      },
    ],
  },
  {
    id: "disconnect-reconnect-sync",
    badge: "2. Disconnect & Jitter Recovery",
    title: {
      vi: "2. Mất kết nối (1006), Exponential Backoff + Jitter & Bù dữ liệu (Seq Gap)",
      en: "2. Connection Drop (1006), Exponential Backoff + Jitter & Sequence Gap Sync",
    },
    subtitle: {
      vi: "Chống bão Thundering Herd khi rớt mạng và khôi phục trọn vẹn các bản tin bị lỡ trong thời gian đứt kết nối.",
      en: "Preventing Thundering Herd reconnect storms and recovering missed messages without state drift.",
    },
    code: `function scheduleReconnect(attempt: number, lastSeq: number) {
  const baseMs = 500;
  const maxMs = 30_000;
  // Exponential Backoff: 500ms -> 1s -> 2s -> 4s -> 8s... capped at 30s
  const expCeiling = Math.min(maxMs, baseMs * Math.pow(2, attempt));
  // Full Jitter spreads 100,000 clients evenly across the window
  const delayMs = Math.round(Math.random() * expCeiling);

  setTimeout(() => {
    // Pass last known sequence ID to fetch missed delta messages!
    connectWebSocket(\`wss://stream.perfgarden.dev/v1/market?since_seq=\${lastSeq}\`);
  }, delayMs);
}`,
    steps: [
      {
        stepNumber: 1,
        phase: "Abnormal Disconnect (Close Code 1006) & Outbox Buffering",
        readyState: "3 CLOSED",
        clientMetrics: {
          activeTabs: "1 Tab",
          tcpSockets: "0 (Dropped)",
          lastSeqId: "seq #2080",
          backoffDelay: "Calculating...",
          bufferedBytes: "2 Pending Msgs",
        },
        clientQueue: [
          "Outbox[0]: { action: 'ack', id: 91 }",
          "Outbox[1]: { action: 'subscribe', topic: 'eth' }",
        ],
        wireFrames: [
          "✕ TCP RST / Heartbeat Timeout → CloseEvent(code: 1006, wasClean: false)",
        ],
        serverState: [
          "Server continues publishing seq #2081, #2082, #2083 to Redis Ring Buffer",
        ],
        consoleLogs: [
          "[WS] Connection lost (CloseCode 1006). Pausing live sends -> Buffering in Outbox",
          "[WS] Last verified sequence ID stored: seq #2080",
        ],
        explanation: {
          vi: "Khi mất mạng đột ngột (`CloseEvent 1006`), Client **không vứt bỏ các thao tác người dùng** mà tạm cất vào **Outbox Queue** có giới hạn, đồng thời ghi nhớ mã thứ tự bản tin cuối cùng nhận được (`lastSeqId = 2080`).",
          en: "When the connection drops (`CloseEvent 1006`), the client queues outgoing mutations in a bounded **Outbox Queue** and records the last processed sequence ID (`lastSeqId = 2080`).",
        },
      },
      {
        stepNumber: 2,
        phase: "Exponential Backoff + Full Jitter (Anti-Thundering Herd)",
        readyState: "3 CLOSED",
        clientMetrics: {
          activeTabs: "1 Tab",
          tcpSockets: "Waiting Jitter",
          lastSeqId: "seq #2080",
          backoffDelay: "1,420ms (Attempt #2)",
          bufferedBytes: "2 Pending Msgs",
        },
        clientQueue: [
          "expCeiling = min(30000, 500 * 2^2) = 2000ms",
          "jitterDelay = random(0, 2000) = 1420ms",
        ],
        wireFrames: ["(Waiting 1,420ms before opening TCP SYN...)"],
        serverState: [
          "Gateway CPU protected: 100k clients spread evenly across 0–2000ms window",
        ],
        consoleLogs: [
          "[WS] Reconnect attempt #2 scheduled in 1,420ms (Full Jitter applied)",
        ],
        explanation: {
          vi: "Thay vì dùng thời gian chờ cố định (khiến 100,000 máy khách đập vào Server cùng một mili-giây gây sập lại cụm Gateway), thuật toán **Exponential Backoff + Full Jitter** rải đều thời điểm kết nối lại trên toàn bộ cửa sổ thời gian.",
          en: "Instead of fixed retry timers (which cause 100,000 clients to hammer the server in the exact same millisecond), **Exponential Backoff + Full Jitter** spreads reconnection attempts uniformly.",
        },
      },
      {
        stepNumber: 3,
        phase: "Reconnect & Sequence Gap Delta Replay (#2081 → #2084)",
        readyState: "1 OPEN",
        clientMetrics: {
          activeTabs: "1 Tab",
          tcpSockets: "1 Re-established",
          lastSeqId: "seq #2084 (Synced)",
          backoffDelay: "Reset to 0ms",
          bufferedBytes: "0 B (Flushed)",
        },
        clientQueue: [
          "Replayed missed delta: #2081, #2082, #2083",
          "Flushed 2 Outbox messages -> Server ACK",
        ],
        wireFrames: [
          "GET /v1/market?since_seq=2080 HTTP/1.1 → 101 Switching Protocols",
          "Server → Client: Delta Batch [#2081, #2082, #2083] + Live #2084",
        ],
        serverState: [
          "Read Redis Stream XRANGE from seq 2081 → 2083",
          "Streamed missed delta + resumed real-time feed",
        ],
        consoleLogs: [
          "[WS] Reconnected! Replayed 3 missed messages (#2081..#2083) & flushed Outbox.",
        ],
        explanation: {
          vi: "Khi kết nối lại thành công, Client truyền `since_seq=2080`. Server lấy đúng 3 bản tin bị lỡ (`#2081..#2083`) từ bộ đệm Redis Stream trả về trước khi nối tiếp luồng thời gian thực (`#2084`), giúp giao diện **không bị mất hay lệch bất kỳ trạng thái nào**.",
          en: "Upon reconnecting with `since_seq=2080`, the server replays the exact missed delta (`#2081..#2083`) from Redis Streams before resuming live frames, guaranteeing **zero state drift**.",
        },
      },
    ],
  },
  {
    id: "peak-time-scale",
    badge: "3. Peak-Time Multiplexing & Backpressure",
    title: {
      vi: "3. Giờ cao điểm (Peak Time): Gộp đa Tab bằng SharedWorker & Chống tràn Backpressure",
      en: "3. Peak Time: Multi-Tab SharedWorker Multiplexing & Backpressure Control",
    },
    subtitle: {
      vi: "Làm sao xử lý khi người dùng mở 8 Tab cùng lúc và Server bắn 500 bản tin/giây vào giờ cao điểm?",
      en: "Handling 8 open browser tabs per user and 500 msg/sec bursts during peak traffic events.",
    },
    code: `// Inside SharedWorker (1 WebSocket shared across ALL open browser tabs!)
const tabPorts = new Set<MessagePort>();
const latestBySymbol = new Map<string, MarketTick>();
let rafScheduled = false;

onconnect = (event: MessageEvent) => {
  const port = event.ports[0];
  tabPorts.add(port);
  port.start();
};

ws.addEventListener("message", (event) => {
  const tick: MarketTick = JSON.parse(event.data);
  // Coalesce burst updates by key (only latest price per symbol matters per frame)
  latestBySymbol.set(tick.symbol, tick);

  if (!rafScheduled) {
    rafScheduled = true;
    setTimeout(() => {
      const batch = Array.from(latestBySymbol.values());
      latestBySymbol.clear();
      rafScheduled = false;
      for (const port of tabPorts) port.postMessage({ type: "BATCH", batch });
    }, 16); // 60Hz Frame Batching (max 60 updates/sec instead of 500/sec!)
  }
});`,
    steps: [
      {
        stepNumber: 1,
        phase: "Multi-Tab Socket Deduplication via SharedWorker",
        readyState: "1 OPEN",
        clientMetrics: {
          activeTabs: "8 Open Tabs",
          tcpSockets: "1 Shared Socket (-87%)",
          lastSeqId: "seq #9400",
          backoffDelay: "0ms",
          bufferedBytes: "1.2 KB",
        },
        clientQueue: [
          "Tab #1..#8 connected to SharedWorker MessagePort",
          "Only 1 TLS/TCP WebSocket opened to Gateway",
        ],
        wireFrames: [
          "1 Single WSS Connection multiplexing subscriptions for all 8 Tabs",
        ],
        serverState: [
          "Gateway saves 87.5% File Descriptors & RAM per multi-tab user",
        ],
        consoleLogs: [
          "[SharedWorker] 8 browser tabs attached -> Reusing 1 single WebSocket connection",
        ],
        explanation: {
          vi: "Vào giờ cao điểm, người dùng thường mở 5–10 tab để theo dõi nhiều mã/sản phẩm. Thay vì để mỗi tab mở 1 kết nối TCP riêng làm cạn kiệt cổng trên Server, **`SharedWorker`** đứng giữa giữ **đúng 1 kết nối WebSocket duy nhất** và phân phối dữ liệu cho cả 8 tab qua `MessagePort`.",
          en: "During peak events, users often open 5–10 tabs. Instead of opening 8 separate TCP sockets, a **`SharedWorker`** maintains **1 single WebSocket connection** and broadcasts to all 8 tabs via `MessagePort`.",
        },
      },
      {
        stepNumber: 2,
        phase: "High-Frequency Burst Coalescing (500 msg/s → 60Hz Batch)",
        readyState: "1 OPEN",
        clientMetrics: {
          activeTabs: "8 Open Tabs",
          tcpSockets: "1 Shared Socket",
          lastSeqId: "seq #9900 (+500/s)",
          backoffDelay: "0ms",
          bufferedBytes: "4.8 KB (Controlled)",
        },
        clientQueue: [
          "500 incoming ticks/sec coalesced into Map<symbol, latestTick>",
          "Flushed to React UI once every 16.6ms (60 FPS)",
        ],
        wireFrames: [
          "Burst: 500 frames/sec arriving from Gateway during market spike",
        ],
        serverState: ["Gateway batches non-critical broadcasts every 20ms"],
        consoleLogs: [
          "[Worker] Coalesced 42 intermediate ticks into 1 frame batch -> Main Thread 60 FPS",
        ],
        explanation: {
          vi: "Khi Server bắn 500 bản tin/giây xuống trình duyệt, gọi `setState` 500 lần/giây sẽ làm liệt cứng Main Thread. Worker gom và ghi đè theo khóa (`Map<symbol, latest>`) rồi chỉ đẩy xuống React UI **tối đa 1 lần mỗi 16.67ms (`requestAnimationFrame`)**.",
          en: "When 500 messages/sec arrive, calling React `setState` 500 times freezes the Main Thread. The worker coalesces updates into a `Map` by entity ID and flushes to the UI **once every 16.67ms (60Hz)**.",
        },
      },
      {
        stepNumber: 3,
        phase: "Load Shedding (1013) & Outbound Backpressure Guard",
        readyState: "1 OPEN",
        clientMetrics: {
          activeTabs: "8 Open Tabs",
          tcpSockets: "1 Shared Socket",
          lastSeqId: "seq #9950",
          backoffDelay: "0ms",
          bufferedBytes: "18 KB < 64 KB Limit",
        },
        clientQueue: [
          "Check ws.bufferedAmount < 65,536 bytes before ws.send()",
          "Drop stale cursor telemetry if socket send buffer is congested",
        ],
        wireFrames: [
          "Outbound check: ws.bufferedAmount = 18,432 B (Safe to send)",
        ],
        serverState: [
          "If cluster > 90% capacity: new non-VIP connections receive 1013 + fallback to CDN SSE/Polling",
        ],
        consoleLogs: [
          "[Backpressure] Outbound bufferedAmount (18KB) within 64KB budget.",
        ],
        explanation: {
          vi: "Ở chiều gửi lên, Client luôn kiểm tra `ws.bufferedAmount < 64KB` trước khi `send()` để tránh rò rỉ bộ nhớ khi mạng nghẽn. Nếu cụm Server quá tải cực hạn (`CloseCode 1013 Try Again Later`), Client tự động **hạ cấp mượt mà (Graceful Fallback)** sang đọc dữ liệu qua CDN Polling/SSE.",
          en: "For outbound traffic, the client checks `ws.bufferedAmount < 64KB` before calling `send()` to prevent memory bloat on slow networks, and gracefully falls back to CDN Polling/SSE if the server signals `1013 Try Again Later`.",
        },
      },
    ],
  },
]

export const WEBSOCKET_FAILURE_PLAYBOOK: WebSocketFailurePlaybookItem[] = [
  {
    id: "thundering-herd",
    shortLabel: {
      vi: "#1 Bão Reconnect (Thundering Herd)",
      en: "#1 Thundering Herd Reconnect",
    },
    category: "DISCONNECTION & RECOVERY",
    title: {
      vi: "Bài toán 1: Mất kết nối hàng loạt & Bão kết nối lại (Thundering Herd)",
      en: "Problem 1: Mass Disconnection & Thundering Herd Reconnect Storms",
    },
    problem: {
      vi: "Khi một node WebSocket Gateway được deploy lại hoặc mạng khu vực chập chờn trong 2 giây, 200,000 trình duyệt bị ngắt kết nối cùng lúc. Nếu tất cả client đều đặt `setTimeout(reconnect, 2000)`, đúng 2 giây sau cả 200,000 kết nối TLS/TCP Handshake sẽ ập vào Server cùng một mili-giây làm sập toàn bộ hệ thống.",
      en: "When a WebSocket Gateway restarts or a brief network blip drops 200,000 clients simultaneously, a fixed `setTimeout(reconnect, 2000)` causes all 200,000 clients to initiate expensive TLS/TCP handshakes in the exact same millisecond—crashing the recovering cluster.",
    },
    rootCause: {
      vi: "Sử dụng thời gian chờ kết nối lại cố định (Fixed Retry Interval) hoặc Exponential Backoff nhưng **thiếu thành phần ngẫu nhiên (Jitter)**, cộng với việc cố kết nối lại ngay cả khi `navigator.onLine === false` hoặc tab đang ẩn.",
      en: "Using a fixed retry interval or pure Exponential Backoff **without Jitter**, combined with blindly retrying while `navigator.onLine === false` or when the browser tab is backgrounded.",
    },
    solution: {
      vi: "Áp dụng **Exponential Backoff + Full Jitter**: `delay = Math.random() * Math.min(maxDelay, baseDelay * 2 ** attempt)`. Kết hợp lắng nghe sự kiện `window.addEventListener('online')` để kết nối lại ngay khi có mạng và giãn nhịp retry khi `document.visibilityState === 'hidden'`.",
      en: "Use **Exponential Backoff with Full Jitter**: `delay = Math.random() * Math.min(maxDelay, baseDelay * 2 ** attempt)`. Pause retries when `navigator.onLine === false`, trigger immediate jittered reconnect on the `online` event, and relax retry frequency when `document.hidden`.",
    },
    outcome: {
      vi: "Biến đỉnh tải nhọn (Spike 200,000 req/s) thành luồng kết nối phẳng và đều đặn, bảo vệ tuyệt đối CPU của Load Balancer và Auth Service.",
      en: "Flattens a 200,000-connection spike into a smooth, uniform ramp-up, protecting Load Balancer and Auth CPU.",
    },
    codeTitle: "reconnect-with-full-jitter.ts",
    code: `export function computeReconnectDelayMs(attempt: number): number {
  const BASE_DELAY_MS = 500;
  const MAX_DELAY_MS = 30_000;

  // 1. Exponential ceiling: 500ms, 1000ms, 2000ms, 4000ms... capped at 30s
  const ceiling = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * Math.pow(2, attempt));

  // 2. Full Jitter: spreads clients evenly across [250ms, ceiling]
  return Math.floor(BASE_DELAY_MS / 2 + Math.random() * (ceiling - BASE_DELAY_MS / 2));
}`,
  },
  {
    id: "zombie-half-open",
    shortLabel: {
      vi: "#2 Zombie / Half-Open Socket",
      en: "#2 Zombie / Half-Open Socket",
    },
    category: "SILENT NETWORK DROP",
    title: {
      vi: "Bài toán 2: Kết nối 'Chết lâm sàng' (Half-Open / Zombie Connection)",
      en: "Problem 2: Silent Network Drops & Half-Open (Zombie) Connections",
    },
    problem: {
      vi: "Người dùng đi vào thang máy, chuyển từ Wifi sang 4G, hoặc bộ định tuyến NAT/Firewall giữa đường âm thầm xóa bảng kết nối rảnh mà không gửi gói `TCP FIN` hay `RST`. Trên trình duyệt, `ws.readyState` vẫn hiển thị `1 (OPEN)`, giao diện vẫn báo chấm xanh 'Online', nhưng thực tế mọi bản tin nhận/gửi đều rơi vào hư không.",
      en: "A user enters an elevator, switches from Wi-Fi to 5G, or an intermediate NAT/Firewall silently drops an idle connection without sending a `TCP FIN` or `RST`. The browser's `ws.readyState` still reports `1 (OPEN)`, showing a fake 'Online' badge while no data flows.",
    },
    rootCause: {
      vi: "WebSocket API trên trình duyệt không tự phát hiện được đường truyền vật lý bị đứt ngầm nếu hệ điều hành chưa nhận được gói tin báo đóng hoặc chưa hết thời gian TCP Keep-Alive của OS (thường lên tới vài십 phút).",
      en: "Browser WebSocket APIs cannot detect silent mid-route blackholes until OS-level TCP keep-alive expires (which defaults to 15–120 minutes on many operating systems).",
    },
    solution: {
      vi: "Triển khai **Application-level Heartbeat (`PING` / `PONG`) kết hợp Dead-man Timer**: Định kỳ mỗi 20 giây gửi `{ type: 'PING' }` và khởi động bộ đếm ngược `5000ms`. Nếu trong 5 giây không nhận được `PONG` (hoặc bất kỳ bản tin hợp lệ nào từ Server), lập tức gọi `ws.close(4000, 'Heartbeat timeout')` và khởi tạo kết nối mới.",
      en: "Implement an **Application-level Heartbeat (`PING` / `PONG`) with a Dead-man Switch**: Every 20s, send `{ type: 'PING' }` and arm a `5000ms` timeout. Any incoming server frame resets the timer; if the 5s timeout fires, forcefully close the zombie socket (`ws.close()`) and reconnect.",
    },
    outcome: {
      vi: "Phát hiện và tự phục hồi kết nối đứt ngầm chỉ trong vòng ≤ 5 giây thay vì để người dùng nhìn màn hình đơ hàng chục phút.",
      en: "Detects and recovers from silent blackhole disconnects within ≤ 5 seconds instead of leaving users on a frozen screen.",
    },
    codeTitle: "heartbeat-watchdog.ts",
    code: `export class HeartbeatWatchdog {
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private deadManTimer: ReturnType<typeof setTimeout> | null = null;

  start(ws: WebSocket, onZombieDetected: () => void) {
    this.stop();
    this.pingTimer = setInterval(() => {
      if (ws.readyState !== WebSocket.OPEN) return;
      ws.send(JSON.stringify({ type: "PING", ts: Date.now() }));

      this.deadManTimer = setTimeout(() => {
        onZombieDetected(); // Force close & trigger reconnect!
      }, 5_000);
    }, 20_000);
  }

  notifyAlive() {
    if (this.deadManTimer) {
      clearTimeout(this.deadManTimer);
      this.deadManTimer = null;
    }
  }

  stop() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.deadManTimer) clearTimeout(this.deadManTimer);
  }
}`,
  },
  {
    id: "peak-time-connections",
    shortLabel: {
      vi: "#3 Peak Time: Quá tải Connection",
      en: "#3 Peak Time: Too Many Connections",
    },
    category: "PEAK TRAFFIC SCALING",
    title: {
      vi: "Bài toán 3: Giờ cao điểm (Peak Time) — Quá tải số lượng Connection & Mở nhiều Tab",
      en: "Problem 3: Peak Time — Connection Exhaustion & Multi-Tab Multiplication",
    },
    problem: {
      vi: "Vào khung giờ cao điểm (Flash Sale, Livestream, Công bố lãi suất), lượng người dùng tăng gấp 10 lần và mỗi người lại mở 5–10 tab trình duyệt. Cụm WebSocket Gateway bị cạn kiệt File Descriptors / Ephemeral Ports, RAM tăng vọt do trạng thái mỗi socket, và các kết nối mới bị từ chối.",
      en: "During peak events (Flash Sales, Livestreams, Market Opens), traffic spikes 10x while power users open 5–10 browser tabs each. The WebSocket cluster runs out of file descriptors and memory, causing connection timeouts.",
    },
    rootCause: {
      vi: "Mỗi tab trình duyệt khởi tạo một `new WebSocket()` độc lập (nhân 5–10 lần tải kết nối không cần thiết), cộng thêm thiếu cơ chế **Admission Control / Graceful Degradation** khi cụm Server chạm ngưỡng giới hạn vật lý.",
      en: "Each browser tab naively opens its own `new WebSocket()` (multiplying connection load 5–10x), and the client lacks **Graceful Degradation** when the gateway signals capacity saturation.",
    },
    solution: {
      vi: "Kết hợp 3 lớp phòng thủ: **(1) Gộp kết nối đa Tab bằng `SharedWorker` + `BroadcastChannel`** (10 tab chỉ dùng chung 1 socket duy nhất); **(2) Lazy / On-Demand Connection** (ngắt hoặc hạ tần suất socket ở các thiết bị không tương tác lâu); **(3) Graceful Degradation khi nhận mã `1013 Try Again Later`** — tự động chuyển sang đọc dữ liệu qua HTTP/2 SSE hoặc Polling qua CDN Edge Cache (nơi có thể phục vụ hàng triệu req/s rất nhẹ nhàng).",
      en: "Combine 3 layers: **(1) Multi-Tab Multiplexing via `SharedWorker` + `BroadcastChannel`** (all tabs share 1 single socket); **(2) Idle Tab Hibernation**; **(3) Graceful Fallback on Close Code `1013 Try Again Later`** — seamlessly fall back to CDN-cached HTTP Polling or SSE during extreme spikes.",
    },
    outcome: {
      vi: "Giảm ngay 70–85% số lượng kết nối TCP thừa từ phía trình duyệt và đảm bảo 100% người dùng vẫn xem được dữ liệu qua kênh Fallback CDN khi Peak Time vượt ngưỡng.",
      en: "Cuts redundant client TCP connections by 70–85% and keeps 100% of users served via CDN fallback during extreme spikes.",
    },
    codeTitle: "multi-tab-shared-socket.ts",
    code: `// Client Tab: Connect through SharedWorker so 10 tabs share 1 WebSocket!
export function createMultiplexedStream(onMessage: (data: unknown) => void) {
  if (typeof SharedWorker !== "undefined") {
    const worker = new SharedWorker("/ws-shared-worker.js", { name: "perfgarden-ws" });
    worker.port.onmessage = (ev) => onMessage(ev.data);
    worker.port.start();
    return {
      send: (payload: unknown) => worker.port.postMessage({ type: "SEND", payload }),
    };
  }
  // Fallback for browsers without SharedWorker
  const ws = new WebSocket("wss://stream.perfgarden.dev/v1/live");
  ws.onmessage = (ev) => onMessage(JSON.parse(ev.data));
  return { send: (payload: unknown) => ws.send(JSON.stringify(payload)) };
}`,
  },
  {
    id: "peak-time-backpressure",
    shortLabel: {
      vi: "#4 Peak Time: Bão Message & Backpressure",
      en: "#4 Peak Time: Message Flood & Backpressure",
    },
    category: "HIGH-FREQUENCY THROUGHPUT",
    title: {
      vi: "Bài toán 4: Giờ cao điểm — Bão bản tin tốc độ cao (Message Flood) & Nghẽn bộ nhớ",
      en: "Problem 4: Peak Time — High-Frequency Message Floods & Memory Backpressure",
    },
    problem: {
      vi: "Khi có biến động lớn, Server đẩy 300–1,000 message/giây xuống mỗi kết nối (hoặc Client gửi liên tục sự kiện chuột/telemetry lên khi mạng người dùng bị nghẽn). Trình duyệt bị đơ cứng (FPS tụt về < 10 FPS) do React re-render liên tục, hoặc `ws.bufferedAmount` tăng lên hàng chục MB gây crash tab (`Out of Memory`).",
      en: "During high-activity bursts, the server pushes 300–1,000 messages/sec (or the client sends rapid events over a congested uplink). React re-renders lock up the Main Thread (<10 FPS) or `ws.bufferedAmount` balloons into tens of megabytes, crashing the tab.",
    },
    rootCause: {
      vi: "Xử lý từng sự kiện `ws.onmessage` trực tiếp vào `useState`/`dispatch` (1 message = 1 lần React reconciliation), và gọi `ws.send()` mù quáng mà không kiểm tra dung lượng bộ đệm TCP đang tồn đọng (`ws.bufferedAmount`).",
      en: "Triggering a React state update on every single `ws.onmessage` event (1 message = 1 render pass), and calling `ws.send()` without checking `ws.bufferedAmount`.",
    },
    solution: {
      vi: "**Chiều nhận (Inbound)**: Nhận và parse JSON trong Worker (hoặc buffer ngoài React), gộp các bản tin cùng khóa (`Map<id, latest>`), và chỉ flush vào Store đúng **1 lần mỗi nhịp `requestAnimationFrame` (16.67ms = tối đa 60 lần/giây)**. **Chiều gửi (Outbound)**: Kiểm tra `ws.bufferedAmount < MAX_BUFFER_BYTES (64KB)` trước khi gửi; nếu vượt ngưỡng thì gộp (coalesce) hoặc bỏ qua các gói tin không quan trọng.",
      en: "**Inbound**: Buffer incoming messages in a `Map` or Ring Buffer and flush to React state **at most once per `requestAnimationFrame` (16.67ms / 60Hz)**. **Outbound**: Check `ws.bufferedAmount < 65_536` before sending; drop or coalesce non-critical telemetry frames when congested.",
    },
    outcome: {
      vi: "Giữ vững 60 FPS mượt mà ngay cả khi nhận 1,000 bản tin/giây và bảo vệ bộ nhớ Heap không bao giờ bị phình to.",
      en: "Maintains a locked 60 FPS under 1,000 msg/sec bursts and caps outbound socket memory usage.",
    },
    codeTitle: "backpressure-and-raf-batcher.ts",
    code: `const MAX_BUFFERED_BYTES = 64 * 1024; // 64 KB outbound backpressure limit

export function sendWithBackpressure(
  ws: WebSocket,
  payload: unknown,
  priority: "critical" | "droppable" = "droppable"
): boolean {
  if (ws.readyState !== WebSocket.OPEN) return false;

  // If TCP send buffer is congested, drop non-critical telemetry/cursor frames
  if (ws.bufferedAmount > MAX_BUFFERED_BYTES && priority === "droppable") {
    return false;
  }
  ws.send(JSON.stringify(payload));
  return true;
}`,
  },
  {
    id: "state-drift-sequence-gap",
    shortLabel: {
      vi: "#5 Mất bản tin & Lệch dữ liệu (Seq Gap)",
      en: "#5 State Drift & Sequence Gaps",
    },
    category: "DATA CONSISTENCY",
    title: {
      vi: "Bài toán 5: Lệch trạng thái (State Drift) & Mất bản tin trong thời gian đứt mạng",
      en: "Problem 5: State Drift, Missed Messages & Out-of-Order Delivery on Reconnect",
    },
    problem: {
      vi: "Khi kết nối bị đứt trong 4 giây rồi tự kết nối lại thành công, các sự kiện xảy ra trong 4 giây đó (tin nhắn chat mới, trạng thái đơn hàng chuyển sang 'Đã thanh toán', khớp lệnh) đã bị bỏ lỡ hoàn toàn. Giao diện nhìn có vẻ đã kết nối lại nhưng hiển thị dữ liệu sai lệch so với Server.",
      en: "When a socket drops for 4 seconds and reconnects, all events emitted during those 4 seconds (new chat messages, order status transitions, trade fills) are missed. The UI appears connected but displays stale, inconsistent state.",
    },
    rootCause: {
      vi: "WebSocket chỉ đảm bảo thứ tự gói tin **trong phạm vi 1 phiên TCP đơn lẻ**. Khi kết nối TCP cũ đứt và kết nối TCP mới được tạo, giao thức WebSocket chuẩn không tự động lưu hay phát lại các bản tin bị rơi ở giữa hai phiên.",
      en: "WebSocket only guarantees in-order delivery **within a single TCP session**. Across a disconnect and reconnect, native WebSocket has no built-in message replay or gap recovery.",
    },
    solution: {
      vi: "Gắn số thứ tự tăng dần (**Monotonic Sequence Number `seq`** hoặc `offset`) cho mọi bản tin. Client lưu `lastSeqId` đã xử lý; nếu phát hiện `incoming.seq > lastSeqId + 1` hoặc vừa Reconnect xong, Client gửi yêu cầu **Delta Sync (`?since_seq=lastSeqId`)** để bù các bản tin bị thiếu (hoặc tải lại **Full Snapshot** nếu khoảng cách `seq` quá xa ngoài bộ đệm của Server).",
      en: "Attach a **Monotonic Sequence ID (`seq`)** to every message. Track `lastSeqId` on the client; on reconnect (or if `msg.seq > lastSeqId + 1`), request a **Delta Replay (`since_seq=lastSeqId`)** or fall back to a **Full REST Snapshot** if the gap exceeds the server's ring buffer.",
    },
    outcome: {
      vi: "Đảm bảo tính toàn vẹn dữ liệu 100% (Zero Message Loss) qua mọi lần rớt mạng và kết nối lại.",
      en: "Guarantees 100% eventual state consistency and zero silent message loss across network drops.",
    },
    codeTitle: "sequence-gap-reconciler.ts",
    code: `export class SequenceReconciler {
  private lastSeq = 0;

  onFrame(msg: { seq: number; data: unknown }, requestDelta: (from: number, to: number) => void) {
    if (msg.seq <= this.lastSeq) return; // Ignore duplicate frame

    if (this.lastSeq > 0 && msg.seq > this.lastSeq + 1) {
      // Gap detected! e.g. jumped from #105 to #109 -> fetch #106..#108
      requestDelta(this.lastSeq + 1, msg.seq - 1);
    }
    this.lastSeq = msg.seq;
  }
}`,
  },
  {
    id: "close-codes-auth-refresh",
    shortLabel: {
      vi: "#6 Mã lỗi CloseEvent & Hết hạn Token",
      en: "#6 CloseEvent Codes & Token Refresh",
    },
    category: "ERROR HANDLING & SECURITY",
    title: {
      vi: "Bài toán 6: Phân loại Mã lỗi Đóng kết nối (`CloseEvent`) & Vòng lặp Hết hạn Token",
      en: "Problem 6: Handling CloseEvent Codes & Preventing Expired-Token Reconnect Loops",
    },
    problem: {
      vi: "Khi JWT Access Token hết hạn hoặc người dùng bị thu hồi quyền, Server đóng kết nối. Nếu code phía Client cứ thấy `onclose` là gọi `reconnect()` với chiếc token cũ đã hết hạn, hàng chục nghìn client sẽ tạo ra vòng lặp vô tận (Infinite Auth Failure Loop) bắn sập Auth Middleware.",
      en: "When a JWT access token expires or permissions are revoked, the server closes the socket. If the client's `onclose` handler blindly retries with the same expired token, it triggers an infinite reconnect loop that DDoSes the auth middleware.",
    },
    rootCause: {
      vi: "Không phân biệt mã lỗi trong `event.code` của `CloseEvent` — đánh đồng lỗi mạng tạm thời (`1006`, `1012`, `1013`) với lỗi xác thực (`4001`) hoặc lỗi vi phạm chính sách (`1008`).",
      en: "Treating all `CloseEvent` codes identically instead of branching on `event.code` to distinguish transient network drops (`1006`, `1012`) from auth expiration (`4001`) or fatal policy errors (`1008`).",
    },
    solution: {
      vi: "Xây dựng **State Machine phân loại `CloseEvent.code`**: (1) Với `1000` (chủ động đóng): Không kết nối lại; (2) Với `4001` (Token hết hạn): Tạm dừng kết nối, gọi API làm mới Access Token (`refreshToken()`) thành công rồi mới mở lại socket; (3) Với `1008` / `4003` (Forbidden/Invalid Schema): Ngắt hẳn (Fatal Stop) và báo lỗi UI; (4) Với `1006`, `1011`, `1012`, `1013`: Chạy Exponential Backoff + Jitter.",
      en: "Route `CloseEvent.code` through an explicit policy table: `1000` → clean stop; `4001` → await `refreshAccessToken()` before reconnecting; `1008`/`4003` → fatal stop (do not retry); `1006`/`1011`/`1012`/`1013` → reconnect with Exponential Backoff + Jitter.",
    },
    outcome: {
      vi: "Triệt tiêu hoàn toàn vòng lặp kết nối lỗi vô tận và làm mới phiên đăng nhập mượt mà không làm gián đoạn người dùng.",
      en: "Eliminates infinite auth retry storms and refreshes credentials seamlessly.",
    },
    codeTitle: "close-code-policy.ts",
    code: `export async function handleSocketClose(
  event: CloseEvent,
  actions: { reconnectWithJitter: () => void; refreshAuthAndReconnect: () => Promise<void>; stopFatal: (reason: string) => void }
) {
  if (event.code === 1000) return; // Normal intentional closure

  if (event.code === 4001) {
    // Custom app code: Access token expired -> refresh once before reconnecting
    await actions.refreshAuthAndReconnect();
    return;
  }

  if (event.code === 1008 || event.code === 1003 || event.code === 4003) {
    // Policy violation / Unsupported data / Forbidden -> DO NOT RETRY!
    actions.stopFatal(\`Fatal WebSocket close (\${event.code}): \${event.reason}\`);
    return;
  }

  // Transient network/server errors (1001, 1006, 1011, 1012, 1013)
  actions.reconnectWithJitter();
}`,
  },
]

export const REALTIME_TRANSPORT_COMPARISON: TransportComparisonRow[] = [
  {
    feature: {
      vi: "Chiều truyền dữ liệu (Directionality)",
      en: "Communication Direction",
    },
    websocket: {
      vi: "Full-Duplex 2 chiều thực thụ (Client ⇄ Server độ trễ ~1–2ms)",
      en: "True Full-Duplex Bi-directional (Client ⇄ Server)",
    },
    sse: {
      vi: "1 chiều Server → Client (Gửi lên phải dùng POST riêng)",
      en: "Unidirectional Server → Client (Uploads require separate fetch)",
    },
    longPolling: {
      vi: "Giả lập qua chuỗi request HTTP nối đuôi nhau",
      en: "Simulated via repeated hanging HTTP requests",
    },
    webTransport: {
      vi: "2 chiều đa luồng + Unreliable Datagrams (UDP/QUIC)",
      en: "Bi-directional multiplexed streams + QUIC Datagrams",
    },
  },
  {
    feature: {
      vi: "Chi phí Frame Header (Overhead)",
      en: "Framing Overhead",
    },
    websocket: {
      vi: "Rất nhỏ: 2–6 bytes mỗi frame sau khi bắt tay",
      en: "Tiny: 2–6 bytes per frame after initial handshake",
    },
    sse: {
      vi: "Nhỏ: Text stream (`data: ...\n\n`), hỗ trợ nén Gzip/Brotli liên tục",
      en: "Low: Text event stream (`data: ...\n\n`) over HTTP",
    },
    longPolling: {
      vi: "Rất lớn: Phải gửi lại toàn bộ HTTP Headers + Cookies mỗi vòng",
      en: "High: Full HTTP headers & cookies repeated on every poll",
    },
    webTransport: {
      vi: "Rất nhỏ: Frame nhị phân trên nền HTTP/3 QUIC",
      en: "Minimal binary framing over HTTP/3 QUIC",
    },
  },
  {
    feature: {
      vi: "Gộp kết nối trên 1 TCP (HTTP/2 Multiplexing)",
      en: "HTTP/2 Multiplexing",
    },
    websocket: {
      vi: "Thấp (RFC 6455 thường chiếm 1 kết nối TCP riêng biệt mỗi socket)",
      en: "Limited (RFC 6455 typically dedicates 1 TCP connection per socket)",
    },
    sse: {
      vi: "Rất tốt: Nhiều stream SSE qua HTTP/2 dùng chung 1 kết nối TCP duy nhất",
      en: "Excellent: Multiple SSE streams share 1 single HTTP/2 TCP connection",
    },
    longPolling: {
      vi: "Có qua HTTP/2 nhưng tốn tài nguyên xử lý Request/Response",
      en: "Multiplexed over HTTP/2, but high request lifecycle overhead",
    },
    webTransport: {
      vi: "Tuyệt đối: Nhiều luồng độc lập trên 1 kết nối QUIC không bị nghẽn chéo",
      en: "Native: Independent streams over a single QUIC connection",
    },
  },
  {
    feature: {
      vi: "Head-of-Line (HoL) Blocking",
      en: "Head-of-Line Blocking",
    },
    websocket: {
      vi: "Có ở tầng TCP: Mất 1 gói tin TCP sẽ chặn toàn bộ các frame phía sau",
      en: "Yes (TCP-level): 1 dropped packet stalls all subsequent frames",
    },
    sse: {
      vi: "Có ở tầng TCP",
      en: "Yes (TCP-level)",
    },
    longPolling: {
      vi: "Mỗi request độc lập nhưng độ trễ giữa các chu kỳ cao",
      en: "High inter-request latency",
    },
    webTransport: {
      vi: "Không bị HoL Blocking giữa các stream nhờ giao thức QUIC (UDP)",
      en: "Zero cross-stream HoL blocking thanks to QUIC over UDP",
    },
  },
  {
    feature: {
      vi: "Khi nào nên chọn?",
      en: "Best Use Cases",
    },
    websocket: {
      vi: "Chat 2 chiều, Collaborative Editing (Figma/Docs), Sàn giao dịch, Multiplayer Game",
      en: "Bi-directional Chat, Collaborative Docs, Trading Orderbooks, Multiplayer",
    },
    sse: {
      vi: "AI Token Streaming (ChatGPT), Thông báo đẩy 1 chiều, Bảng tin Live Score",
      en: "AI LLM Token Streaming, Live Notifications, News/Score Tickers",
    },
    longPolling: {
      vi: "Kênh dự phòng (Fallback) khi mạng doanh nghiệp chặn WebSocket",
      en: "Resilient fallback when corporate proxies block WebSockets",
    },
    webTransport: {
      vi: "Cloud Gaming, Live Video/Audio độ trễ cực thấp (chấp nhận rớt gói)",
      en: "Ultra-low-latency Cloud Gaming, Media Streaming, Real-time Telemetry",
    },
  },
]

export const CLOSE_CODE_REFERENCE: CloseCodeReference[] = [
  {
    code: "1000",
    name: "Normal Closure",
    reconnectPolicy: "fatal-stop",
    meaning: {
      vi: "Phiên kết nối đóng bình thường và có chủ đích (ví dụ người dùng rời trang).",
      en: "Normal, intentional closure after the session completed its purpose.",
    },
    action: {
      vi: "Dọn dẹp bộ nhớ & timer; KHÔNG kết nối lại.",
      en: "Clean up timers & listeners; DO NOT reconnect.",
    },
  },
  {
    code: "1001",
    name: "Going Away",
    reconnectPolicy: "reconnect-backoff",
    meaning: {
      vi: "Server đang tắt để bảo trì/deploy hoặc trình duyệt điều hướng sang trang khác.",
      en: "Server node is shutting down (rolling deploy) or browser navigated away.",
    },
    action: {
      vi: "Nếu trang vẫn mở: Reconnect với Exponential Backoff + Full Jitter.",
      en: "If page is still active: Reconnect with Exponential Backoff + Full Jitter.",
    },
  },
  {
    code: "1006",
    name: "Abnormal Closure",
    reconnectPolicy: "reconnect-backoff",
    meaning: {
      vi: "Kết nối bị đứt đột ngột (rớt mạng, mất Wifi, Heartbeat timeout) mà không có Close frame.",
      en: "Connection dropped abnormally (network loss, TCP RST) without a Close frame.",
    },
    action: {
      vi: "Lưu các thao tác vào Outbox, chờ mạng `online` và chạy Backoff + Jitter kèm `since_seq`.",
      en: "Buffer outgoing events in Outbox, check `online`, and reconnect with Jitter + `since_seq`.",
    },
  },
  {
    code: "1008",
    name: "Policy Violation",
    reconnectPolicy: "fatal-stop",
    meaning: {
      vi: "Vi phạm chính sách bảo mật, Origin không hợp lệ hoặc vượt quá giới hạn Rate Limit cứng.",
      en: "Request violated server policy, invalid Origin, or hard rate-limit ban.",
    },
    action: {
      vi: "Dừng hẳn (Fatal Stop) và hiển thị thông báo lỗi cho người dùng.",
      en: "Fatal stop; do not auto-retry. Surface error state to UI.",
    },
  },
  {
    code: "1012 / 1013",
    name: "Service Restart / Try Again Later",
    reconnectPolicy: "reconnect-backoff",
    meaning: {
      vi: "1012: Gateway đang khởi động lại. 1013: Server đang quá tải giờ cao điểm (Load Shedding).",
      en: "1012: Gateway restarting. 1013: Server is shedding load during a peak traffic spike.",
    },
    action: {
      vi: "Tăng hệ số chờ Backoff + Jitter, hoặc chuyển sang chế độ Fallback đọc qua CDN Polling/SSE.",
      en: "Apply extended Backoff + Jitter or degrade gracefully to CDN Polling/SSE.",
    },
  },
  {
    code: "4001",
    name: "Unauthorized / Token Expired",
    reconnectPolicy: "refresh-auth",
    meaning: {
      vi: "Mã ứng dụng tùy chỉnh (4000–4999): JWT Access Token đã hết hạn.",
      en: "Application custom code (4000–4999): JWT Access Token has expired.",
    },
    action: {
      vi: "Gọi API `refreshToken()` để lấy token mới trước khi khởi tạo lại kết nối.",
      en: "Await `refreshToken()` to obtain a fresh credential before reconnecting.",
    },
  },
]
