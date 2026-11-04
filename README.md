# Senior FE Performance Lab

Hệ thống phòng thí nghiệm tương tác (**Interactive Performance Workbench**) và cẩm nang chẩn đoán (**Diagnostic Playbook**) tổng hợp **18 bài toán hiệu năng Frontend thực chiến** dành cho Senior / Staff Frontend Engineer.

## Công nghệ sử dụng (Tech Stack)

- **Framework**: Next.js 16.4 (App Router) + React 19.3 + TypeScript 5
- **Styling & UI**: Tailwind CSS v4 + shadcn/ui
- **State & Telemetry Engine**: `zustand` (Atomic Selectors, `useShallow`, High-frequency HUD Store)
- **Data Fetching & Caching**: `@tanstack/react-query` (Parallel Queries, Request Deduplication, SWR, 0ms Optimistic UI & Rollback)
- **DOM Windowing / Virtualization**: `@tanstack/react-virtual` (10,000+ & 50,000+ rows)
- **Đa ngôn ngữ (i18n)**: `next-intl` (Chuyển đổi tức thì **Tiếng Việt `VI`** / **Tiếng Anh `EN`** qua Cookie mà không đổi URL)

## Kiến trúc 6 Trụ cột & 18 Bài Lab Thực chiến

### Pillar 1 — Rendering & React Internals
- **1.1 Re-render Storms & Context Bloat**: So sánh Monolithic React Context vs **Zustand Atomic Selectors (`useShallow`) & State Colocation**.
- **1.2 Concurrent React (`useTransition` & `useDeferredValue`)**: Tách Urgent Input Updates khỏi Non-Urgent Heavy List Reconciliation.
- **1.3 DOM Virtualization & Windowing**: Render 10,000+ dòng log với `@tanstack/react-virtual` (~180 DOM nodes, 60 FPS).

### Pillar 2 — Main Thread & Runtime (INP & FPS)
- **2.1 Long Tasks & Cooperative Main-Thread Yielding**: Cắt nhỏ tác vụ >50ms bằng Time-Slicing & `scheduler.yield()`.
- **2.2 Web Workers Offloading**: Đẩy mô phỏng Monte Carlo 240,000 mẫu sang Dedicated Web Worker OS Thread (`0ms` UI Freeze).
- **2.3 Layout Thrashing & Forced Synchronous Layout**: Tách biệt Batch Reads và Batch Writes + GPU Compositor `transform: scaleY()`.

### Pillar 3 — Memory & Resource Leaks
- **3.1 Detached DOM Nodes & Global Reference Leaks**: Ngăn chặn rò rỉ cây DOM đã unmount bằng `WeakMap` / `WeakRef` & Cleanup.
- **3.2 Closures, Stale Timers & Uncleaned Listeners**: Dọn dẹp triệt để Zombie Event Listeners & Lexical Closures bằng `AbortController`.
- **3.3 Unbounded In-Memory Cache vs Bounded LRU**: Cấu trúc **O(1) LRU Cache** có giới hạn dung lượng chống phình RAM trên SPA.

### Pillar 4 — Loading, Network & Core Web Vitals (LCP, CLS, TTFB)
- **4.1 Request Waterfalls vs Parallel Fetching**: Xóa bỏ thác nước tuần tự 4 tầng bằng `@tanstack/react-query` Parallel Execution.
- **4.2 Cumulative Layout Shift (CLS) & Space Reservation**: Đạt `CLS = 0.000` với Geometric Slot Reservation & Aspect-Ratio.
- **4.3 Request Deduplication, SWR & Optimistic UI**: Hợp nhất 6 request trùng lặp thành 1 HTTP call và cập nhật UI trong `0ms` kèm Rollback.

### Pillar 5 — Data-Intensive & Large-Scale UI
- **5.1 High-Frequency Real-time Stream (Orderbook)**: Xử lý luồng 200+ ticks/giây bằng `O(1)` Mutable Map Buffer + `requestAnimationFrame` Batch Flush.
- **5.2 Heavy Client-Side Data Grid (50,000 Rows)**: Pre-computed Search Index + Layered `useMemo` Pipeline + `@tanstack/react-virtual`.
- **5.3 Input Responsiveness & Abortable Search**: Chống bão request và lỗi Stale Response Race Condition bằng Debounce + `AbortController`.

### Pillar 6 — Bundle, Assets & Execution Architecture
- **6.1 Code Splitting, Dynamic Imports & Prefetch on Intent**: Giảm 90% Initial Bundle kết hợp `onMouseEnter` Intent Preloading để mở Modal trong `0ms`.
- **6.2 Barrel Files (`index.ts`) & Tree-Shaking Traps**: Phân tích đồ thị module khi import qua Barrel có side-effects vs Direct Subpath Imports.
- **6.3 Third-Party Scripts & Heavy Widget Isolation**: Bảo vệ quá trình Hydration (`0ms` 3rd-party TBT) bằng Lightweight HTML/CSS Facade Pattern.

## Khởi chạy dự án

```bash
pnpm dev
```

Mở `http://localhost:3000` để truy cập **Overview & Diagnostic Matrix** hoặc chọn từng bài Lab ở thanh điều hướng bên trái.
