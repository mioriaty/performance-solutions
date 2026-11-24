export interface FoundationTopic {
  slug: "event-loop" | "web-socket"
  code: string
  href: string
  badge: string
  metrics: string[]
  title: {
    vi: string
    en: string
  }
  shortTitle: {
    vi: string
    en: string
  }
  summary: {
    vi: string
    en: string
  }
  highlights: {
    vi: string[]
    en: string[]
  }
}

export const FOUNDATION_TOPICS: FoundationTopic[] = [
  {
    slug: "event-loop",
    code: "F1",
    href: "/foundations/event-loop",
    badge: "16.67ms Frame Budget",
    metrics: ["Call Stack", "Microtask", "rAF", "Pixel Pipeline"],
    title: {
      vi: "JavaScript Event Loop & Browser Pixel Pipeline",
      en: "JavaScript Event Loop & Browser Pixel Pipeline",
    },
    shortTitle: {
      vi: "Event Loop & Pixel Pipeline",
      en: "Event Loop & Pixel Pipeline",
    },
    summary: {
      vi: "Cơ chế điều phối Call Stack, Microtask Starvation vs. Macrotask Yielding, chu trình VSync 16.67ms và 5 bước Pixel Pipeline (JS → Style → Layout → Paint → Composite).",
      en: "How the browser schedules the Call Stack, Microtasks, Macrotasks, 16.67ms VSync frames, and the 5-stage Pixel Pipeline (JS → Style → Layout → Paint → Composite).",
    },
    highlights: {
      vi: [
        "Thứ tự ưu tiên trong 1 Tick: Sync → 100% Microtasks → rAF & Paint → 1 Macrotask",
        "Tại sao React 19 Concurrent Scheduler dùng MessageChannel thay vì Promise hay setTimeout(0)",
        "Ma trận CSS Triggers: Thuộc tính nào gây Reflow (Layout), Repaint hay chỉ GPU Composite",
      ],
      en: [
        "Single-tick priority: Sync → 100% Microtasks → rAF & Paint → 1 Macrotask",
        "Why React 19 Concurrent Scheduler uses MessageChannel instead of Promises or setTimeout(0)",
        "CSS Triggers Matrix: Layout Reflow vs. Paint vs. GPU Composite properties",
      ],
    },
  },
  {
    slug: "web-socket",
    code: "F2",
    href: "/foundations/web-socket",
    badge: "RFC 6455 & Real-Time",
    metrics: ["Full-Duplex", "Heartbeat", "Backpressure", "SharedWorker"],
    title: {
      vi: "WebSocket Architecture, Peak-Time Scaling & Failure Resilience",
      en: "WebSocket Architecture, Peak-Time Scaling & Failure Resilience",
    },
    shortTitle: {
      vi: "WebSocket & Real-time Systems",
      en: "WebSocket & Real-time Systems",
    },
    summary: {
      vi: "Từ bắt tay HTTP 101 Upgrade, đóng gói Frame nhị phân, đối sánh SSE/WebTransport đến 6 bài toán thực chiến: chống bão Reconnect (Full Jitter), phát hiện Zombie Socket, gộp kết nối đa Tab giờ cao điểm (SharedWorker), kiểm soát Backpressure và đồng bộ bù dữ liệu (Sequence Gap).",
      en: "From HTTP 101 Upgrade handshakes and binary framing to 6 production engineering challenges: Thundering Herd reconnect jitter, Zombie socket detection, Peak-Time Multi-Tab SharedWorker multiplexing, Backpressure, and Sequence Gap recovery.",
    },
    highlights: {
      vi: [
        "Cơ chế HTTP/1.1 101 Upgrade Handshake, Binary/Text Framing (2–6B overhead) & Pub/Sub Gateway",
        "Xử lý mất mạng: Exponential Backoff + Full Jitter, Heartbeat Watchdog (Half-Open) & Sequence Gap Replay",
        "Giờ cao điểm (Peak Time): Gộp 10 Tab vào 1 Socket bằng SharedWorker, Load Shedding (1013) & rAF Backpressure",
      ],
      en: [
        "HTTP/1.1 101 Upgrade Handshake, RFC 6455 Framing (2–6B overhead) & Stateful Pub/Sub Gateways",
        "Disconnection resilience: Exponential Backoff + Full Jitter, Heartbeat Watchdog & Sequence Gap Replay",
        "Peak Time scaling: Multi-Tab SharedWorker multiplexing, 1013 Load Shedding & rAF Backpressure",
      ],
    },
  },
]
