import type { LabDefinition } from "./types"

export const LABS_PILLARS_4_TO_6: LabDefinition[] = [
  // ============================================================================
  // PILLAR 4: LOADING, NETWORK & CORE WEB VITALS (LCP, CLS, TTFB)
  // ============================================================================
  {
    slug: "network-waterfalls",
    code: "4.1",
    pillarId: 4,
    primaryMetric: "LCP / TTFB",
    severity: "critical",
    libraries: ["@tanstack/react-query", "useQueries", "Promise.all"],
    content: {
      vi: {
        title: "Request Waterfalls vs Parallel Fetching & Streaming",
        subtitle:
          "Triệt tiêu hiệu ứng thác nước (Client Request Waterfall) làm nhân 4 lần thời gian tải trang bằng TanStack Query Parallel Queries & Preloading",
        symptomSummary:
          "Mỗi API chỉ mất 300ms nhưng toàn bộ màn hình Dashboard phải chờ tới 1,300ms – 1,800ms mới hiển thị xong dữ liệu.",
        rootCauseSummary:
          "Component cha fetch xong mới mount Component con, và Component con lúc đó mới bắt đầu gọi `useEffect` fetch tiếp (hoặc `await` nối đuôi nhau tuần tự cho các dữ liệu độc lập).",
        symptoms: [
          "Trong Chrome DevTools Network tab, các thanh request xếp thành hình bậc thang chéo (cái trước kết thúc thì cái sau mới bắt đầu).",
          "Giao diện nháy qua 3-4 lớp Skeleton/Spinner nối tiếp nhau gây cảm giác tải rất chậm và đẩy lùi thời điểm LCP.",
        ],
        underTheHood: [
          "Khi Component Cha viết `if (isLoading) return <Spinner />`, toàn bộ nhánh Component Con bên dưới chưa từng được mount. Do đó, các lệnh fetch bên trong Component Con hoàn toàn không được khởi chạy cho tới khi Cha tải xong.",
          "Tương tự, việc viết `const a = await fetchA(); const b = await fetchB();` khi `b` không phụ thuộc vào kết quả của `a` làm tổng thời gian chờ bằng tổng cộng dồn `T_total = T_1 + T_2 + T_3 + T_4` thay vì `max(T_1, T_2, T_3, T_4)`.",
        ],
        solution: [
          "Sử dụng `useQueries` của `@tanstack/react-query` hoặc `Promise.all` để kích hoạt toàn bộ các request độc lập song song ngay ở tầng Route/Page.",
          "Với các request có phụ thuộc (ví dụ cần `orgId`), truyền sẵn từ URL params/session hoặc dùng **Preload Pattern** (gọi `queryClient.prefetchQuery` ngay khi bắt đầu chuyển trang/hover).",
          "Kết hợp `<Suspense>` độc lập cho từng khối widget để khối nào xong trước hiển thị ngay (Streaming), không bắt khối nhanh phải chờ khối chậm.",
        ],
        tradeoffs: [
          "Bắn quá nhiều request nặng cùng lúc trên kết nối yếu có thể cạnh tranh băng thông; cần ưu tiên (priority) dữ liệu thuộc vùng Above-the-Fold (LCP) trước các khối ở chân trang.",
        ],
        devtoolsSteps: [
          "Ở chế độ `Baseline` (Sequential Waterfall), bấm 'Run Stress Test': quan sát biểu đồ Network Timeline bên dưới khi 4 tầng API (`User -> Team -> Analytics -> Audit`) chạy nối đuôi nhau mất ~1,400ms.",
          "Chuyển sang chế độ `Optimized` (`@tanstack/react-query` `useQueries` Parallel): cả 4 API khởi chạy cùng một thời điểm `t = 0ms`, hoàn tất toàn bộ chỉ trong ~350ms (nhanh hơn 75%).",
          "Mở Chrome DevTools -> Network tab -> Lọc `Fetch/XHR` để kiểm chứng hình dáng Waterfall (bậc thang) so với Parallel (thẳng hàng dọc).",
        ],
        takeaway:
          "Đừng bao giờ để cấu trúc lồng nhau của cây Component quyết định thứ tự gọi mạng! Hãy khởi tạo Data Fetching ở tầng cao nhất (Hoist Queries / Preload) hoặc chạy song song bằng `useQueries` / `Promise.all`.",
      },
      en: {
        title: "Request Waterfalls vs Parallel Fetching & Streaming",
        subtitle:
          "Flattening multi-stage client request waterfalls that multiply load times by 4x using TanStack Query parallel orchestration",
        symptomSummary:
          "Each individual API responds in ~300ms, yet the dashboard takes 1.3–1.8 seconds before content appears.",
        rootCauseSummary:
          "Parent components block mounting children behind loading guards (`if (loading) return <Spinner />`), delaying child fetches until parent requests finish—or awaiting independent promises sequentially.",
        symptoms: [
          "Chrome DevTools Network waterfall shows a diagonal staircase where Request B only starts after Request A completes.",
          "Users see sequential waves of spinners (`Page Spinner -> Section Spinner -> Card Spinner`), severely degrading LCP.",
        ],
        underTheHood: [
          "When a parent component conditionally returns `<Spinner />` while fetching, child components never mount and cannot initiate their own data fetches.",
          "Sequential fetching turns total latency into the sum `T_1 + T_2 + T_3 + T_4` instead of the parallel maximum `max(T_1, T_2, T_3, T_4)`.",
        ],
        solution: [
          "Hoist data dependencies and fire all independent queries in parallel using `@tanstack/react-query`'s `useQueries` or `Promise.all`.",
          "Preload child queries in route loaders or on link hover (`queryClient.prefetchQuery`) before components even finish mounting.",
          "Render independent `<Suspense>` boundaries so fast widgets paint immediately without waiting for slow sibling endpoints.",
        ],
        tradeoffs: [
          "Firing dozens of low-priority background requests simultaneously can contend with critical LCP resources; prioritize above-the-fold queries first.",
        ],
        devtoolsSteps: [
          "In `Baseline` mode (Sequential Waterfall), click 'Run Stress Test': watch the visual network timeline execute `User -> Team -> Analytics -> Audit` one after another (~1,400ms total).",
          "Switch to `Optimized` mode (TanStack `useQueries` Parallel): all 4 requests launch at `t = 0ms` and complete in ~350ms (a 75% latency reduction).",
          "Verify in Chrome DevTools -> Network tab (`Fetch/XHR`) how the staircase collapses into a vertical parallel stack.",
        ],
        takeaway:
          "Never let component tree hierarchy dictate network request timing. Hoist and parallelize independent fetches at the route boundary.",
      },
    },
    badCode: `// [Baseline] Unoptimized: Sequential Waterfall (T_total = 350 + 350 + 350 + 350 = 1,400ms)
async function loadDashboardWaterfall() {
  const user = await fetch("/api/perf?step=user").then((r) => r.json());
  // Waits for user even though team/analytics/audit can be fetched in parallel.
  const team = await fetch("/api/perf?step=team").then((r) => r.json());
  const analytics = await fetch("/api/perf?step=analytics").then((r) => r.json());
  const audit = await fetch("/api/perf?step=audit").then((r) => r.json());
  return { user, team, analytics, audit };
}`,
    goodCode: `// [Optimized]: TanStack Query useQueries Parallel Execution (T_total = ~350ms)
import { useQueries } from "@tanstack/react-query";

export function useDashboardParallel(delayMs: number) {
  return useQueries({
    queries: ["user", "team", "analytics", "audit"].map((step) => ({
      queryKey: ["dashboard-step", step, delayMs],
      queryFn: () =>
        fetch(\`/api/perf?step=\${step}&delay=\${delayMs}\`).then((r) => r.json()),
    })),
  });
}`,
  },

  {
    slug: "cls-layout-shifts",
    code: "4.2",
    pillarId: 4,
    primaryMetric: "CLS",
    severity: "high",
    libraries: ["CSS aspect-ratio", "Dimension Reservation", "Skeleton UI"],
    content: {
      vi: {
        title: "Cumulative Layout Shift (CLS) & Space Reservation",
        subtitle:
          "Chấm dứt tình trạng giao diện nhảy loạn xạ khi tải ảnh, banner khuyến mãi và nội dung bất đồng bộ khiến người dùng bấm nhầm nút",
        symptomSummary:
          "Người dùng đang chuẩn bị bấm nút 'Hủy' thì một banner hoặc ảnh phía trên tải xong đẩy toàn bộ trang tụt xuống, khiến người dùng bấm nhầm vào nút 'Thanh toán ngay'.",
        rootCauseSummary:
          "Chèn phần tử động (banner, thông báo, quảng cáo) vào phía trên nội dung hiện có hoặc hiển thị ảnh/video/skeleton không khai báo trước chiều cao / tỷ lệ khung hình (`aspect-ratio`).",
        symptoms: [
          "Điểm CLS (Cumulative Layout Shift) vượt ngưỡng 0.10 (Kém khi > 0.25).",
          "Văn bản đang đọc bị giật xuống dưới mỗi khi khối dữ liệu phía trên tải xong.",
        ],
        underTheHood: [
          "Công thức tính điểm CLS của trình duyệt: `Layout Shift Score = Impact Fraction × Distance Fraction` (Tỷ lệ diện tích khung nhìn bị ảnh hưởng nhân với Tỷ lệ quãng đường phần tử bị đẩy đi).",
          "Khi thẻ `<img>` hoặc khối async widget ban đầu có `height: 0px` và sau 300ms mới nhận dữ liệu để nở ra `height: 220px`, trình duyệt buộc phải đẩy toàn bộ các phần tử DOM bên dưới xuống 220px, gây ra cả **Reflow** lẫn điểm phạt **CLS** nặng nề.",
        ],
        solution: [
          "Luôn định trước kích thước khung chứa (Slot Reservation) bằng `aspect-ratio: 16 / 9`, `min-height`, hoặc `width` & `height` cố định cho ảnh, video, chart và quảng cáo.",
          "Thiết kế **Exact-Match Skeleton**: khung xương loading phải có kích thước pixel khớp 100% với trạng thái sau khi tải xong dữ liệu.",
          "Không bao giờ chèn động nội dung mới vào phía trên khung nhìn hiện tại trừ khi do chính hành động click vừa rồi của người dùng kích hoạt.",
        ],
        tradeoffs: [
          "Với các khối nội dung động không thể biết trước chiều cao chính xác 100% (ví dụ bình luận dài/ngắn), hãy đặt `min-height` bằng chiều cao trung bình phổ biến hoặc dùng CSS `overflow-anchor: auto` để giữ vị trí cuộn.",
        ],
        devtoolsSteps: [
          "Ở chế độ `Baseline`, bấm 'Simulate Page Load / Stress Test': quan sát Banner khuyến mãi và Ảnh Hero nạp trễ không có khung giữ chỗ làm nút 'Xác nhận đơn hàng' bị đẩy tụt xuống 2 lần, điểm CLS vọt lên > 0.320 (Đỏ).",
          "Chuyển sang chế độ `Optimized` (Reserved Aspect-Ratio & Matched Skeleton Slots) và chạy lại: các khối nạp dữ liệu bất đồng bộ lấp đầy đúng khung đã giữ chỗ, nút bấm đứng im tuyệt đối, **CLS = 0.000**.",
          "Mở Chrome DevTools -> Command Menu (`Cmd+Shift+P`) -> Gõ `Show Rendering` -> Tích chọn **Layout Shift Regions** để thấy các vùng bị nhảy sáng màu xanh dương.",
        ],
        takeaway:
          "CLS = 0.000 là hoàn toàn khả thi nếu tuân thủ nguyên tắc: Mọi nội dung tải bất đồng bộ nằm trong khung nhìn đầu tiên (Above the Fold) đều phải được cấp phát trước diện tích hình học (Geometric Slot Reservation).",
      },
      en: {
        title: "Cumulative Layout Shift (CLS) & Space Reservation",
        subtitle:
          "Achieving a 0.000 CLS score by reserving geometric slots with aspect-ratio, dimension matching skeletons, and stable grid containers",
        symptomSummary:
          "Just as the user goes to click 'Cancel', a late-loading banner or image pops in above and shifts the layout down—causing an accidental click on 'Confirm Purchase'.",
        rootCauseSummary:
          "Rendering unsized media (`<img>` / video / chart) or injecting late-arriving async banners above existing content without reserving explicit geometric space.",
        symptoms: [
          "Core Web Vitals CLS exceeds the 0.10 threshold (often > 0.25).",
          "Page elements jump vertically in waves as network requests resolve.",
        ],
        underTheHood: [
          "The browser computes `Layout Shift Score = Impact Fraction × Distance Fraction` for every unexpected shift of visible elements between two rendered frames.",
          "When an async banner mounts at `height: 0` and expands to `180px` 300ms later, every sibling below shifts down by 180px—penalizing both CLS and user trust.",
        ],
        solution: [
          "Reserve exact layout boxes upfront using CSS `aspect-ratio`, explicit `width`/`height` attributes, or `min-height` containers.",
          "Build **Dimension-Matched Skeletons** whose bounding boxes match the final loaded component height down to the pixel.",
          "Never inject unsolicited dynamic content above existing viewport elements without reserved space.",
        ],
        tradeoffs: [
          "When dynamic content height is genuinely unpredictable, reserve the P50 minimum height (`min-height`) and rely on CSS scroll anchoring (`overflow-anchor: auto`) for below-the-fold expansions.",
        ],
        devtoolsSteps: [
          "In `Baseline` mode, click 'Run Stress Test': watch the late-arriving promo banner and unsized hero graphic push the checkout buttons down twice, spiking CLS to ~0.340.",
          "Switch to `Optimized` mode (Reserved Slots & Aspect-Ratio) and run again: async content populates inside pre-allocated containers with **CLS = 0.000**.",
          "In Chrome DevTools -> Rendering drawer -> Enable **Layout Shift Regions** to visualize shifted areas in real time.",
        ],
        takeaway:
          "Every async boundary or media element above the fold must reserve its geometric bounding box prior to network resolution.",
      },
    },
    badCode: `// [Baseline] Unoptimized: Late banner & unsized image push the action buttons down (CLS = 0.34)
export function CheckoutHeaderBad({ promoLoaded, imageLoaded }) {
  return (
    <div>
      {/* Pops in from 0px -> 64px height when async fetch resolves! */}
      {promoLoaded && <div className="h-16 bg-amber-500">Flash Sale Banner!</div>}

      {/* No aspect-ratio or height reserved prior to load! */}
      {imageLoaded && <div className="h-44 w-full bg-indigo-500">Hero Graphic</div>}

      <div className="mt-4 flex gap-2">
        <button>Confirm $999 Order</button>
        <button>Cancel</button>
      </div>
    </div>
  );
}`,
    goodCode: `// [Optimized]: Pre-allocated geometric slots guarantee CLS = 0.000
export function CheckoutHeaderGood({ promoLoaded, imageLoaded }) {
  return (
    <div>
      {/* 1. Reserved 64px slot: skeleton matches loaded banner height 1:1 */}
      <div className="h-16 w-full overflow-hidden rounded-md">
        {promoLoaded ? (
          <div className="h-full bg-amber-500">Flash Sale Banner!</div>
        ) : (
          <div className="h-full animate-pulse bg-muted" />
        )}
      </div>

      {/* 2. Reserved aspect-ratio / fixed height container */}
      <div className="mt-3 aspect-[16/5] h-44 w-full overflow-hidden rounded-md">
        {imageLoaded ? (
          <div className="h-full w-full bg-indigo-500">Hero Graphic</div>
        ) : (
          <div className="h-full w-full animate-pulse bg-muted" />
        )}
      </div>

      {/* Action buttons never move a single pixel! */}
      <div className="mt-4 flex gap-2">
        <button>Confirm $999 Order</button>
        <button>Cancel</button>
      </div>
    </div>
  );
}`,
  },

  {
    slug: "dedup-optimistic-ui",
    code: "4.3",
    pillarId: 4,
    primaryMetric: "Network",
    severity: "high",
    libraries: [
      "@tanstack/react-query",
      "Request Deduplication",
      "Optimistic UI",
    ],
    content: {
      vi: {
        title: "Request Deduplication, SWR & Optimistic UI",
        subtitle:
          "Hợp nhất 6 API trùng lặp thành 1 request duy nhất và phản hồi thao tác người dùng trong 0ms với TanStack Query Optimistic Mutations",
        symptomSummary:
          "Khi mở trang, tab Network bắn ra 5-6 request giống hệt nhau tới cùng 1 endpoint; khi bấm nút Like/Bookmark/Đổi trạng thái, người dùng phải nhìn vòng xoay chờ gần 1 giây.",
        rootCauseSummary:
          "Nhiều component độc lập cùng gọi `useEffect(() => fetch('/api/me'))` khi mount mà không có tầng In-flight Request Deduplication, và chờ Server trả lời xong mới cập nhật UI.",
        symptoms: [
          "Tab Network xuất hiện 6 dòng gọi `/api/perf?step=metrics` cùng lúc từ `Navbar`, `Sidebar`, `ProfileCard`, `QuotaBadge`...",
          "Mỗi lần bấm toggle trạng thái phải đợi 600-800ms mạng khứ hồi (Round-Trip Time) làm ứng dụng có cảm giác chậm chạp.",
        ],
        underTheHood: [
          "Với `fetch` trong `useEffect` thuần, mỗi component giữ một Promise riêng biệt nên trình duyệt gửi đi N gói tin HTTP trùng lặp.",
          "**TanStack Query** quản lý các query theo `queryKey` trong một `QueryCache` tập trung: nếu 6 component cùng mount và yêu cầu `['workspace-quota']` khi request đầu tiên đang bay trên mạng (in-flight), 5 component sau sẽ tự động bám vào (piggyback) chung đúng 1 Promise đó.",
          "Với **Optimistic UI (`onMutate`)**, ta cập nhật ngay giá trị dự kiến vào Cache trong `0ms` để UI đổi trạng thái tức thì, đồng thời lưu lại bản chụp `previousData`. Nếu API báo lỗi 500, hàm `onError` tự động khôi phục (rollback) về trạng thái cũ an toàn.",
        ],
        solution: [
          "Thay thế toàn bộ `useEffect + fetch` rời rạc bằng `useQuery` có chung `queryKey` và cấu hình `staleTime` hợp lý (Stale-While-Revalidate).",
          "Sử dụng `useMutation` với bộ ba `onMutate` (cập nhật ngay + trả về context snapshot), `onError` (rollback nếu lỗi), và `onSettled` (đồng bộ lại ngầm với server).",
        ],
        tradeoffs: [
          "Không nên dùng Optimistic UI cho các tác vụ có tỷ lệ thất bại cao hoặc không thể đảo ngược như Thanh toán thẻ tín dụng, Chuyển khoản ngân hàng, hoặc Xóa vĩnh viễn dữ liệu nhạy cảm.",
        ],
        devtoolsSteps: [
          "Ở chế độ `Baseline`, bấm 'Mount 6 Widgets / Run Stress Test': 6 component con cùng mount và bắn ra **6 HTTP requests trùng lặp** lên server; khi bấm nút Toggle trạng thái, phải đợi 700ms mới đổi màu.",
          "Chuyển sang chế độ `Optimized` (TanStack Query Deduplication + Optimistic UI): cả 6 widget cùng hiển thị dữ liệu nhưng chỉ tốn **đúng 1 HTTP request duy nhất**! Khi bấm Toggle trạng thái, thời gian phản hồi UI là **0ms** (và bạn có thể bật 'Simulate Server Error' để xem cơ chế tự động Rollback hoạt động!).",
        ],
        takeaway:
          "Tốc độ cảm nhận (Perceived Performance) quan trọng không kém tốc độ mạng thực tế: Request Deduplication tiết kiệm băng thông, còn Optimistic UI biến độ trễ 700ms thành trải nghiệm 0ms tức thì.",
      },
      en: {
        title: "Request Deduplication, SWR & Optimistic UI",
        subtitle:
          "Collapsing 6 duplicate widget fetches into 1 network request and delivering 0ms perceived mutation latency with TanStack Query",
        symptomSummary:
          "Mounting a page fires 6 identical API requests from different components, and toggling a status button forces the user to stare at a spinner for 700ms.",
        rootCauseSummary:
          "Multiple components independently running `useEffect(() => fetch(...))` without an in-flight request deduplication cache, and waiting for server round-trips before updating UI state.",
        symptoms: [
          "DevTools Network panel shows 5–10 duplicate GET calls to the same endpoint on page mount.",
          "Simple interactions (star, toggle status, reorder) feel sluggish due to waiting on full HTTP round-trips.",
        ],
        underTheHood: [
          "Raw `useEffect` fetches create isolated Promises per component instance.",
          "TanStack Query hashes the `queryKey` inside a shared `QueryClient` cache: when 6 components mount simultaneously requesting `['metrics']`, only **1 network request** is dispatched while all 6 observers subscribe to the same in-flight Promise.",
          "Optimistic Updates (`onMutate`) mutate the client cache synchronously in `0ms` while snapshotting previous state—rolling back cleanly inside `onError` if the server rejects the request.",
        ],
        solution: [
          "Standardize data fetching around `useQuery` with shared `queryKey`s and `staleTime` (Stale-While-Revalidate).",
          "Implement `useMutation` with `onMutate` (instant optimistic cache update + snapshot) and `onError` (automatic rollback).",
        ],
        tradeoffs: [
          "Avoid optimistic UI for high-stakes, non-idempotent operations (payment capture, wire transfers, permanent destructive actions) where a rollback would confuse or alarm the user.",
        ],
        devtoolsSteps: [
          "In `Baseline` mode, click 'Run Stress Test': mounting 6 independent widgets fires **6 duplicate HTTP calls**, and toggling a task waits ~700ms for the server.",
          "Switch to `Optimized` mode (TanStack Query): all 6 widgets hydrate from **1 shared HTTP request**, and toggling tasks updates in **0ms** (toggle 'Simulate 503 Failure' to test automatic rollback!).",
        ],
        takeaway:
          "Combine in-flight Request Deduplication with Optimistic Mutations (plus rollback safety) to make network-bound apps feel local-first.",
      },
    },
    badCode: `// [Baseline] Unoptimized: 6 mounted widgets fire 6 duplicate requests + 700ms mutation lag
export function QuotaWidgetBad() {
  const [data, setData] = useState(null);
  useEffect(() => {
    // Every widget instance fires its own redundant HTTP request.
    fetch("/api/perf?step=quota").then((r) => r.json()).then(setData);
  }, []);
  return <div>{data?.cacheHitRatio}</div>;
}`,
    goodCode: `// [Optimized]: 1 deduplicated request for all 6 widgets + 0ms Optimistic Mutation
export function QuotaWidgetGood() {
  // 6 widgets sharing this queryKey trigger only 1 network request.
  const { data } = useQuery({
    queryKey: ["workspace-quota"],
    queryFn: () => fetch("/api/perf?step=quota").then((r) => r.json()),
  });
  return <div>{data?.metrics.cacheHitRatio}</div>;
}`,
  },

  // ============================================================================
  // PILLAR 5: DATA-INTENSIVE & LARGE-SCALE UI
  // ============================================================================
  {
    slug: "high-frequency-streams",
    code: "5.1",
    pillarId: 5,
    primaryMetric: "FPS",
    severity: "critical",
    libraries: ["requestAnimationFrame Batching", "Ring Buffer", "Zustand"],
    content: {
      vi: {
        title: "High-Frequency Real-time Stream (150+ msg/sec Orderbook)",
        subtitle:
          "Xử lý luồng dữ liệu WebSocket/SSE tốc độ cao (Sàn giao dịch, Live Telemetry, Chat) bằng Buffer + rAF Flush thay vì gọi setState trên mỗi bản tin",
        symptomSummary:
          "Khi thị trường biến động mạnh (WebSocket bắn 100-200 messages/giây), giao diện bảng giá / biểu đồ bị đơ cứng, CPU 100% và React báo lỗi Maximum update depth.",
        rootCauseSummary:
          "Gọi trực tiếp `setState` trên mỗi sự kiện `ws.onmessage`, ép React phải chạy Reconciliation 150-200 lần/giây trong khi màn hình chỉ vẽ được tối đa 60 khung hình/giây (60Hz).",
        symptoms: [
          "Lượt Render (Render Count) tăng hàng trăm lần mỗi giây khi luồng stream hoạt động.",
          "Trình duyệt không kịp xử lý sự kiện click chuột của người dùng vì hàng đợi React update bị ngập lụt.",
        ],
        underTheHood: [
          "Màn hình tiêu chuẩn làm tươi ở tần số 60Hz (mỗi 16.67ms mới vẽ 1 lần). Nếu WebSocket nhận 180 tin nhắn/giây ( ~5.5ms/tin) và mỗi tin bạn đều gọi `setTickers(prev => ...)`, tức là có tới 2/3 số lần React tính toán Virtual DOM bị vứt đi vô ích trước khi màn hình kịp vẽ.",
          "Bằng cách gom toàn bộ tin nhắn đến vào một bộ đệm Mutable (`Map` hoặc `RingBuffer` trong `useRef`) và chỉ xả (flush) vào React state đúng **1 lần mỗi khung hình thông qua `requestAnimationFrame`**, ta khóa trần số lần render tối đa ở 60fps (hoặc 20-30fps có kiểm soát) bất kể WebSocket bắn 100 hay 5,000 tin/giây.",
        ],
        solution: [
          "Tách tầng **Ingestion (Nhận dữ liệu)** khỏi tầng **Rendering (Hiển thị)**: `ws.onmessage` chỉ ghi đè vào `pendingUpdatesRef.current.set(symbol, tick)` với chi phí `O(1)` (~0.001ms).",
          "Sử dụng vòng lặp `requestAnimationFrame` (hoặc bộ nhịp 50ms) kiểm tra nếu `pendingUpdatesRef.size > 0` thì gộp toàn bộ thay đổi vào state trong 1 lần commit duy nhất rồi làm rỗng buffer.",
        ],
        tradeoffs: [
          "Dữ liệu hiển thị trên màn hình có độ trễ tối đa bằng 1 khung hình (~16.6ms) so với thời điểm gói tin chạm card mạng — con số này hoàn toàn vô hình với mắt người nhưng cứu sống toàn bộ CPU.",
        ],
        devtoolsSteps: [
          "Ở chế độ `Baseline` (Unthrottled `setState` per tick), bật luồng Stream 160 ticks/giây hoặc bấm 'Run Stress Test': quan sát Render Count nhảy điên cuồng và FPS sụt giảm.",
          "Chuyển sang chế độ `Optimized` (`Map` Buffer + `requestAnimationFrame` Batched Flush): dù tốc độ bắn tin lên tới 200 ticks/giây, số lần commit UI được gộp gọn gàng, FPS giữ vững 60 và Main Thread hoàn toàn nhẹ nhàng.",
        ],
        takeaway:
          "Không bao giờ nối trực tiếp sự kiện mạng tần suất cao (`ws.onmessage`, `mousemove`, `scroll`) thẳng vào `setState`. Luôn đặt một tầng **Mutable Buffer + `requestAnimationFrame` Flush** ở giữa.",
      },
      en: {
        title: "High-Frequency Real-time Stream (150+ msg/sec Orderbook)",
        subtitle:
          "Decoupling 200+ msg/sec WebSocket/SSE ingestion from React rendering using an O(1) Map Buffer and requestAnimationFrame batch flushing",
        symptomSummary:
          "During peak market volatility (100–200 WebSocket ticks/sec), a trading dashboard or live telemetry feed freezes the browser and pegs CPU at 100%.",
        rootCauseSummary:
          "Calling React `setState` directly inside `ws.onmessage` triggers 150–200 React tree reconciliations per second even though a 60Hz display only paints 60 frames per second.",
        symptoms: [
          "Render Count skyrockets by hundreds of renders per second while the stream is active.",
          "Buttons and dropdowns become unresponsive because React's scheduler is flooded with continuous state commits.",
        ],
        underTheHood: [
          "At 60Hz, the browser paints once every 16.67ms. Triggering React reconciliation every 4ms means 75% of Virtual DOM diffs are discarded before the monitor ever refreshes.",
          "By buffering incoming messages in a mutable `Map<Symbol, Tick>` (`useRef`) and flushing once per `requestAnimationFrame`, `N` intermediate updates for the same symbol coalesce in `O(1)` time into a single frame commit.",
        ],
        solution: [
          "Decouple **Stream Ingestion** from **UI Rendering**: `onmessage` mutates `bufferRef.current.set(tick.symbol, tick)` in `<0.01ms` without touching React.",
          "Schedule a single `requestAnimationFrame` flush loop that merges buffered updates into React/Zustand state at most once per frame (or every 32ms).",
        ],
        tradeoffs: [
          "Coalescing per animation frame introduces at most ~16.6ms of visual batching delay, which is imperceptible to the human eye while cutting CPU usage by 70–90%.",
        ],
        devtoolsSteps: [
          "In `Baseline` mode (Direct `setState` on every tick), start the 160 msg/sec stream or click 'Run Stress Test': watch Render Count explode and frame times degrade.",
          "Switch to `Optimized` mode (Coalesced `Map` Buffer + `rAF` Flush): even at 200+ msg/sec, redundant intermediate ticks coalesce cleanly and FPS stays locked at 60.",
        ],
        takeaway:
          "Never pipe high-frequency external events (`WebSocket`, `SSE`, `pointermove`) directly into React `setState`. Buffer in a mutable ref/map and flush on `requestAnimationFrame`.",
      },
    },
    badCode: `// [Baseline] Unoptimized: Calls setState 180 times/sec — triggers 180 React tree diffs/sec.
socket.onmessage = (event) => {
  const tick = JSON.parse(event.data);
  // Clones array & reconciles component tree on EVERY single WebSocket message
  setOrderbook((prev) =>
    prev.map((row) => (row.symbol === tick.symbol ? { ...row, ...tick } : row))
  );
};`,
    goodCode: `// [Optimized]: O(1) Mutable Map Buffer + Single requestAnimationFrame Flush
const pendingBuffer = useRef(new Map<string, TickerUpdate>());
const rafScheduled = useRef(false);

socket.onmessage = (event) => {
  const tick = JSON.parse(event.data);
  // 1. O(1) write into mutable buffer — coalesces duplicate symbol updates.
  pendingBuffer.current.set(tick.symbol, tick);

  // 2. Schedule at most ONE React commit for the upcoming animation frame
  if (!rafScheduled.current) {
    rafScheduled.current = true;
    requestAnimationFrame(() => {
      const batch = new Map(pendingBuffer.current);
      pendingBuffer.current.clear();
      rafScheduled.current = false;
      flushBatchToStore(batch); // Single batched state update.
    });
  }
};`,
  },

  {
    slug: "heavy-data-grid",
    code: "5.2",
    pillarId: 5,
    primaryMetric: "INP",
    severity: "critical",
    libraries: [
      "@tanstack/react-virtual",
      "Pre-computed Index",
      "Memoized Pipeline",
    ],
    content: {
      vi: {
        title:
          "Heavy Client-Side Data Grid (50,000 Rows Sort, Filter & Aggregation)",
        subtitle:
          "Thiết kế kiến trúc xử lý 50,000 dòng dữ liệu tài chính phía Client với Pre-normalized Search Index, Memoized Pipeline và Virtual Grid",
        symptomSummary:
          "Bảng dữ liệu lớn khi bấm Sort cột, lọc theo trạng thái hoặc chỉ cần đổi tab/hover vào dòng cũng bị khựng 200-400ms.",
        rootCauseSummary:
          "Chạy lại chuỗi `.filter().sort().reduce()` trên 50,000 object ở mỗi lần component re-render (kể cả khi chỉ đổi state UI như `selectedRowId`) và gọi `.toLowerCase()` lặp đi lặp lại hàng trăm nghìn lần.",
        symptoms: [
          "Chỉ cần click chọn 1 dòng (`setSelectedRow(id)`) cũng mất 200ms vì hàm filter/sort chạy lại từ đầu.",
          "Gõ tìm kiếm trên 50,000 dòng tốn quá nhiều thời gian cấp phát chuỗi tạm (`toLowerCase()`) gây áp lực lên Garbage Collector.",
        ],
        underTheHood: [
          "Khi lọc 50,000 bản ghi bằng `row.name.toLowerCase().includes(q) || row.region.toLowerCase().includes(q)`, mỗi lần gõ 1 phím bạn tạo ra `100,000` chuỗi string mới trong Heap rồi vứt đi ngay lập tức (GC Churn).",
          "Nếu không tách biệt bước **Lọc (Filter)**, **Sắp xếp (Sort)**, **Tổng hợp (Aggregate)** và **Chọn dòng (Row Selection)** thành các nhánh `useMemo` độc lập, một thao tác click chọn dòng sẽ kích hoạt lại cả `Array.sort` (`O(N log N)` trên 50,000 phần tử).",
        ],
        solution: [
          "**Pre-computed Search Token (`_searchIndex`)**: Chuẩn hóa sẵn một chuỗi chữ thường gộp các trường cần tìm ngay khi nạp dữ liệu 1 lần duy nhất (giúp tốc độ filter tăng gấp 4-5 lần và 0 cấp phát bộ nhớ rác).",
          "**Layered Memoization Pipeline**: Tách `filteredRows = useMemo(..., [rows, query, status])` riêng khỏi `sortedRows = useMemo(..., [filteredRows, sortKey, sortDir])`, và tách hoàn toàn khỏi `selectedId`.",
          "Kết hợp `@tanstack/react-virtual` để dù `sortedRows` có 50,000 bản ghi thì phần DOM vẫn chỉ render đúng 12 dòng nhìn thấy.",
        ],
        tradeoffs: [
          "Việc tạo sẵn trường `_searchIndex` lúc nạp dữ liệu làm tăng khoảng 8-10% dung lượng RAM của mảng dữ liệu gốc, nhưng đổi lại tốc độ tìm kiếm giảm từ ~90ms xuống còn < 4ms.",
        ],
        devtoolsSteps: [
          "Ở chế độ `Baseline`, thử bấm chọn các dòng trên bảng hoặc bấm 'Run Stress Test': mỗi lần click chọn dòng cũng chạy lại toàn bộ Filter + Sort + Aggregation trên 25,000 dòng và render hàng trăm DOM rows gây INP > 220ms.",
          "Chuyển sang chế độ `Optimized` (Pre-indexed Lookup + Layered `useMemo` + `@tanstack/react-virtual` trên 50,000 dòng): click chọn dòng tốn **< 2ms**, và lọc/sắp xếp 50,000 bản ghi hoàn tất trong chớp mắt.",
        ],
        takeaway:
          "Với Data Grid quy mô lớn (10k–100k dòng): Chuẩn hóa chỉ mục tìm kiếm 1 lần khi nạp (`Pre-indexing`), tách tầng `useMemo` để thao tác UI không làm chạy lại `sort/filter`, và bắt buộc ảo hóa DOM (`@tanstack/react-virtual`).",
      },
      en: {
        title:
          "Heavy Client-Side Data Grid (50,000 Rows Sort, Filter & Aggregation)",
        subtitle:
          "Architecting sub-10ms filtering, sorting, aggregation, and row selection across 50,000 records using pre-indexed tokens, layered memoization, and @tanstack/react-virtual",
        symptomSummary:
          "Sorting a column, filtering by status, or simply clicking to highlight a row in a large data grid stalls the UI for 200–400ms.",
        rootCauseSummary:
          "Re-running `.filter().sort().reduce()` across 50,000 objects on every component render (even when only `selectedRowId` changes) and allocating hundreds of thousands of temporary `.toLowerCase()` strings.",
        symptoms: [
          "Clicking a single row to select it freezes the UI for 200ms because the entire sort and aggregation pipeline re-executes.",
          "Filtering triggers heavy V8 Garbage Collection pauses due to millions of ephemeral string allocations.",
        ],
        underTheHood: [
          "Calling `row.client.toLowerCase().includes(q)` across 50,000 rows on every keystroke allocates 50,000+ short-lived strings per keystroke.",
          "Coupling row selection state with un-memoized `filter -> sort -> aggregate` forces an `O(N log N)` sort on every click.",
        ],
        solution: [
          "**Pre-computed Search Index**: Build a single normalized lowercase search string (`_searchKey`) once when ingesting data so filtering performs a single fast substring scan with zero string allocations.",
          "**Layered Memoization Pipeline**: Isolate `filteredRows`, `sortedRows`, and `aggregations` in granular `useMemo` hooks so changing `selectedRowId` bypasses data processing completely (`O(1)`).",
          "Render the grid viewport with `@tanstack/react-virtual` so only ~12 rows exist in the DOM.",
        ],
        tradeoffs: [
          "Pre-computing a `_searchKey` string adds ~8% memory overhead to the raw dataset in exchange for 5x faster filter scans and zero GC churn.",
        ],
        devtoolsSteps: [
          "In `Baseline` mode, click rows or run the Stress Test: every interaction re-runs the full filter + sort + aggregation pipeline, spiking INP past 220ms.",
          "Switch to `Optimized` mode (50,000 rows with Pre-indexed Search + Layered `useMemo` + Virtualizer): row selection takes <2ms and filtering 50,000 rows completes in <8ms.",
        ],
        takeaway:
          "Large client data grids require three pillars: Pre-computed search indexes on ingestion, decoupled memoization stages (`filter` -> `sort` -> `UI selection`), and viewport virtualization.",
      },
    },
    badCode: `// [Baseline] Unoptimized: Re-runs filter + sort + lowercase allocations on EVERY render (even row click!)
export function FinancialGridBad({ rows }) {
  const [query, setQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Runs O(N log N) sort on 25,000 rows even when user just clicks 'selectedId'.
  const visible = rows
    .filter((r) => r.customer.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (sortAsc ? a.amount - b.amount : b.amount - a.amount));

  return <Table rows={visible.slice(0, 400)} onSelect={setSelectedId} />;
}`,
    goodCode: `// [Optimized]: Pre-indexed search + decoupled useMemo stages + @tanstack/react-virtual
export function FinancialGridGood({ indexedRows }) {
  const [query, setQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Stage 1: Only recomputes when 'query' changes (uses pre-computed _searchKey)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return indexedRows;
    return indexedRows.filter((r) => r._searchKey.includes(q));
  }, [indexedRows, query]);

  // Stage 2: Only recomputes when 'filtered' or 'sortAsc' changes — NOT on row click.
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => (sortAsc ? a.amount - b.amount : b.amount - a.amount)),
    [filtered, sortAsc]
  );

  // Stage 3: Virtualized viewport renders only 12 rows (~0.5ms commit on row click)
  return <VirtualizedGrid rows={sorted} selectedId={selectedId} onSelect={setSelectedId} />;
}`,
  },

  {
    slug: "input-responsiveness",
    code: "5.3",
    pillarId: 5,
    primaryMetric: "Network",
    severity: "high",
    libraries: ["Debounce", "AbortController", "Race Condition Guard"],
    content: {
      vi: {
        title:
          "Input Responsiveness: Debounce, rAF Throttle & Abortable Search",
        subtitle:
          "Xử lý triệt để lỗi Race Condition (kết quả cũ đè lên kết quả mới) và bão Request khi gõ tìm kiếm nhanh",
        symptomSummary:
          "Người dùng gõ từ khóa 'react', màn hình nhấp nháy hiện kết quả của chữ 're' đè lên kết quả của chữ 'react' do gói tin cũ trả về muộn hơn gói tin mới.",
        rootCauseSummary:
          "Gửi request API ngay trên mỗi phím bấm mà không có Debounce và không dùng `AbortController` để hủy bỏ các request cũ đang bay trên mạng.",
        symptoms: [
          "Gõ 6 ký tự bắn ra 6 API requests liên tiếp.",
          "Request cho ký tự đầu tiên (`'r'` - tập dữ liệu lớn, server xử lý mất 600ms) về đích SAU request của cụm từ đầy đủ (`'react'` - tập dữ liệu nhỏ, mất 150ms), làm kết quả sai hiển thị cuối cùng trên UI (Stale Response Race Condition).",
        ],
        underTheHood: [
          "Mạng HTTP không bao giờ đảm bảo thứ tự trả về giống thứ tự gửi đi (Out-of-order resolution): truy vấn ngắn thường quét nhiều bản ghi hơn nên phản hồi chậm hơn truy vấn dài chi tiết.",
          "Khi chỉ dùng `debounce(250ms)` mà không có `AbortController`, nếu người dùng gõ thêm sau 250ms trong khi request trước đang mất 500ms trên mạng, lỗi Race Condition vẫn xảy ra.",
        ],
        solution: [
          "Kết hợp **Debounce (200-250ms)** để giảm 80% số lượng request thừa khi người dùng đang gõ liên tục.",
          "Bắt buộc gắn **`AbortController` (`fetch(url, { signal })`)** hoặc dùng tham số `({ signal })` có sẵn trong `queryFn` của `@tanstack/react-query`: mỗi khi query mới bắt đầu, request cũ đang bay trên mạng sẽ bị hủy (`aborted`) ngay ở tầng trình duyệt và bỏ qua hoàn toàn kết quả cũ.",
        ],
        tradeoffs: [
          "Không nên đặt thời gian Debounce quá dài (> 400ms) vì sẽ làm người dùng cảm thấy ứng dụng phản hồi chậm sau khi họ đã ngừng gõ.",
        ],
        devtoolsSteps: [
          "Ở chế độ `Baseline` (No Debounce, No AbortController), bấm 'Run Stress Test' (Giả lập gõ `'r' -> 're' -> 'rea' -> 'reac' -> 'react'` trong đó request `'r'` có độ trễ cao hơn): bạn sẽ thấy kết quả cuối cùng trên màn hình bị **sai lệch** (hiển thị kết quả của `'r'` thay vì `'react'`) kèm 5 requests tốn kém.",
          "Chuyển sang chế độ `Optimized` (Debounced + `AbortController` Cancellation): các request trung gian bị hủy sạch sẽ, chỉ tốn 1 request cuối cùng và kết quả khớp 100% với từ khóa hiện tại.",
        ],
        takeaway:
          "Debounce chỉ giúp giảm số lượng request, còn **`AbortController` (Cancellation)** mới là thứ đảm bảo tính đúng đắn của dữ liệu (Data Correctness) trước lỗi Network Race Condition.",
      },
      en: {
        title:
          "Input Responsiveness: Debounce, rAF Throttle & Abortable Search",
        subtitle:
          "Eliminating network floods and out-of-order response race conditions using Debounce + AbortController cancellation",
        symptomSummary:
          "Typing 'react' flashes stale search results for 're' *after* the results for 'react' had already appeared, leaving the UI in a corrupted state.",
        rootCauseSummary:
          "Firing network requests on every keystroke without debouncing and without cancelling in-flight requests via `AbortController` when a newer query supersedes them.",
        symptoms: [
          "Typing a 6-letter word fires 6 separate API calls.",
          "An early broad query (`?q=r`, slow 600ms response) resolves *after* a later specific query (`?q=react`, fast 150ms response), overwriting the correct UI state with stale data.",
        ],
        underTheHood: [
          "Network responses are not guaranteed to arrive in FIFO order: broad prefix queries often take longer on the backend than narrow specific queries.",
          "Even with `debounce`, if a user pauses for 250ms and then types again while the first request is still in flight, an uncancelled request can still resolve out-of-order.",
        ],
        solution: [
          "Combine a **180–250ms Debounce** to suppress keystroke floods with **`AbortController` (`fetch(url, { signal })`)** (or TanStack Query's built-in `queryFn: ({ signal }) => ...`).",
          "When a new keystroke arrives, immediately call `controller.abort()` on any in-flight request so stale responses can never overwrite newer state.",
        ],
        tradeoffs: [
          "Keep debounce intervals modest (150–250ms); overly aggressive 500ms+ debounce makes search feel unresponsive.",
        ],
        devtoolsSteps: [
          "In `Baseline` mode, click 'Run Stress Test' (simulates typing `'r' -> 're' -> 'rea' -> 'reac' -> 'react'` where earlier broad queries take longer): watch the slow `'r'` response arrive last and overwrite the `'react'` results.",
          "Switch to `Optimized` mode (Debounce + `AbortController`): intermediate requests are aborted cleanly and the final UI is 100% consistent.",
        ],
        takeaway:
          "Debounce reduces network volume; `AbortController` guarantees data correctness against out-of-order network race conditions.",
      },
    },
    badCode: `// [Baseline] Unoptimized: Fires on every keystroke + suffers from out-of-order Race Condition.
useEffect(() => {
  // If '?q=r' takes 600ms and '?q=react' takes 150ms, '?q=r' overwrites the UI last.
  fetch(\`/api/perf?step=search&q=\${query}\`)
    .then((r) => r.json())
    .then((data) => setResults(data.results));
}, [query]);`,
    goodCode: `// [Optimized]: Debounced + AbortController cancels in-flight requests on new input
useEffect(() => {
  const controller = new AbortController();

  const timer = window.setTimeout(async () => {
    try {
      const res = await fetch(\`/api/perf?step=search&q=\${query}\`, {
        signal: controller.signal,
      });
      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      if ((err as Error).name !== "AbortError") console.error(err);
    }
  }, 180);

  return () => {
    window.clearTimeout(timer);
    controller.abort(); // Immediately cancels stale in-flight request.
  };
}, [query]);`,
  },

  // ============================================================================
  // PILLAR 6: BUNDLE, ASSETS & EXECUTION ARCHITECTURE
  // ============================================================================
  {
    slug: "code-splitting-prefetch",
    code: "6.1",
    pillarId: 6,
    primaryMetric: "Bundle",
    severity: "high",
    libraries: ["next/dynamic", "React.lazy", "Prefetch on Intent"],
    content: {
      vi: {
        title: "Code Splitting, Dynamic Imports & Prefetch on Intent",
        subtitle:
          "Giảm 70% dung lượng Initial JS Bundle bằng Lazy Loading kết hợp kỹ thuật Prefetch-on-Hover/Focus để mở module nặng trong 0ms",
        symptomSummary:
          "Trang chủ tải rất nặng (Initial JS > 800KB) vì phải tải kèm cả thư viện Chart 3D, Rich Text Editor và PDF Exporter dù 90% người dùng không bấm mở các modal đó.",
        rootCauseSummary:
          "Import tĩnh (`import HeavyChartModal from './HeavyChartModal'`) tất cả các tính năng phụ/modal ở đầu file làm Bundler gom hết vào Main Entry Chunk.",
        symptoms: [
          "Thời gian tải trang lần đầu (LCP & TTI) chậm trên mạng di động do trình duyệt phải tải, giải nén, parse và compile hàng trăm KB JS chưa dùng tới.",
          "Nếu chỉ dùng `React.lazy` / `next/dynamic` đơn thuần, khi người dùng bấm nút 'Mở Analytics Modal' lại phải chờ 300-500ms tải chunk mới hiện ra.",
        ],
        underTheHood: [
          "Mỗi KB JavaScript đắt đỏ hơn rất nhiều so với 1 KB ảnh: sau khi tải qua mạng, V8 Engine phải **Parse -> Compile -> Execute** trên Main Thread.",
          "Khi dùng `import('./HeavyModule')`, Webpack/Turbopack tách module đó thành một async chunk riêng biệt. Đặc biệt, hàm `import()` có tính chất idempotent (gọi lần 2 trả về module đã cache trong bộ nhớ). Do đó, khi người dùng vừa **di chuột vào nút (`onMouseEnter`) hoặc chạm nhẹ (`onFocus`)**, ta gọi trước `import('./HeavyModule')` ngầm trong ~150-200ms trước khi tay họ kịp click — lúc click vào thì module đã nằm sẵn trong RAM và mở ra trong **0ms**.",
        ],
        solution: [
          "Tách toàn bộ các Modal phức tạp, Chart, Code Editor, PDF Viewer ra khỏi Initial Bundle bằng `next/dynamic` hoặc `React.lazy`.",
          "Áp dụng mẫu **Prefetch on Intent**: Gắn `onMouseEnter={preloadModule}` và `onFocus={preloadModule}` lên nút kích hoạt để đạt cả 2 mục tiêu: **0KB Initial Bundle** VÀ **0ms Click Latency**.",
        ],
        tradeoffs: [
          "Không nên tách nhỏ (over-split) các component quá bé (< 5KB) hiển thị ngay trên màn hình chính vì sẽ tạo thêm HTTP round-trip không cần thiết.",
        ],
        devtoolsSteps: [
          "Ở chế độ `Baseline` (Static Eager Import), bấm 'Simulate Route Load / Stress Test': ngay khi vào trang, trình duyệt phải tải và parse thêm 380KB của 3 module nặng làm chậm TTI.",
          "Chuyển sang chế độ `Optimized` (Dynamic Split + Prefetch on Hover): Initial Bundle giảm xuống chỉ còn 42KB! Hãy thử di chuột (hover) qua nút 'Open Telemetry Studio' rồi bấm click: chunk được nạp sẵn ngay khi hover nên cửa sổ mở ra tức thì trong **0ms**.",
        ],
        takeaway:
          "Lazy Loading đơn thuần giải quyết được Initial Load nhưng làm chậm lúc Click. **Dynamic Import + Prefetch on Hover/Focus** là kỹ thuật giúp bạn có cả hai: Initial Bundle siêu nhẹ và phản hồi Click 0ms.",
      },
      en: {
        title: "Code Splitting, Dynamic Imports & Prefetch on Intent",
        subtitle:
          "Slashing initial JS bundle size by 75% while maintaining 0ms click-to-open latency using Dynamic Imports + Hover/Focus Intent Preloading",
        symptomSummary:
          "Initial page load downloads and parses 800KB+ of JavaScript because heavy modals (Chart Studio, Rich Editor, PDF Exporter) are statically imported at the top of the file.",
        rootCauseSummary:
          "Using static top-level `import` statements for conditional/secondary UI surfaces forces the bundler to pack them into the critical entry chunk.",
        symptoms: [
          "Slow Time to Interactive (TTI) and high initial Script Evaluation time on mobile CPUs.",
          "Conversely, naive lazy loading causes a noticeable spinner delay the first time the user clicks 'Open Studio'.",
        ],
        underTheHood: [
          "Byte-for-byte, JavaScript is the most expensive resource on the web because after network download, the main thread must parse, compile, and execute the AST.",
          "Dynamic `import()` splits secondary features into separate on-demand chunks. Because human pointer movement takes ~150–250ms between `mouseenter`/`focus` and `click`, calling the chunk importer on hover preloads the module into memory before the click even fires.",
        ],
        solution: [
          "Split heavy conditional widgets, charts, and editors out of the initial bundle using `next/dynamic` or `React.lazy`.",
          "Attach an **Intent Preloader** (`onMouseEnter={preload}` / `onFocus={preload}`) to the trigger button so the chunk is already warmed when clicked.",
        ],
        tradeoffs: [
          "Do not lazy-load above-the-fold LCP components, as doing so introduces a client-side render waterfall.",
        ],
        devtoolsSteps: [
          "In `Baseline` mode (Eager Static Bundle), click 'Run Stress Test': initial route load parses 420KB of unused studio modules upfront.",
          "Switch to `Optimized` mode (Dynamic Split + Hover Intent Preload): initial bundle drops to 42KB (-90%), and hovering the trigger button warms the chunk so clicking opens it in 0ms.",
        ],
        takeaway:
          "Pair `next/dynamic` code-splitting with `onMouseEnter` / `onFocus` intent preloading to achieve both a tiny initial bundle and instant 0ms interaction.",
      },
    },
    badCode: `// [Baseline] Unoptimized: Statically imports 380KB Chart & Editor into the critical initial bundle.
import { HeavyChartStudio } from "./HeavyChartStudio";
import { RichMarkdownEditor } from "./RichMarkdownEditor";

export function WorkspaceHeaderBad() {
  const [open, setOpen] = useState(false);
  // Even if 95% of users never click this button, everyone pays the 380KB JS cost.
  return (
    <>
      <button onClick={() => setOpen(true)}>Open Studio</button>
      {open && <HeavyChartStudio />}
    </>
  );
}`,
    goodCode: `// [Optimized]: 0KB initial cost + Prefetch on Hover/Focus for 0ms open latency.
import dynamic from "next/dynamic";

const loadStudioChunk = () => import("./HeavyChartStudio");
const HeavyChartStudio = dynamic(loadStudioChunk, { ssr: false });

export function WorkspaceHeaderGood() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onMouseEnter={loadStudioChunk} // Warms chunk ~200ms before click.
        onFocus={loadStudioChunk}
        onClick={() => setOpen(true)}
      >
        Open Studio
      </button>
      {open && <HeavyChartStudio />}
    </>
  );
}`,
  },

  {
    slug: "barrel-files-treeshaking",
    code: "6.2",
    pillarId: 6,
    primaryMetric: "Bundle",
    severity: "high",
    libraries: ["Tree-Shaking", "optimizePackageImports", "Direct Imports"],
    content: {
      vi: {
        title: "Barrel Files (index.ts) & Tree-Shaking Traps",
        subtitle:
          "Tại sao chỉ import 1 hàm nhỏ từ file index.ts lại kéo theo 300 modules vào Bundle và làm chậm tốc độ Build/Dev Server gấp 5 lần",
        symptomSummary:
          "Trang chỉ dùng đúng 1 hàm format ngày tháng và 2 icon nhưng Bundle Analyzer báo chunk chứa cả thư viện Chart, Crypto và hàng trăm component không dùng tới.",
        rootCauseSummary:
          "Sử dụng các file Barrel (`components/index.ts`, `utils/index.ts`) gom tất cả `export * from ...` trong đó có các module chứa top-level side effects khiến Bundler không dám Tree-shake.",
        symptoms: [
          "Thời gian khởi động `next dev` / HMR hoặc chạy test (`Vitest`/`Jest`) chậm bất thường vì mỗi test file import `from '@/components'` phải nạp toàn bộ đồ thị hàng trăm file.",
          "Chỉ số JS Parse & Compile Time tăng vọt do các hàm khởi tạo ở cấp module (top-level side effects) chạy ngầm khi nạp file.",
        ],
        underTheHood: [
          "Khi bạn viết `import { formatVND } from '@/lib'`, nếu `@/lib/index.ts` re-export 200 file khác, trình biên dịch phải đọc và phân tích cú pháp (parse) toàn bộ 200 file đó để xây dựng Module Graph.",
          'Nguy hiểm hơn: nếu bất kỳ file nào trong số 200 file đó có **Top-level Side Effect** (ví dụ `const registry = initGlobalPlugin()`, `window.x = ...`, hoặc class static property phức tạp) và `package.json` không khai báo `"sideEffects": false`, Bundler buộc phải giữ lại module đó trong bundle cuối cùng để đảm bảo không làm thay đổi hành vi runtime.',
        ],
        solution: [
          "Import trực tiếp từ đường dẫn file cụ thể (**Direct Path Import**: `import { formatVND } from '@/lib/format-currency'`) thay vì đi qua Barrel `index.ts` khổng lồ.",
          "Với các thư viện UI/Icon bên thứ 3, cấu hình `experimental.optimizePackageImports` trong `next.config.ts` (Next.js tự động biến đổi barrel import của `lucide-react`, `@radix-ui` thành direct import ở lúc compile).",
          'Đảm bảo các module tiện ích là **Pure (Không có Top-Level Side Effects)** và khai báo `"sideEffects": false`.',
        ],
        tradeoffs: [
          "Import trực tiếp làm xuất hiện nhiều dòng `import` hơn ở đầu file thay vì gộp chung 1 dòng `from '@/components'`, nhưng IDE auto-import đã tự động hóa hoàn toàn việc này.",
        ],
        devtoolsSteps: [
          "Ở chế độ `Baseline` (Barrel Import `from '@/design-system/index'`), bấm 'Analyze & Execute Module Graph': quan sát trình mô phỏng nạp toàn bộ 180 modules và chạy 14 side-effect initializers dù trang chỉ cần 2 components.",
          "Chuyển sang chế độ `Optimized` (Direct Subpath Imports + `sideEffects: false`): chỉ đúng 2 modules cần thiết được nạp và thực thi, giảm 94% kích thước bundle và thời gian khởi tạo.",
        ],
        takeaway:
          "Tránh tạo các file `index.ts` gom tất cả mọi thứ trong dự án nội bộ (monorepo/app). Hãy luôn ưu tiên Direct Imports và cấu hình `optimizePackageImports`.",
      },
      en: {
        title: "Barrel Files (index.ts) & Tree-Shaking Traps",
        subtitle:
          "How mega-barrel files defeat bundler tree-shaking through transitive side effects and bloat module graphs by 10x",
        symptomSummary:
          "Importing a single helper or button from `@/common` pulls 250+ unrelated modules into the client bundle and slows down HMR/test boot times.",
        rootCauseSummary:
          "Routing imports through barrel files (`index.ts` with dozens of `export * from ...`) where sibling modules contain top-level side effects that prevent dead-code elimination.",
        symptoms: [
          "Bundle Analyzer reveals heavy chart, editor, or polyfill modules inside lightweight pages that never render them.",
          "Dev server cold starts and unit test runs spend seconds parsing hundreds of transitive files per entry point.",
        ],
        underTheHood: [
          "When resolving `import { Button } from '@/ui'`, the compiler must traverse every re-exported file in `@/ui/index.ts` to construct the module graph.",
          'If any sibling module executes code at module evaluation time (e.g., `const instance = createSingleton()`, mutating globals, or IIFEs) without `/*#__PURE__*/` or `"sideEffects": false`, the bundler must retain that module in the production bundle to preserve execution semantics.',
        ],
        solution: [
          "Use **Direct File Imports** (`import { Button } from '@/components/ui/button'`) instead of internal mega-barrel `index.ts` files.",
          "Leverage Next.js `optimizePackageImports` in `next.config.ts` for third-party icon/component libraries.",
          'Keep modules pure at the top level and mark pure packages with `"sideEffects": false`.',
        ],
        tradeoffs: [
          "Direct imports result in a few more `import` lines at the top of a file, which modern IDE auto-imports manage effortlessly.",
        ],
        devtoolsSteps: [
          "In `Baseline` mode (Mega-Barrel Import), click 'Run Stress Test': watch 180 transitive modules and 14 top-level side effects execute just to render 2 components.",
          "Switch to `Optimized` mode (Direct Path Imports): only the 2 requested modules are parsed and evaluated, cutting bundle weight and parse time by >90%.",
        ],
        takeaway:
          "Delete internal mega-barrel `index.ts` files in application code. Import directly from source module paths.",
      },
    },
    badCode: `// [Baseline] Unoptimized: Barrel file re-exports 180 modules (including stateful side-effects)
// src/components/index.ts
export * from "./Button";
export * from "./Badge";
export * from "./Heavy3DGlobe"; // Runs WebGL detector at top-level module scope.
export * from "./LegacyPdfEngine"; // Registers global font map on import.

// app/login/page.tsx
import { Button } from "@/components"; // Pulls in side-effectful siblings.`,
    goodCode: `// [Optimized]: Direct path imports load ONLY the exact module graph required
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// And in next.config.ts for 3rd-party libraries:
const nextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
};`,
  },

  {
    slug: "third-party-isolation",
    code: "6.3",
    pillarId: 6,
    primaryMetric: "TBT",
    severity: "high",
    libraries: [
      "Facade Pattern",
      "IntersectionObserver",
      "requestIdleCallback",
    ],
    content: {
      vi: {
        title: "Third-Party Scripts & Heavy Widget Isolation (Facade Pattern)",
        subtitle:
          "Cô lập các Widget bên thứ 3 (Live Chat, Bản đồ, Video Embed, Analytics) bằng Lightweight Facade để bảo vệ 100 điểm Lighthouse & Hydration",
        symptomSummary:
          "Code ứng dụng đã tối ưu rất kỹ nhưng khi gắn thêm Live Chat, Google Maps hoặc YouTube Embed vào trang thì điểm Lighthouse tụt từ 98 xuống 55 và TBT tăng thêm 600ms.",
        rootCauseSummary:
          "Khởi tạo ngay lập tức các iframe/script nặng của bên thứ 3 cùng lúc với quá trình React Hydration ngay khi mở trang.",
        symptoms: [
          "Trong quá trình tải trang, Main Thread bị nghẽn bởi các script bên thứ 3 tranh giành CPU với React Hydration, làm người dùng bấm vào menu không mở được.",
          "Dù chỉ có 2% người dùng thực sự bấm mở hộp thoại Chat hỗ trợ hoặc tương tác với bản đồ ở cuối trang, 100% người dùng đều phải gánh chi phí tải 500KB+ JS và khởi tạo iframe.",
        ],
        underTheHood: [
          "Một `<iframe>` hoặc Widget bên thứ 3 (Intercom, Zendesk, YouTube, Maps) khởi tạo một môi trường trình duyệt thu nhỏ hoàn chỉnh (tải HTML, CSS, ফন্ট, parse hàng trăm KB JS và chạy hàng loạt Long Tasks).",
          "**Facade Pattern (Mẫu Mặt Dựng Tĩnh)**: Ở lần tải đầu tiên, ta chỉ hiển thị một bản xem trước nhẹ bằng HTML/CSS thuần (~2KB, 0ms JS blocking) trông giống hệt widget thật. Chỉ khi người dùng **di chuột/bấm vào (Interaction Trigger)** hoặc **cuộn tới vùng đó (`IntersectionObserver`)** hay khi trình duyệt đã rảnh (`requestIdleCallback`), ta mới hoán đổi (hydrate) Widget thật vào.",
        ],
        solution: [
          "Áp dụng **Interactive Facade Pattern** cho Chat Widget, Video Player và Interactive Map: render nút bấm/hình đại diện tĩnh siêu nhẹ trước, chỉ nạp SDK thật khi có tương tác (`onPointerEnter` / `onClick`).",
          "Sử dụng `IntersectionObserver` (`rootMargin: '200px'`) cho các widget nằm ở cuối trang (Below the Fold).",
          'Sử dụng `next/script` với `strategy="lazyOnload"` cho các script không khẩn cấp.',
        ],
        tradeoffs: [
          "Khi dùng Facade chỉ nạp lúc click, lần click đầu tiên vào nút Chat có thể mất ~150-200ms để khởi tạo SDK — có thể triệt tiêu hoàn toàn độ trễ này bằng cách bắt đầu nạp SDK ngay khi `onPointerEnter` (di chuột tới gần nút Chat).",
        ],
        devtoolsSteps: [
          "Ở chế độ `Baseline` (Eager 3rd-Party Boot), bấm 'Simulate Page Hydration / Stress Test': 3 widget bên thứ 3 (Support Chat SDK, Interactive Vector Map, Video Player) cùng khởi tạo ngay lúc tải trang, gây ra ~420ms TBT và ngốn thêm 950KB tài nguyên.",
          "Chuyển sang chế độ `Optimized` (Zero-Cost Facade + On-Intent Hydration): quá trình tải trang hoàn tất với **0ms TBT** từ bên thứ 3! Khi bạn di chuột hoặc bấm vào Widget nào thì chỉ riêng Widget đó mới được nâng cấp lên bản tương tác thật.",
        ],
        takeaway:
          "Đừng để 1 dòng script bên thứ 3 phá hỏng công sức tối ưu cả tháng của đội ngũ Frontend. Hãy luôn bọc các Embed/Widget nặng đằng sau lớp **Lightweight Facade + Lazy/Intent Trigger**.",
      },
      en: {
        title: "Third-Party Scripts & Heavy Widget Isolation (Facade Pattern)",
        subtitle:
          "Protecting React Hydration and TBT from heavy third-party embeds (Live Chat, Maps, Video Players) using Lightweight Facades & Intent Triggers",
        symptomSummary:
          "Your core app is fast, yet adding a Customer Support Chat widget, embedded Map, and Video Player drops Lighthouse Performance from 98 to 55 and adds 600ms of TBT.",
        rootCauseSummary:
          "Eagerly booting heavy third-party SDKs and iframes during initial page load, competing directly with React hydration on the Main Thread.",
        symptoms: [
          "Initial page load suffers from massive Long Tasks caused by third-party script evaluation during hydration.",
          "100% of visitors pay the 900KB+ network and CPU tax for a chat box or map that only 3% of visitors ever interact with.",
        ],
        underTheHood: [
          "Third-party embeds (`<iframe>`, chat SDKs, interactive maps) bootstrap their own document environment, style sheets, and heavy JS bundles on the main thread.",
          "The **Facade Pattern** renders a lightweight, static HTML/CSS lookalike (~2KB, 0ms TBT) during initial load, and only swaps in the real third-party SDK when the user shows intent (`pointerenter` / `click`), scrolls near it (`IntersectionObserver`), or during browser idle time (`requestIdleCallback`).",
        ],
        solution: [
          "Replace eager third-party embeds with **Lightweight Interactive Facades** that upgrade to the live SDK on hover/click intent.",
          "Gate below-the-fold embeds behind `IntersectionObserver({ rootMargin: '200px' })`.",
          'Load non-critical analytics/support scripts via `next/script` with `strategy="lazyOnload"`.',
        ],
        tradeoffs: [
          "Loading an SDK only on click can add a brief initialization delay; triggering preload on `onPointerEnter` / `onFocus` hides that latency completely.",
        ],
        devtoolsSteps: [
          "In `Baseline` mode (Eager 3rd-Party Boot), click 'Run Stress Test': booting Chat SDK + Vector Map + Video Embed during hydration blocks the main thread for ~420ms.",
          "Switch to `Optimized` mode (Lightweight Facade + Intent Activation): initial page hydration finishes with **0ms third-party TBT**, and widgets seamlessly upgrade when hovered or clicked.",
        ],
        takeaway:
          "Never allow third-party widgets to compete with initial page hydration. Isolate every heavy embed behind a static Facade with intent-based or viewport-based activation.",
      },
    },
    badCode: `// [Baseline] Unoptimized: Boots heavy Chat SDK, Map & Video iframe immediately during page hydration.
export function SupportAndMapSectionBad() {
  useEffect(() => {
    // Blocks Main Thread for 400ms+ right as the user tries to interact with the page.
    bootHeavyIntercomChatSDK();
    bootInteractiveMapboxEngine();
    bootEmbeddedVideoPlayer();
  }, []);

  return <div id="heavy-third-party-containers" />;
}`,
    goodCode: `// [Optimized]: Zero-cost HTML/CSS Facade upgrades to real SDK only on user intent.
export function SupportChatFacadeGood() {
  const [activated, setActivated] = useState(false);

  if (activated) {
    return <LiveCustomerChatWidget />;
  }

  return (
    <button
      onPointerEnter={() => prefetchChatSdk()} // Warm cache on hover
      onClick={() => setActivated(true)} // Boot real SDK only when clicked
      className="fixed bottom-4 right-4 rounded-full bg-primary px-4 py-3 text-white shadow-lg"
    >
      Need Help? Chat with Engineering
    </button>
  );
}`,
  },
]
