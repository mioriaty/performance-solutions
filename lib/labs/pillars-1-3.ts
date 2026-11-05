import type { LabDefinition } from "./types"

export const LABS_PILLARS_1_TO_3: LabDefinition[] = [
  // ============================================================================
  // PILLAR 1: RENDERING & REACT INTERNALS
  // ============================================================================
  {
    slug: "rerender-storms",
    code: "1.1",
    pillarId: 1,
    primaryMetric: "Re-renders",
    severity: "critical",
    libraries: ["Zustand", "React 19", "useShallow"],
    content: {
      vi: {
        title: "Re-render Storms & Context Bloat",
        subtitle:
          "Tại sao một thay đổi state nhỏ trong React Context làm re-render toàn bộ cây UI và cách triệt tiêu bằng Zustand Atomic Selectors + State Colocation",
        symptomSummary:
          "Gõ phím vào ô input hoặc di chuột trên màn hình làm giật lag, hàng chục component không liên quan vẫn bị re-render liên tục.",
        rootCauseSummary:
          "Nhồi nhét state biến thiên tần suất cao (input, cursor, filter) vào chung một React Context Provider hoặc đặt state ở Component cha quá cao.",
        symptoms: [
          "Gõ chữ vào ô Search hoặc kéo thanh trượt cảm giác trễ (input lag), ký tự hiện lên chậm hơn tay gõ.",
          "Khi bật React DevTools Highlight Updates hoặc Render Flash trên HUD, cả trang sáng rực lên mỗi khi gõ 1 ký tự.",
          "Flamegraph trong React Profiler xuất hiện các thanh ngang rất rộng do hàng trăm component con phải chạy lại hàm render dù props của chúng không đổi.",
        ],
        underTheHood: [
          "Trong React, `Context.Provider` so sánh `value` bằng `Object.is`. Khi một thuộc tính bất kỳ trong `value={{ user, theme, searchQuery, mousePos }}` thay đổi, object mới được tạo ra.",
          "React Context chuẩn KHÔNG có cơ chế fine-grained selector ở tầng consumer: mọi component gọi `useContext(AppContext)` đều bị đánh dấu cần re-render và bỏ qua cả `React.memo` ở các tầng giữa.",
          "Việc đặt state ở Root/Page component thay vì cô lập (colocate) xuống đúng nhánh con sử dụng làm toàn bộ Subtree bị đưa vào pha Reconciliation.",
        ],
        solution: [
          "Sử dụng Zustand với Atomic Selectors (`useStore(s => s.searchQuery)`): Zustand quản lý subscription bên ngoài cây React qua `useSyncExternalStore`, chỉ kích hoạt re-render cho đúng component nào lấy mảnh dữ liệu có giá trị thay đổi.",
          "Khi cần lấy nhiều thuộc tính từ store dưới dạng object/array, kết hợp `useShallow` để so sánh nông (shallow equality), tránh tạo reference mới vô ích.",
          "Áp dụng State Colocation & Component Composition (`children` prop pattern): Đẩy state tần suất cao xuống component lá nhỏ nhất cần nó.",
        ],
        tradeoffs: [
          "Không nên đưa mọi local form state vào Zustand global store: nếu state chỉ dùng ở 1 ô input, `useState` tại component con đã đủ tốt.",
          "Zustand selector trả về object/array mới (`useStore(s => ({ a: s.a, b: s.b }))`) mà quên `useShallow` sẽ gây lỗi infinite loop hoặc re-render mỗi lần store update.",
        ],
        devtoolsSteps: [
          "Bật công tắc 'Viền sáng Re-render (Flash Re-renders)' trên thanh HUD phía trên.",
          "Ở chế độ `Baseline`, thử gõ liên tục vào ô tìm kiếm hoặc bấm 'Run Stress Test': quan sát bộ đếm Render Count nhảy vọt lên hàng trăm lần karena toàn bộ 36 thẻ Metric Card bị re-render theo.",
          "Chuyển sang chế độ `Optimized` (Zustand Atomic Selector) và gõ lại: chỉ duy nhất Header/Filter Bar render lại, 36 thẻ Metric Card giữ nguyên ở 1x render.",
          "Mở React DevTools -> Tab Profiler -> Bấm nút bánh răng -> Bật 'Record why each component rendered' để thấy dòng 'Context changed' ở bản Bad.",
        ],
        takeaway:
          "React Context được thiết kế cho Dependency Injection / dữ liệu ít thay đổi (Theme, Locale, Auth). Với state cập nhật tần suất cao hoặc phức tạp, hãy dùng State Colocation hoặc External Store có Atomic Selector như Zustand.",
      },
      en: {
        title: "Re-render Storms & Context Bloat",
        subtitle:
          "How monolithic React Contexts trigger cascading re-renders across the component tree, and how to eliminate them with Zustand Atomic Selectors & State Colocation",
        symptomSummary:
          "Typing in an input or moving a slider feels sluggish because dozens of unrelated components re-render on every keystroke.",
        rootCauseSummary:
          "Coupling high-frequency state (search query, cursor, filters) inside a single React Context Provider or lifting state too high up the tree.",
        symptoms: [
          "Noticeable keystroke lag when typing into search bars or interacting with header controls.",
          "React DevTools 'Highlight updates' lights up the entire viewport on every single keystroke.",
          "React Profiler Flamegraph shows wide commits where dozens of heavy child widgets re-execute despite unchanged data.",
        ],
        underTheHood: [
          "React's `Context.Provider` checks `value` reference identity via `Object.is`. Mutating one field creates a new context value object.",
          "Standard React `useContext` has no built-in selector bailout: every consumer subscribed to that Context unconditionally re-renders, bypassing intermediate `React.memo` boundaries.",
          "Lifting ephemeral UI state to the top of a dashboard causes the entire fiber subtree to enter the render phase on every update.",
        ],
        solution: [
          "Use Zustand with Atomic Selectors (`useStore(s => s.searchQuery)`): subscriptions run outside React via `useSyncExternalStore` and only notify components whose selected slice actually changed.",
          "When selecting multiple fields as an object/tuple, wrap the selector with `useShallow` to prevent false-positive reference changes.",
          "Practice State Colocation and Component Composition (`children` passthrough) so high-frequency state lives only in the leaf component that needs it.",
        ],
        tradeoffs: [
          "Do not over-centralize purely local UI state into global stores; simple state colocation (`<SearchInput />` holding its own `useState`) has zero library overhead.",
          "Returning a fresh object literal inside a Zustand selector without `useShallow` will cause re-renders on every store mutation.",
        ],
        devtoolsSteps: [
          "Enable 'Flash Re-renders' on the top Telemetry HUD.",
          "In `Baseline` mode, type into the search input or click 'Run Stress Test': watch Render Count explode as all 36 heavy metric cards re-render on every character.",
          "Switch to `Optimized` mode (Zustand Atomic Selector) and type again: all 36 metric cards stay locked at 1x render.",
          "Open React DevTools -> Profiler -> Settings -> Enable 'Record why each component rendered' to inspect the 'Context changed' trigger.",
        ],
        takeaway:
          "React Context is for low-frequency dependency injection (Theme, Locale, Session) — not high-frequency state management. Use State Colocation or atomic external stores like Zustand.",
      },
    },
    badCode: `// [Baseline] Unoptimized: Monolithic Context re-renders ALL consumers on every keystroke
const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [search, setSearch] = useState("");
  const [accent, setAccent] = useState("indigo");
  const [cards] = useState( INITIAL_CARDS );

  // New object reference created on every keystroke in 'search'.
  return (
    <DashboardContext.Provider value={{ search, setSearch, accent, setAccent, cards }}>
      {children}
    </DashboardContext.Provider>
  );
}

function HeavyMetricCard({ id }) {
  // Re-renders when 'search' changes even though it only reads 'accent'.
  const { accent, cards } = useContext(DashboardContext);
  return <Card accent={accent} data={cards[id]} />;
}`,
    goodCode: `// [Optimized]: Zustand Atomic Selectors — 0 wasted re-renders
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

const useDashboardStore = create((set) => ({
  search: "",
  accent: "indigo",
  cards: INITIAL_CARDS,
  setSearch: (search) => set({ search }),
  setAccent: (accent) => set({ accent }),
}));

function SearchBar() {
  // Subscribes ONLY to search & setSearch
  const { search, setSearch } = useDashboardStore(
    useShallow((s) => ({ search: s.search, setSearch: s.setSearch }))
  );
  return <input value={search} onChange={(e) => setSearch(e.target.value)} />;
}

function HeavyMetricCard({ id }) {
  // Never re-renders when 'search' changes.
  const accent = useDashboardStore((s) => s.accent);
  const card = useDashboardStore((s) => s.cards[id]);
  return <Card accent={accent} data={card} />;
}`,
  },

  {
    slug: "concurrent-react",
    code: "1.2",
    pillarId: 1,
    primaryMetric: "INP",
    severity: "critical",
    libraries: ["React 19", "useTransition", "useDeferredValue"],
    content: {
      vi: {
        title: "Concurrent React: useTransition & useDeferredValue",
        subtitle:
          "Tách biệt Urgent Updates (gõ phím, click) khỏi Non-Urgent Heavy Renders bằng cơ chế Interruptible Rendering của React 19",
        symptomSummary:
          "Khi lọc/tìm kiếm trên danh sách nặng, ô input bị đơ cứng không nhận phím tiếp theo cho tới khi danh sách render xong (INP > 300ms).",
        rootCauseSummary:
          "Mọi `setState` mặc định đều là Urgent (đồng bộ): React khóa Main Thread để render xong toàn bộ danh sách mới trả quyền vẽ ký tự cho trình duyệt.",
        symptoms: [
          "Gõ nhanh 5 ký tự 'react' vào ô lọc nhưng màn hình đứng im nửa giây rồi mới hiện cả cụm chữ cùng lúc.",
          "Chỉ số INP (Interaction to Next Paint) báo đỏ (> 200ms) trên mỗi sự kiện `keydown`.",
          "Dùng `debounce` làm giảm lag khi gõ nhưng lại tạo độ trễ nhân tạo (phải ngừng tay gõ 300ms thì danh sách mới bắt đầu cập nhật).",
        ],
        underTheHood: [
          "Trong chế độ render đồng bộ truyền thống, khi `setQuery(val)` kích hoạt render lại một danh sách lớn, React thực hiện toàn bộ pha Render trong một tác vụ không thể ngắt quãng (uninterruptible task).",
          "Nếu người dùng gõ phím tiếp theo trong lúc React đang render dở danh sách cho phím trước, sự kiện bàn phím đó phải xếp hàng chờ trong Event Queue.",
          "Với Concurrent Rendering (`startTransition` / `useDeferredValue`), React chia nhỏ công việc theo từng Fiber bằng time-slicing (~5ms yield). Khi có input mới từ người dùng, React hủy bỏ (abort) lượt render cũ đang dở và ưu tiên vẽ ngay ký tự mới lên ô input.",
        ],
        solution: [
          "Giữ state của ô input (`query`) là Urgent Update để con trỏ và chữ phản hồi tức thì dưới 16ms.",
          "Dùng `useDeferredValue(query)` hoặc bọc `setFilterState` trong `startTransition` cho phần danh sách nặng: React sẽ render danh sách ở chế độ nền có thể bị ngắt quãng (interruptible).",
          "Kết hợp `React.memo` trên component danh sách con truyền `deferredQuery` vào để React có thể bailout (bỏ qua) render danh sách trong lượt Urgent render của input.",
        ],
        tradeoffs: [
          "Concurrent React thực hiện 2 lượt render (1 lượt nhanh với giá trị cũ + 1 lượt nền với giá trị mới), nên tổng CPU time tăng nhẹ để đổi lấy độ mượt tương tác (INP).",
          "Nếu không bọc `React.memo` cho component con nhận `deferredValue`, nó vẫn sẽ re-render ngay trong lượt Urgent update và làm mất tác dụng của `useDeferredValue`.",
          "Với tác vụ tính toán thuần JS (như vòng lặp `for` 500ms ngoài React), `useTransition` không thể cắt nhỏ hàm JS đó — phải dùng Web Worker hoặc Time-slicing (xem Lab 2.1 & 2.2).",
        ],
        devtoolsSteps: [
          "Ở chế độ `Baseline`, gõ thật nhanh vào ô Search hoặc bấm 'Run Stress Test': quan sát INP vọt lên > 250ms và ô input bị khựng.",
          "Chuyển sang chế độ `Optimized` (`useTransition` + `useDeferredValue` + `memo`): gõ nhanh liên tục, chữ hiện lên tức thì 60fps trong khi danh sách hiển thị trạng thái `isPending` mượt mà.",
          "Mở Chrome DevTools -> Performance -> Bấm Record và gõ 5 phím: ở bản Bad là 1 khối Long Task khổng lồ liền mạch; ở bản Good là các lát cắt nhỏ (time-slices) nhường đường cho sự kiện Keyboard.",
        ],
        takeaway:
          "Đừng dùng Debounce cho việc render UI thuần túy khi đã có Concurrent React! `useTransition` và `useDeferredValue` vừa giữ input mượt 60fps, vừa bắt đầu render ngay lập tức trên máy khỏe và tự động hủy bỏ khi người dùng gõ tiếp trên máy yếu.",
      },
      en: {
        title: "Concurrent React: useTransition & useDeferredValue",
        subtitle:
          "Decoupling urgent user interactions from expensive non-urgent UI renders using React 19 interruptible concurrent rendering",
        symptomSummary:
          "Typing into a filter input freezes the text box until the heavy filtered list finishes rendering (INP > 300ms).",
        rootCauseSummary:
          "By default, all React state updates are urgent and synchronous: React blocks the browser from painting the typed character until the entire subtree reconciles.",
        symptoms: [
          "Typing 'react' quickly causes the input field to freeze for 300–500ms before all characters appear at once.",
          "Core Web Vitals telemetry reports poor INP (> 200ms) on `keydown` / `input` events.",
          "Traditional `debounce(300ms)` fixes typing stutter but introduces an artificial 300ms lag even on fast devices.",
        ],
        underTheHood: [
          "In synchronous rendering, `setQuery(e.target.value)` reconciles both the lightweight `<input>` and the 4,000-row `<HeavyList>` in a single uninterruptible main-thread task.",
          "Subsequent keystrokes wait in the browser event queue until the entire list commit finishes.",
          "With `useTransition` / `useDeferredValue`, React renders the urgente `<input>` update immediately, then yields to the browser every ~5ms while working on the background list tree—aborting stale work if another keystroke arrives.",
        ],
        solution: [
          "Keep the controlled `<input value={query} />` state urgent so keystrokes paint in <16ms.",
          "Derive `const deferredQuery = useDeferredValue(query)` (or wrap the heavy filter state in `startTransition`).",
          "Pass `deferredQuery` to a `React.memo(<HeavyList query={deferredQuery} />)` boundary so React skips rendering the heavy subtree during the urgent commit.",
        ],
        tradeoffs: [
          "Concurrent transitions perform two commits (one fast urgent commit + one interruptible background commit), trading slight extra total CPU work for dramatically lower INP.",
          "Forgetting `React.memo` on the child receiving `deferredValue` defeats the optimization because the child will still re-render synchronously with its parent.",
          "`useTransition` only slices React Fiber work—it cannot slice a single monolithic `Array.sort()` CPU loop (use Web Workers for pure JS compute).",
        ],
        devtoolsSteps: [
          "In `Baseline` mode, type rapidly into the search box or run the Stress Test: observe INP spiking above 250ms.",
          "Switch to `Optimized` mode: typing remains silky smooth while `isStale` gently dims the list until background reconciliation completes.",
          "In Chrome DevTools Performance tab, compare the monolithic red Long Task bar (Bad) against the sliced 5ms work chunks (Good).",
        ],
        takeaway:
          "Prefer `useTransition` / `useDeferredValue` over artificial `debounce` timers for CPU-bound React rendering: they adapt dynamically to the user's device speed and cancel obsolete renders automatically.",
      },
    },
    badCode: `// [Baseline] Unoptimized: Urgent state update blocks keystroke painting until HeavyList finishes
export function ProductCatalogBad() {
  const [query, setQuery] = useState("");

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)} // Blocks main thread.
      />
      {/* Renders 4,000 complex fiber nodes synchronously on every keystroke */}
      <HeavyCatalogList query={query} />
    </div>
  );
}`,
    goodCode: `// [Optimized]: Urgent input + Interruptible background list via useDeferredValue + memo
export function ProductCatalogGood() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  return (
    <div>
      {/* 1. Urgent update: paints typed character in <8ms */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {/* 2. Bailout during urgent render; interruptible time-sliced render in background */}
      <div className={isStale ? "opacity-60 transition-opacity" : ""}>
        <MemoizedHeavyCatalogList query={deferredQuery} />
      </div>
    </div>
  );
}

const MemoizedHeavyCatalogList = memo(HeavyCatalogList);`,
  },

  {
    slug: "dom-virtualization",
    code: "1.3",
    pillarId: 1,
    primaryMetric: "FPS",
    severity: "critical",
    libraries: ["@tanstack/react-virtual", "CSS content-visibility"],
    content: {
      vi: {
        title: "DOM Virtualization & Windowing (10,000+ Rows)",
        subtitle:
          "Giảm số lượng DOM Nodes từ 40,000 xuống 60 nodes bằng @tanstack/react-virtual để đạt 60 FPS tuyệt đối khi cuộn và mount",
        symptomSummary:
          "Trang chứa danh sách hoặc bảng vài nghìn dòng mất 1-2 giây trắng màn hình khi mở, cuộn trang bị giật và bộ nhớ DOM phình to.",
        rootCauseSummary:
          "Render toàn bộ 10,000 phần tử ra cây DOM thật cùng lúc dù màn hình người dùng chỉ nhìn thấy khoảng 12-15 dòng tại một thời điểm.",
        symptoms: [
          "Chỉ số DOM Nodes trên HUD vượt ngưỡng 15,000 – 40,000 nodes (Google Lighthouse cảnh báo đỏ từ mốc > 1,400 nodes).",
          "Thời gian Mount lần đầu mất hàng trăm ms, và mỗi khi thay đổi style/layout trên trang, trình duyệt tốn rất nhiều thời gian tính toán Recalculate Style & Layout.",
          "Cuộn nhanh (fast scroll) xuất hiện vùng trắng hoặc rớt khung hình xuống dưới 25 FPS.",
        ],
        underTheHood: [
          "Cây DOM càng lớn, chi phí cho 3 bước của Browser Rendering Pipeline (Style Calculation -> Layout -> Paint) càng tăng tuyến tính `O(N)` theo tổng số node trên trang, kể cả những node đang nằm ngoài khung nhìn (off-screen).",
          "Virtualization (Windowing) chỉ giữ trong DOM những phần tử nằm trong vùng giao cắt với Scroll Viewport cộng thêm một lượng đệm nhỏ (`overscan: 5`), đồng thời dùng một thẻ `<div style={{ height: totalSize }}>` và `transform: translateY(...)` để giả lập thanh cuộn đúng kích thước thật.",
        ],
        solution: [
          "Sử dụng `useVirtualizer` từ `@tanstack/react-virtual` để chỉ render ~15 dòng đang hiển thị trong viewport bất kể tập dữ liệu dài 10,000 hay 100,000 dòng (`O(1)` DOM nodes).",
          "Định vị từng dòng bằng `transform: translateY(${virtualRow.start}px)` trên lớp `position: absolute` để việc dịch chuyển dòng khi cuộn diễn ra trên GPU Compositor mà không gây Reflow.",
          "Với các trang nội dung tĩnh dài không tiện dùng JS Virtualizer, có thể bổ sung CSS `content-visibility: auto; contain-intrinsic-size: 0 56px` để trình duyệt tự bỏ qua Layout/Paint cho các khối ngoài màn hình.",
        ],
        tradeoffs: [
          "Tính năng tìm kiếm mặc định của trình duyệt (`Cmd+F` / `Ctrl+F`) sẽ không tìm thấy text của những dòng chưa được mount vào DOM — cần cung cấp ô Search riêng trong ứng dụng.",
          "Với các dòng có chiều cao biến thiên động (dynamic row height), cần truyền `measureElement={virtualizer.measureElement}` và ước lượng `estimateSize` sát thực tế để tránh nhảy thanh cuộn.",
        ],
        devtoolsSteps: [
          "Nhìn vào chỉ số 'DOM Nodes' trên thanh HUD ở đầu trang.",
          "Ở chế độ `Baseline` (render 5,000 dòng trực tiếp): DOM Nodes nhảy vọt lên > 25,000 nodes, thời gian mount gây ra Long Task lớn.",
          "Chuyển sang chế độ `Optimized` (`@tanstack/react-virtual` với 10,000 dòng): dù số bản ghi gấp đôi (10,000), số lượng DOM Nodes giữ cố định ở mức ~180 nodes và cuộn mượt 60 FPS.",
          "Mở Chrome DevTools -> Elements tab -> Cuộn danh sách ở bản Good để thấy các thẻ `div[data-index]` được tái sử dụng và dịch chuyển toạ độ `translateY` theo thời gian thực.",
        ],
        takeaway:
          "Không bao giờ render trực tiếp quá 200-300 dòng phức tạp vào DOM cùng lúc. `@tanstack/react-virtual` biến độ phức tạp DOM từ O(N) về O(viewport_size) chỉ với ~20 dòng cấu hình.",
      },
      en: {
        title: "DOM Virtualization & Windowing (10,000+ Rows)",
        subtitle:
          "Collapsing 40,000+ DOM nodes down to ~60 active viewport nodes using @tanstack/react-virtual for 60 FPS scrolling and instant mounts",
        symptomSummary:
          "Pages with thousands of rows freeze for 1–2 seconds on mount, consume massive memory, and stutter during scrolling or layout changes.",
        rootCauseSummary:
          "Mounting all 10,000+ data items into the real browser DOM simultaneously when the user's viewport only displays ~12 rows at any moment.",
        symptoms: [
          "The DOM Nodes counter in the HUD exceeds 15,000–40,000 nodes (Lighthouse flags anything > 1,400 nodes).",
          "Initial mount triggers a massive Long Task, and any subsequent CSS/layout change triggers expensive browser `Recalculate Style` passes across all 40,000 nodes.",
          "Scrolling rapidly causes frame drops and high memory consumption.",
        ],
        underTheHood: [
          "Browser Style Calculation and Layout costs scale `O(N)` with total DOM node count—even for offscreen elements.",
          "Windowing / Virtualization maintains a single outer scroll container with an inner spacer (`height: virtualizer.getTotalSize()`) and renders only the slice of items intersecting the current scroll offset plus a small `overscan` buffer.",
        ],
        solution: [
          "Use `useVirtualizer` from `@tanstack/react-virtual` to keep the live DOM count constant (`O(1)` relative to dataset size).",
          "Position visible rows via `transform: translateY(${virtualRow.start}px)` so scrolling stays on the GPU compositor thread.",
          "For document-heavy feeds where JS virtualization is impractical, apply CSS `content-visibility: auto; contain-intrinsic-size: 0 56px`.",
        ],
        tradeoffs: [
          "Native browser find-in-page (`Cmd+F` / `Ctrl+F`) cannot match unmounted offscreen rows; always provide an in-app search/jump filter.",
          "Dynamic row heights require `ref={virtualizer.measureElement}` and a reasonable `estimateSize` to prevent scrollbar jitter.",
        ],
        devtoolsSteps: [
          "Watch the 'DOM Nodes' metric on the top HUD.",
          "In `Baseline` mode (5,000 unvirtualized rows): DOM Nodes jump past 25,000+ and mounting blocks the main thread.",
          "Switch to `Optimized` mode (`@tanstack/react-virtual` with 10,000 rows): even with 2x more data (10,000 rows), DOM Nodes drop to ~180 and scrolling stays locked at 60 FPS.",
          "Inspect the DOM in Chrome DevTools Elements panel while scrolling to see `translateY` offsets updating dynamically.",
        ],
        takeaway:
          "Never mount thousands of complex rows directly into the DOM. Virtualization turns `O(N)` DOM & layout cost into `O(viewport)` constant cost.",
      },
    },
    badCode: `// [Baseline] Unoptimized: Mounts 10,000 rows (~50,000 DOM nodes) directly into the document
export function LogViewerBad({ logs }: { logs: LogItem[] }) {
  return (
    <div className="h-[420px] overflow-auto">
      {logs.map((log) => (
        <div key={log.id} className="flex h-11 items-center border-b px-4">
          <span>{log.timestamp}</span>
          <span>{log.service}</span>
          <span>{log.message}</span>
        </div>
      ))}
    </div>
  );
}`,
    goodCode: `// [Optimized]: @tanstack/react-virtual mounts only ~14 visible rows (~80 DOM nodes)
import { useVirtualizer } from "@tanstack/react-virtual";

export function LogViewerGood({ logs }: { logs: LogItem[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: logs.length, // 10,000+ items
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 5,
  });

  return (
    <div ref={parentRef} className="h-[420px] overflow-auto">
      <div style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}>
        {rowVirtualizer.getVirtualItems().map((vRow) => {
          const log = logs[vRow.index];
          return (
            <div
              key={vRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: vRow.size,
                transform: \`translateY(\${vRow.start}px)\`,
              }}
            >
              <LogRow item={log} />
            </div>
          );
        })}
      </div>
    </div>
  );
}`,
  },

  // ============================================================================
  // PILLAR 2: MAIN THREAD & RUNTIME (INP & RESPONSIVENESS)
  // ============================================================================
  {
    slug: "long-tasks-yielding",
    code: "2.1",
    pillarId: 2,
    primaryMetric: "TBT",
    severity: "critical",
    libraries: ["scheduler.yield()", "MessageChannel", "Time-Slicing"],
    content: {
      vi: {
        title: "Long Tasks & Cooperative Main-Thread Yielding",
        subtitle:
          "Phá vỡ các tác vụ đồng bộ > 50ms trên Main Thread bằng Time-Slicing & scheduler.yield() để giữ INP luôn dưới 40ms",
        symptomSummary:
          "Khi bấm nút xử lý dữ liệu hoặc khởi tạo trang, toàn bộ giao diện bị đông cứng trong vài trăm ms, hiệu ứng loading bị đứng hình và không bấm được nút khác.",
        rootCauseSummary:
          "Vòng lặp hoặc chuỗi hàm JavaScript chạy liên tục quá 50ms (Long Task) độc chiếm Main Thread, không nhường quyền cho Browser Event Loop xử lý input và vẽ khung hình mới.",
        symptoms: [
          "Con quay loading hoặc thanh tiến trình bị đơ cứng không nhúc nhích trong lúc đang xử lý dữ liệu.",
          "Người dùng bấm nút 'Cancel' hoặc tương tác sang phần tử khác nhưng trình duyệt không phản hồi cho tới khi tác vụ xong.",
          "HUD ghi nhận TBT (Total Blocking Time) cao vọt và FPS rớt xuống dưới 10 FPS.",
        ],
        underTheHood: [
          "Browser Main Thread dùng chung một Event Loop cho cả 3 việc: thực thi JavaScript, xử lý User Input Events (click/keydown), và Rendering Pipeline (Style -> Layout -> Paint).",
          "Theo chuẩn Web Performance, bất kỳ task nào kéo dài > 50ms đều là **Long Task**, và phần thời gian vượt quá 50ms được tính vào **Total Blocking Time (TBT)**.",
          "Khi ta chèn điểm nhường (`await yieldToMain()`) sau mỗi 8-12ms xử lý, tác vụ hiện tại kết thúc để trình duyệt kịp nhận sự kiện click của người dùng và vẽ frame tiếp theo (60fps = 16.6ms/frame), rồi mới chạy tiếp phần việc còn lại ở task kế tiếp.",
        ],
        solution: [
          "Sử dụng `scheduler.yield()` (API chuẩn mới trên trình duyệt hiện đại giúp ưu tiên tiếp tục công việc ngay sau khi nhường input/paint) kèm fallback sang `MessageChannel` hoặc `setTimeout(0)`.",
          "Kiểm tra thời gian chạy của từng lô (batch) bằng `performance.now() - sliceStart > 10`: chỉ yield khi đã dùng hết ngân sách ~10ms của frame đó (tránh yield quá dày gây overhead).",
          "Kết hợp `AbortController` hoặc cờ hủy để người dùng có thể bấm nút 'Cancel' ngắt tác vụ ngay lập tức giữa các lần yield.",
        ],
        tradeoffs: [
          "Time-slicing làm tổng thời gian hoàn thành (wall-clock time) dài hơn khoảng 5-10% do thời gian nhường cho trình duyệt vẽ khung hình, nhưng đổi lại UI phản hồi tức thì (0ms TBT, 60 FPS).",
          "Vì hàm chuyển từ đồng bộ (`sync`) sang bất đồng bộ (`async`), cần chú ý kiểm tra dữ liệu đầu vào có bị thay đổi giữa các nhịp `await` hay không.",
        ],
        devtoolsSteps: [
          "Quan sát con lắc/vòng quay mượt (60 FPS Heartbeat) ngay trong khung Sandbox của bài Lab.",
          "Ở chế độ `Baseline`, bấm 'Run Stress Test': vòng lặp xử lý 30,000 bản ghi chạy liền 1 mạch ~450ms làm con lắc đứng hình hoàn toàn, TBT tăng thêm ~400ms.",
          "Chuyển sang chế độ `Optimized` (Cooperative Yielding každých 10ms) và bấm chạy: dữ liệu được xử lý theo từng lát cắt kèm thanh phần trăm mượt mà, con lắc không hề bị khựng, TBT = 0ms.",
        ],
        takeaway:
          "Mọi vòng lặp xử lý trên Main Thread có nguy cơ vượt quá 16ms đều phải có cơ chế Time-Budget Yielding (`performance.now() - start > 10ms`) hoặc chuyển sang Web Worker.",
      },
      en: {
        title: "Long Tasks & Cooperative Main-Thread Yielding",
        subtitle:
          "Breaking up >50ms synchronous JavaScript tasks via Time-Slicing and scheduler.yield() to keep TBT at 0ms and INP under 40ms",
        symptomSummary:
          "Clicking an action or initializing data freezes animations, blocks button clicks, and locks up the page for hundreds of milliseconds.",
        rootCauseSummary:
          "Running a synchronous JS loop for >50ms monopolizes the single Browser Main Thread, starving input callbacks and frame rendering.",
        symptoms: [
          "CSS/JS animations and progress bars freeze completely while batch processing runs.",
          "Clicking a 'Cancel' button or typing in another field does nothing until the entire batch completes.",
          "HUD reports Long Tasks and high Total Blocking Time (TBT) while FPS drops to single digits.",
        ],
        underTheHood: [
          "The browser executes JavaScript, dispatches user input events, and runs the rendering pipeline (Style -> Layout -> Paint) on the same Main Thread.",
          "Any task exceeding 50ms is classified as a **Long Task**; all time above 50ms accumulates as **Total Blocking Time (TBT)**.",
          "By yielding back to the event loop (`await yieldToMain()`) whenever the current slice exceeds ~10ms, the browser gets a window to process pending user interactions and paint the next 60fps frame before resuming the loop.",
        ],
        solution: [
          "Use `scheduler.yield()` when available (prioritizes continuation while yielding to input/rendering), falling back to `MessageChannel` / `setTimeout(0)`.",
          "Use time-budget slicing (`if (performance.now() - sliceStart > 10) await yieldToMain()`) rather than yielding on every single item.",
          "Support cancellation between slices so users can abort obsolete work mid-flight.",
        ],
        tradeoffs: [
          "Total wall-clock completion time increases slightly (~5–10%) because frames are painted in between slices, in exchange for 0ms blocking time and responsive UI.",
          "Converting a synchronous function to `async` requires handling potential state mutations or cancellation between `await` points.",
        ],
        devtoolsSteps: [
          "Watch the live 60 FPS Heartbeat indicator inside the lab sandbox.",
          "In `Baseline` mode, click 'Run Stress Test': the 30,000-item synchronous loop freezes the heartbeat animation and spikes TBT by ~400ms.",
          "Switch to `Optimized` mode (Time-Sliced Yielding) and run again: the progress bar advances smoothly at 60 FPS with 0ms TBT, and you can click interactions mid-run without lag.",
        ],
        takeaway:
          "Never block the Main Thread for >50ms. Slice unavoidable main-thread loops into <10ms time budgets using `scheduler.yield()`.",
      },
    },
    badCode: `// [Baseline] Unoptimized: Monolithic synchronous loop blocks the Main Thread for ~450ms
export function processAnalyticsSync(records: RawRecord[]) {
  const results = [];
  for (let i = 0; i < records.length; i++) {
    // Browser cannot paint frames or handle clicks until ALL 30,000 items finish.
    results.push(computeHeavyScore(records[i]));
  }
  return results;
}`,
    goodCode: `// [Optimized]: Cooperative time-slicing yields every ~10ms to keep 60 FPS & low INP
async function yieldToMain() {
  if ("scheduler" in globalThis && "yield" in (globalThis as any).scheduler) {
    return (globalThis as any).scheduler.yield();
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function processAnalyticsSliced(
  records: RawRecord[],
  onProgress?: (pct: number) => void
) {
  const results = [];
  let sliceStart = performance.now();

  for (let i = 0; i < records.length; i++) {
    results.push(computeHeavyScore(records[i]));

    // Yield to browser whenever we've spent >10ms in the current frame budget
    if (performance.now() - sliceStart > 10) {
      onProgress?.(Math.round(((i + 1) / records.length) * 100));
      await yieldToMain();
      sliceStart = performance.now();
    }
  }
  return results;
}`,
  },

  {
    slug: "web-workers-offload",
    code: "2.2",
    pillarId: 2,
    primaryMetric: "FPS",
    severity: "critical",
    libraries: ["Web Worker", "Blob Worker", "Off-Main-Thread"],
    content: {
      vi: {
        title: "Web Workers Offloading (Off-Main-Thread Compute)",
        subtitle:
          "Đẩy hoàn toàn các thuật toán nặng (Aggregation, Sort, Parsing, Crypto) sang luồng OS Thread riêng bằng Web Worker để Main Thread rảnh tay 100%",
        symptomSummary:
          "Khi người dùng xuất báo cáo, phân tích dữ liệu lớn hoặc chạy thuật toán xếp hạng, cả tab trình duyệt bị đơ cứng hoặc hiện thông báo 'Page Unresponsive'.",
        rootCauseSummary:
          "Chạy thuật toán ngốn CPU (CPU-bound computation) trực tiếp trên UI Main Thread thay vì tách sang Background Worker Thread.",
        symptoms: [
          "FPS tụt về 1-5 FPS ngay khi bắt đầu tính toán dữ liệu lớn.",
          "Kể cả khi dùng `useMemo`, lần đầu tiên `useMemo` chạy vẫn khóa cứng Main Thread vì `useMemo` chạy đồng bộ trong pha Render.",
          "Quạt tản nhiệt máy tính quay mạnh và mọi thao tác cuộn/click trên trang đều bị đóng băng.",
        ],
        underTheHood: [
          "JavaScript trên trình duyệt mặc định là đơn luồng (single-threaded), nhưng trình duyệt cung cấp **Web Workers** — các luồng hệ điều hành thực thụ (OS-level threads) chạy song song trên nhân CPU khác, có bộ nhớ Heap và Event Loop hoàn toàn tách biệt với Main Thread.",
          "Giao tiếp giữa Main Thread và Worker diễn ra qua `postMessage` sử dụng thuật toán **Structured Clone** (hoặc chuyển quyền sở hữu bộ nhớ 0-copy `O(1)` với `Transferable Objects` như `ArrayBuffer`).",
        ],
        solution: [
          "Khởi tạo Web Worker để thực thi toàn bộ việc gom nhóm, tính phân vị (P50/P95/P99), tìm kiếm phức tạp hoặc parse dữ liệu lớn ở luồng riêng.",
          "Main Thread chỉ gửi lệnh và nhận kết quả cuối cùng đã rút gọn qua `worker.onmessage`, giúp thời gian chiếm dụng Main Thread < 1ms.",
          "Tái sử dụng Worker instance hoặc dọn dẹp bằng `worker.terminate()` khi unmount để tránh rò rỉ luồng.",
        ],
        tradeoffs: [
          "Web Worker KHÔNG có quyền truy cập vào `window`, `document` hay DOM API.",
          "Chi phí tuần tự hóa dữ liệu (`postMessage` Structured Clone) cho một object khổng lồ (ví dụ > 50MB JSON) có thể mất vài chục ms — với dữ liệu nhị phân hoặc mảng số lớn, hãy dùng `Float64Array` / `ArrayBuffer` kèm Transferable list.",
        ],
        devtoolsSteps: [
          "Ở chế độ `Baseline`, bấm 'Run Stress Test' (Phân tích rủi ro & Monte Carlo trên 200,000 điểm dữ liệu ngay trên Main Thread): quan sát thanh trượt/hoạt ảnh trên màn hình bị đứng khựng hoàn toàn.",
          "Chuyển sang chế độ `Optimized` (Chạy trên Real Web Worker Thread) và bấm chạy: thuật toán chạy trên nhân CPU khác, Main Thread giữ nguyên 60 FPS tuyệt đối và TBT = 0ms.",
          "Mở Chrome DevTools -> Performance -> Record khi chạy bản Good: cuộn xuống dưới mục 'Main' bạn sẽ thấy một hàng riêng tên là **Worker** đang chạy full tải, trong khi hàng **Main** hoàn toàn trống trải.",
        ],
        takeaway:
          "`useMemo` chỉ giúp tránh tính lại lần thứ 2, chứ KHÔNG cứu được Main Thread ở lần tính đầu tiên. Với tác vụ thuần tính toán > 50ms, Web Worker là giải pháp chuẩn mực để đạt 0ms Main-Thread Blocking.",
      },
      en: {
        title: "Web Workers Offloading (Off-Main-Thread Compute)",
        subtitle:
          "Moving heavy CPU-bound workloads (Monte Carlo analytics, sorting, parsing) to a dedicated OS background thread via Web Workers for 0ms Main-Thread blocking",
        symptomSummary:
          "Running complex analytics, CSV parsing, or data aggregation freezes the entire browser tab even if wrapped in `useMemo`.",
        rootCauseSummary:
          "Executing heavy CPU-bound algorithms on the UI Main Thread instead of offloading them to a parallel Web Worker thread.",
        symptoms: [
          "FPS plummets to 1–5 FPS whenever a complex report or calculation runs.",
          "Wrapping the calculation in `useMemo` still blocks the initial render because `useMemo` executes synchronously on the Main Thread.",
          "Scrolling, hover states, and animations completely stop responding until computation finishes.",
        ],
        underTheHood: [
          "Web Workers spawn a genuine OS-level background thread with its own V8 isolate, heap, and event loop running on a separate CPU core.",
          "Data crosses between Main Thread and Worker via `postMessage` (Structured Clone algorithm) or zero-copy `Transferable` `ArrayBuffer` ownership transfer.",
        ],
        solution: [
          "Offload heavy data generation, sorting, statistical percentiles (P50/P95/P99), and Monte Carlo simulations into a dedicated Web Worker.",
          "Send only compact parameters in and compact summary results back to the Main Thread so serialization overhead stays < 1ms.",
          "Clean up workers on unmount with `worker.terminate()`.",
        ],
        tradeoffs: [
          "Web Workers cannot access `window`, `document`, or the DOM directly.",
          "Cloning huge nested JS objects across `postMessage` has serialization cost; for massive numeric arrays, use typed arrays (`Float64Array`) with transferable `ArrayBuffer`s.",
        ],
        devtoolsSteps: [
          "In `Baseline` mode, click 'Run Stress Test' to run the 200,000-iteration risk engine on the Main Thread: watch the interactive canvas/animation freeze solid.",
          "Switch to `Optimized` mode (Dedicated Web Worker) and run the exact same calculation: Main Thread stays at 60 FPS with 0ms TBT.",
          "In Chrome DevTools -> Performance tab, expand the **Worker** track below the **Main** track to observe the heavy CPU block running off-main-thread.",
        ],
        takeaway:
          "`useMemo` caches repeat runs but still blocks the Main Thread on the first run. Move heavy CPU compute (>50ms) off the Main Thread with Web Workers.",
      },
    },
    badCode: `// [Baseline] Unoptimized: Runs 200,000-point statistical simulation on the UI Main Thread
export function RiskReportBad({ datasetSize }: { datasetSize: number }) {
  const [report, setReport] = useState(null);

  const handleCompute = () => {
    // Freezes the entire browser UI for 350-600ms.
    const summary = runHeavyMonteCarloOnMainThread(datasetSize);
    setReport(summary);
  };

  return <button onClick={handleCompute}>Compute Risk</button>;
}`,
    goodCode: `// [Optimized]: Offloads heavy compute to a dedicated Web Worker OS thread (0ms UI block)
export function RiskReportGood({ datasetSize }: { datasetSize: number }) {
  const [report, setReport] = useState(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("./risk.worker.ts", import.meta.url));
    worker.onmessage = (e) => setReport(e.data);
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  const handleCompute = () => {
    // Main thread dispatches message in <0.2ms and stays at 60 FPS.
    workerRef.current?.postMessage({ datasetSize });
  };

  return <button onClick={handleCompute}>Compute in Worker</button>;
}`,
  },

  {
    slug: "layout-thrashing",
    code: "2.3",
    pillarId: 2,
    primaryMetric: "FPS",
    severity: "high",
    libraries: ["FastDOM Pattern", "requestAnimationFrame", "CSS Compositor"],
    content: {
      vi: {
        title: "Layout Thrashing & Forced Synchronous Layout",
        subtitle:
          "Ngăn chặn thảm họa Đọc/Ghi DOM xen kẽ trong vòng lặp làm trình duyệt phải tính lại Reflow hàng trăm lần trong 1 frame",
        symptomSummary:
          "Hiệu ứng chuyển động, căn chỉnh kích thước phần tử hàng loạt hoặc kéo thả bị giật cục nặng, trong DevTools xuất hiện hàng loạt cảnh báo tím 'Forced reflow'.",
        rootCauseSummary:
          "Đọc thuộc tính hình học (`offsetHeight`, `getBoundingClientRect`) ngay sau khi vừa ghi `element.style` trong một vòng lặp, ép trình duyệt phải tính toán Layout đồng bộ ngay lập tức.",
        symptoms: [
          "Trong Chrome DevTools Performance, bên trong 1 frame xuất hiện hình răng cưa màu tím với nhãn cảnh báo đỏ **'Forced reflow is a likely performance bottleneck'**.",
          "Cập nhật vị trí/kích thước cho 150-300 phần tử mất tới 80-150ms thay vì < 2ms.",
        ],
        underTheHood: [
          "Bình thường, trình duyệt rất thông minh: khi JS sửa `el.style.width = ...`, trình duyệt đánh dấu Layout là 'dirty' và gom tất cả thay đổi lại để chỉ tính toán Layout **1 lần duy nhất** ở cuối frame.",
          "Tuy nhiên, nếu dòng code tiếp theo bạn đọc `el.offsetHeight` hoặc `el.getBoundingClientRect()`, trình duyệt buộc phải trả về con số chính xác ngay tại dòng đó. Nó không còn cách nào khác ngoài việc dừng JS lại và chạy **Forced Synchronous Layout (Reflow)** ngay lập tức.",
          "Khi đặt cặp `Đọc DOM -> Ghi DOM` bên trong vòng lặp `for` 200 phần tử, bạn ép trình duyệt chạy Layout 200 lần liên tiếp trong cùng 1 frame (Layout Thrashing).",
        ],
        solution: [
          "Tách biệt hoàn toàn **Pha Đọc (Batch Reads)** và **Pha Ghi (Batch Writes)**: Đọc toàn bộ kích thước từ DOM vào mảng biến JS trước, sau đó mới lặp qua mảng để ghi `style` (trình duyệt chỉ Reflow đúng 1 lần ở cuối frame).",
          "Ưu tiên sử dụng thuộc tính chạy trên **GPU Compositor Thread** như `transform: scaleY(...)` hoặc `transform: translate3d(...)` thay vì sửa `width`, `height`, `top`, `left` (vốn kích hoạt Layout + Paint).",
        ],
        tradeoffs: [
          "Khi dùng `transform: scale(...)`, kích thước hộp vật lý (layout box) của phần tử không đổi nên các phần tử xung quanh không tự đẩy ra — rất lý tưởng cho biểu đồ/animation nhưng cần tính toán nếu muốn đẩy bố cục xung quanh.",
        ],
        devtoolsSteps: [
          "Ở chế độ `Baseline`, bấm 'Run Stress Test' (Cập nhật 240 thanh biểu đồ theo kiểu đọc `offsetHeight` rồi ghi `style.height` xen kẽ): xem thời gian thực thi mỗi frame vọt lên cao.",
          "Chuyển sang chế độ `Optimized` (Batch Read trước -> Batch Write sau bằng `transform: scaleY`): thời gian xử lý giảm hơn 90%, chuyển động mượt 60 FPS.",
          "Mở Chrome DevTools -> Performance -> Record khi chạy bản Bad: phóng to vào khối Task sẽ thấy hàng trăm khối màu tím nhỏ li ti có góc đỏ ('Layout' / 'Recalculate Style') xếp chồng lên nhau.",
        ],
        takeaway:
          "Quy tắc vàng khi thao tác DOM trực tiếp: **Đọc tất cả trước, Ghi tất cả sau (Read-then-Write)**, và luôn ưu tiên `transform` / `opacity` để đẩy việc vẽ sang GPU Compositor.",
      },
      en: {
        title: "Layout Thrashing & Forced Synchronous Layout",
        subtitle:
          "Eliminating interleaved DOM geometry reads and style writes that force the browser to recalculate layout ratusan times per frame",
        symptomSummary:
          "Animations, masonry grids, or synchronized element resizing stutter badly, with purple 'Forced reflow' warnings flooding Chrome DevTools.",
        rootCauseSummary:
          "Reading layout geometry (`offsetHeight`, `getBoundingClientRect`) immediately after mutating `element.style` inside a loop forces synchronous layout recalculation on every iteration.",
        symptoms: [
          "Chrome DevTools Performance flamechart displays a sawtooth pattern of purple 'Layout' blocks marked with red warning triangles (**Forced reflow**).",
          "Updating 200 elements takes 60–150ms per frame instead of <2ms.",
        ],
        underTheHood: [
          "Normally, browsers batch style mutations and perform a single asynchronous Layout pass at the end of the frame.",
          "However, querying a geometric property like `offsetTop`, `offsetWidth`, or `getBoundingClientRect()` while styles are dirty forces the browser to flush pending style changes and run Layout *immediately* and *synchronously* before returning the value to JS.",
          "Putting `read -> write` inside a `for` loop triggers `N` consecutive synchronous reflows in a single frame (Layout Thrashing).",
        ],
        solution: [
          "Separate **Batch Reads** from **Batch Writes** (FastDOM pattern): read all required measurements in a first loop, then apply all style mutations in a second loop.",
          "Animate using GPU Compositor properties (`transform: scaleY()`, `translate3d()`, `opacity`) instead of layout-inducing properties (`height`, `width`, `top`, `left`).",
        ],
        tradeoffs: [
          "CSS `transform` does not affect surrounding flow layout—which is ideal for charts, visualizer bars, and drawers, though layout properties are still needed if sibling reflow is desired (in which case, strictly batch reads before writes).",
        ],
        devtoolsSteps: [
          "In `Baseline` mode, click 'Run Stress Test' to animate 240 visualizer bars using interleaved `getBoundingClientRect()` reads + `style.height` writes.",
          "Switch to `Optimized` mode (Batched Reads + Compositor `transform: scaleY`): watch frame execution time drop from ~45ms down to <1.5ms at 60 FPS.",
          "In Chrome DevTools Performance tab, inspect the purple 'Layout' blocks with red corners in Bad mode versus zero forced reflows in Good mode.",
        ],
        takeaway:
          "Never interleave DOM measurement reads (`getBoundingClientRect`, `offset*`) and DOM style writes in a loop. Always batch all reads first, then batch all writes, and prefer GPU compositor `transform`s.",
      },
    },
    badCode: `// [Baseline] Unoptimized: Interleaved Read + Write inside a loop causes 240 Forced Reflows per frame.
function animateBarsThrashing(bars: HTMLElement[]) {
  for (let i = 0; i < bars.length; i++) {
    // 1. READ: Forces synchronous layout because previous iteration mutated style.
    const currentHeight = bars[i].getBoundingClientRect().height;
    const nextHeight = computeNextHeight(currentHeight, i);
    // 2. WRITE: Invalidates layout tree immediately.
    bars[i].style.height = \`\${nextHeight}px\`;
  }
}`,
    goodCode: `// [Optimized]: Phase 1 Batch Reads -> Phase 2 Batch Compositor Writes (0 Forced Reflows)
function animateBarsOptimized(bars: HTMLElement[]) {
  // Phase 1: READ all geometry first while layout tree is clean
  const heights = bars.map((bar) => bar.offsetHeight);

  // Phase 2: WRITE all updates using GPU-accelerated transform
  for (let i = 0; i < bars.length; i++) {
    const scale = computeNextScale(heights[i], i);
    bars[i].style.transform = \`scaleY(\${scale})\`;
  }
}`,
  },

  // ============================================================================
  // PILLAR 3: MEMORY & RESOURCE LEAKS
  // ============================================================================
  {
    slug: "detached-dom-leaks",
    code: "3.1",
    pillarId: 3,
    primaryMetric: "Memory",
    severity: "critical",
    libraries: ["WeakRef", "WeakMap", "Heap Snapshot"],
    content: {
      vi: {
        title: "Detached DOM Nodes & Global Reference Leaks",
        subtitle:
          "Tại sao các thẻ DOM đã unmount khỏi màn hình vẫn nằm vĩnh viễn trong RAM và cách giải phóng bằng Cleanup & WeakRef",
        symptomSummary:
          "Người dùng mở/đóng Modal, Drawer hoặc chuyển qua lại giữa các tab càng lâu thì tab trình duyệt càng ngốn hàng trăm MB RAM và chậm dần.",
        rootCauseSummary:
          "Lưu tham chiếu trực tiếp tới phần tử DOM (`HTMLDivElement`) hoặc callback chứa DOM vào mảng/cache/registry ở phạm vi module/global mà không xóa khi component unmount.",
        symptoms: [
          "Chỉ số Heap Memory trên HUD tăng bậc thang sau mỗi lần mở/đóng component và không bao giờ giảm xuống kể cả khi bấm Garbage Collection.",
          "Trong Chrome DevTools Memory -> Heap Snapshot, tìm từ khóa `Detached` xuất hiện hàng trăm `Detached HTMLDivElement`.",
        ],
        underTheHood: [
          "Garbage Collector (GC) của V8 hoạt động theo nguyên lý **Reachability (Khả năng truy cập từ GC Roots như `window` / module scope)** chứ không quan tâm node đó còn nằm trên màn hình hay không.",
          "Nguy hiểm hơn: một node DOM trong bộ nhớ có liên kết hai chiều (`parentNode`, `childNodes`, và `__reactFiber$`). Chỉ cần bạn giữ tham chiếu tới **1 thẻ `<button>` con** đã bị tháo khỏi trang, toàn bộ cây DOM cha của modal đó và các dữ liệu gắn vào React Fiber của nó đều bị giữ lại trong RAM (Retained Tree).",
        ],
        solution: [
          "Luôn xóa tham chiếu trong hàm cleanup của `useEffect` hoặc Callback Ref (`ref={(node) => ...}`) khi `node === null`.",
          "Nếu cần lưu metadata gắn với một DOM node hoặc cần giữ tham chiếu yếu không ngăn cản GC thu hồi bộ nhớ, hãy sử dụng `WeakMap<Element, Metadata>` hoặc `WeakRef<HTMLElement>`.",
        ],
        tradeoffs: [
          "`WeakMap` không hỗ trợ duyệt danh sách phần tử (`.keys()`, `.forEach()`), do đó với các registry cần lặp qua danh sách đang active, bạn vẫn dùng `Map`/`Set` nhưng bắt buộc phải `.delete()` trong cleanup khi unmount.",
        ],
        devtoolsSteps: [
          "Nhìn vào chỉ số 'Bộ nhớ / Heap (MB)' trên thanh HUD và bộ đếm 'Detached Nodes Retained' trong bài Lab.",
          "Ở chế độ `Baseline`, bấm 'Run Stress Test' (Tự động Mount & Unmount 15 lần cửa sổ Rich Media Inspector): mỗi lần đóng cửa sổ, DOM node cùng buffer dữ liệu 2.5MB bị giữ lại trong global registry làm Heap tăng vọt lên > 60MB.",
          "Chuyển sang chế độ `Optimized` (Dùng `WeakRef` + Unmount Cleanup): dù bạn đóng/mở bao nhiêu lần, bộ nhớ vẫn được giải phóng ngay khi unmount.",
          "Mở Chrome DevTools -> Tab Memory -> Chọn 'Heap snapshot' -> Gõ `Detached` vào ô Class filter để soi tận mắt các node bị rò rỉ.",
        ],
        takeaway:
          "Một biến toàn cục giữ 1 thẻ DOM nhỏ cũng có thể neo giữ cả một nhánh DOM tree và React Fiber khổng lồ. Hãy luôn dọn dẹp ref khi unmount hoặc bọc trong `WeakMap` / `WeakRef`.",
      },
      en: {
        title: "Detached DOM Nodes & Global Reference Leaks",
        subtitle:
          "How unmounted DOM subtrees stay pinned in V8 heap memory via stray references, and how to release them with proper cleanup and WeakRef/WeakMap",
        symptomSummary:
          "Opening and closing modals, drawers, or tabs repeatedly causes browser memory usage to climb by hundreds of MBs until the tab crashes.",
        rootCauseSummary:
          "Storing DOM element references (`HTMLElement`) or closures referencing DOM nodes inside module-scoped arrays/registries without cleaning them up on unmount.",
        symptoms: [
          "The Heap Memory indicator on the HUD climbs in a staircase pattern every time a modal/view mounts and unmounts, never dropping after Garbage Collection.",
          "Searching `Detached` in Chrome DevTools Heap Snapshot reveals dozens of `Detached HTMLDivElement` trees.",
        ],
        underTheHood: [
          "V8's Garbage Collector reclaims memory based strictly on **Reachability from GC Roots** (`window`, module scope), not whether a node is attached to `document.body`.",
          "Because DOM nodes maintain bidirectional pointers (`parentNode`, `children`, `__reactFiber$`), holding a single reference to one unmounted child `<div />` retains the **entire detached DOM subtree and its React Fiber state** in memory.",
        ],
        solution: [
          "Always unregister DOM nodes and clear references inside the `useEffect` cleanup function or ref cleanup callback.",
          "When associating metadata with DOM elements or caching element pointers, use `WeakMap<HTMLElement, Meta>` or `WeakRef<HTMLElement>` so GC can automatically reclaim unmounted elements.",
        ],
        tradeoffs: [
          "`WeakMap` is intentionally non-enumerable; if you need to iterate over active elements, use a `Set`/`Map` paired with guaranteed removal inside React's effect/ref cleanup.",
        ],
        devtoolsSteps: [
          "Watch the 'Heap / Memory (MB)' counter in the HUD.",
          "In `Baseline` mode, click 'Run Stress Test' (mounts and unmounts a heavy media preview 15 times): each unmount leaves a detached DOM subtree + 2.5MB buffer trapped in a module registry, spiking memory past 60MB.",
          "Switch to `Optimized` mode (`WeakRef` + Unmount Cleanup): mounting and unmounting 15 times keeps memory flat at baseline.",
          "In Chrome DevTools -> Memory -> Take Heap Snapshot -> Filter by `Detached` to inspect retained DOM trees.",
        ],
        takeaway:
          "Never store raw DOM references in module/global state without an explicit unmount deletion path or a `WeakMap` / `WeakRef` wrapper.",
      },
    },
    badCode: `// [Baseline] Unoptimized: Module-level registry holds strong references to unmounted DOM nodes
const inspectedDomRegistry: { el: HTMLElement; snapshotPayload: unknown }[] = [];

export function MediaModalBad() {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (modalRef.current) {
      inspectedDomRegistry.push({
        el: modalRef.current, // Retained forever even after modal unmounts.
        snapshotPayload: new Array(250_000).fill("pixel-buffer"),
      });
    }
    // Missing cleanup! Every mount/unmount leaks a Detached HTMLDivElement + 2MB
  }, []);

  return <div ref={modalRef}>Rich Media Preview</div>;
}`,
    goodCode: `// [Optimized]: WeakMap / WeakRef + explicit unmount cleanup allows GC to reclaim DOM
const elementMetadata = new WeakMap<HTMLElement, { createdAt: number }>();

export function MediaModalGood() {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;

    elementMetadata.set(el, { createdAt: Date.now() });

    return () => {
      // Explicit cleanup on unmount; WeakMap entry is also auto-collected when 'el' is GC'd
      elementMetadata.delete(el);
    };
  }, []);

  return <div ref={modalRef}>Rich Media Preview</div>;
}`,
  },

  {
    slug: "closures-listeners-leaks",
    code: "3.2",
    pillarId: 3,
    primaryMetric: "Memory",
    severity: "high",
    libraries: ["AbortController", "useEffect Cleanup", "Event Listeners"],
    content: {
      vi: {
        title: "Closures, Stale Timers & Uncleaned Listeners",
        subtitle:
          "Cách một Event Listener hoặc setInterval quên dọn dẹp giữ chặt toàn bộ Lexical Scope (Closure) trong bộ nhớ và nhân bản số lần thực thi",
        symptomSummary:
          "Sau khi re-render hoặc đổi cấu hình vài lần, một lần bấm phím tắt hoặc cuộn trang lại kích hoạt hàm xử lý 10-20 lần liên tiếp kèm rò rỉ bộ nhớ.",
        rootCauseSummary:
          "Đăng ký `window.addEventListener`, `setInterval` hoặc `ResizeObserver` bên trong `useEffect` có dependencies thay đổi nhưng thiếu hàm return cleanup hoặc truyền nhầm reference hàm.",
        symptoms: [
          "Một sự kiện `resize`, `scroll` hoặc `keydown` bắn ra hàng chục log trùng lặp từ các phiên bản cũ của component.",
          "Mỗi closure của listener cũ giữ chặt (capture) toàn bộ biến và state lớn của lần render đó trong bộ nhớ.",
        ],
        underTheHood: [
          "Trong JavaScript, mọi hàm khởi tạo bên trong một component đều tạo ra một **Closure** giữ tham chiếu tới môi trường từ vựng (Lexical Environment) của lần render đó.",
          "Khi bạn gọi `window.addEventListener('keydown', handleKey)`, đối tượng toàn cục `window` giữ một tham chiếu mạnh tới `handleKey`. Chừng nào chưa gỡ listener đó ra khỏi `window`, toàn bộ các biến/object lớn nằm cùng scope với `handleKey` đều không thể được Garbage Collector thu hồi.",
        ],
        solution: [
          "Sử dụng **`AbortController` (`{ signal: controller.signal }`)** khi đăng ký `addEventListener`: chỉ cần gọi `controller.abort()` trong hàm cleanup của `useEffect` là gỡ sạch toàn bộ hàng chục listener cùng lúc mà không sợ truyền lệch function reference.",
          "Luôn gọi `clearInterval` / `clearTimeout` / `observer.disconnect()` trong return của `useEffect`.",
        ],
        tradeoffs: [
          "Nếu hàm handler phụ thuộc vào nhiều state thay đổi liên tục, việc gỡ và đăng ký lại listener trên mỗi render cũng tốn chi phí nhỏ — có thể kết hợp `useEffectEvent` (React 19) hoặc `useRef` để đăng ký listener 1 lần duy nhất khi mount.",
        ],
        devtoolsSteps: [
          "Ở chế độ `Baseline`, bấm 'Run Stress Test' (Giả lập thay đổi cấu hình widget 12 lần): mỗi lần đổi cấu hình lại chồng thêm 1 `window` listener và 1 `setInterval` ngầm giữ chặt buffer 1.8MB.",
          "Thử bấm nút 'Trigger Global Event' ở bản Bad: 1 lần bấm nhưng có tới 12+ zombie listeners cùng phản hồi.",
          "Chuyển sang chế độ `Optimized` (`AbortController` + Cleanup): luôn chỉ có đúng 1 active listener và 0MB bộ nhớ rò rỉ.",
        ],
        takeaway:
          "Hãy dùng `{ signal: abortController.signal }` cho `addEventListener` trong `useEffect`: chỉ một lệnh `controller.abort()` ở hàm return sẽ triệt tiêu 100% zombie listeners và closure leaks.",
      },
      en: {
        title: "Closures, Stale Timers & Uncleaned Listeners",
        subtitle:
          "How uncleaned event listeners and intervals trap entire lexical scopes in memory and multiply callback executions",
        symptomSummary:
          "After reconfiguring a widget or navigating between views a few times, a single event triggers 10–20 duplicate callbacks and memory steadily leaks.",
        rootCauseSummary:
          "Registering `window.addEventListener`, `setInterval`, or observers inside `useEffect` without cleaning them up when dependencies change or the component unmounts.",
        symptoms: [
          "A single `keydown`, `resize`, or custom event fires dozens of stale callbacks simultaneously.",
          "Each zombie listener closure retains the heavy state/buffers captured from its historical render scope.",
        ],
        underTheHood: [
          "JavaScript closures capture their surrounding lexical scope. When `window.addEventListener('resize', onResize)` is registered, the global `window` object holds a strong reference to `onResize`—and through its closure, every variable referenced in that scope.",
          "Until removed from `window`, neither the callback nor any state it closes over can ever be garbage-collected.",
        ],
        solution: [
          "Pass `{ signal: abortController.signal }` to `addEventListener` and call `abortController.abort()` in the `useEffect` cleanup function to tear down all listeners cleanly in one line.",
          "Always pair `setInterval` with `clearInterval` and `ResizeObserver` with `observer.disconnect()` in the effect return function.",
        ],
        tradeoffs: [
          "If the listener callback reads frequently changing state, re-subscribing on every render can be avoided by reading latest state via a ref or React's `useEffectEvent` while keeping a single mount-time subscription.",
        ],
        devtoolsSteps: [
          "In `Baseline` mode, click 'Run Stress Test' (re-subscribes widget config 12 times without cleanup): watch zombie listeners stack up to 12+ and heap memory climb.",
          "Click 'Dispatch Test Event' in Bad mode: a single event triggers all 12+ leaked closures at once.",
          "Switch to `Optimized` mode (`AbortController` cleanup): active listeners stay strictly at 1 and memory stays flat.",
        ],
        takeaway:
          "Use `AbortController` (`{ signal }`) inside `useEffect` for event listeners so `controller.abort()` reliably tears down every subscription on re-run or unmount.",
      },
    },
    badCode: `// [Baseline] Unoptimized: Every 'channelId' change leaks a zombie listener & interval closure.
useEffect(() => {
  const heavyChannelBuffer = new Array(200_000).fill(channelId);

  window.addEventListener("perf-ping", () => {
    console.log("Ping on channel", heavyChannelBuffer[0]);
  });

  setInterval(() => {
    syncHeartbeat(heavyChannelBuffer.length);
  }, 2000);
  // Missing return cleanup.
}, [channelId]);`,
    goodCode: `// [Optimized]: AbortController + clearInterval guarantees zero zombie closures
useEffect(() => {
  const controller = new AbortController();
  const heavyChannelBuffer = new Array(200_000).fill(channelId);

  window.addEventListener(
    "perf-ping",
    () => {
      console.log("Ping on channel", heavyChannelBuffer[0]);
    },
    { signal: controller.signal }
  );

  const timerId = window.setInterval(() => {
    syncHeartbeat(heavyChannelBuffer.length);
  }, 2000);

  return () => {
    controller.abort(); // Removes all listeners attached to this signal
    window.clearInterval(timerId);
  };
}, [channelId]);`,
  },

  {
    slug: "unbounded-cache-lru",
    code: "3.3",
    pillarId: 3,
    primaryMetric: "Memory",
    severity: "high",
    libraries: ["LRU Cache", "WeakMap", "Memory Eviction"],
    content: {
      vi: {
        title: "Unbounded In-Memory Cache vs Bounded LRU & WeakMap",
        subtitle:
          "Khi việc tối ưu tốc độ bằng bộ nhớ đệm (Memoization / Map Cache) phản tác dụng thành lỗ hổng rò rỉ bộ nhớ vô hạn trên ứng dụng SPA dài hơi",
        symptomSummary:
          "Ứng dụng SPA mới mở chạy rất nhanh nhờ cache, nhưng sau 1-2 tiếng làm việc duyệt qua hàng trăm trang sản phẩm/tài liệu, trình duyệt ngốn hàng GB RAM.",
        rootCauseSummary:
          "Sử dụng `new Map()` hoặc object toàn cục để cache kết quả xử lý/dữ liệu theo ID mà không có giới hạn số lượng phần tử tối đa (Max Capacity) hay thời gian sống (TTL).",
        symptoms: [
          "Bộ nhớ tăng tuyến tính với số lượng mục (documents, tickets, profiles) mà người dùng đã bấm xem trong phiên làm việc.",
          "Các bản ghi đã xem từ 2 tiếng trước không bao giờ dùng lại nữa vẫn chiếm nguyên dung lượng trong `Map`.",
        ],
        underTheHood: [
          "Một `Map` tiêu chuẩn trong JS giữ tham chiếu mạnh (strong reference) tới cả `key` và `value` vĩnh viễn cho tới khi gọi `.delete()`.",
          "Cấu trúc **LRU Cache (Least Recently Used)** tận dụng đặc tính của `Map` trong JS (duyệt các key theo đúng thứ tự chèn vào - insertion order): mỗi khi `get(key)`, ta xóa và `set` lại key đó để đưa nó lên đầu độ mới; khi `map.size > maxEntries`, phần tử cũ nhất chính là `map.keys().next().value` sẽ bị trục xuất (`evict`) trong thời gian `O(1)`.",
        ],
        solution: [
          "Luôn đặt giới hạn cứng (`maxEntries`, ví dụ 25 hoặc 50 items) bằng thuật toán **LRU Cache `O(1)`** cho mọi in-memory cache có key là kiểu nguyên thủy (`string` / `number`).",
          "Nếu key của cache là một `Object` (ví dụ dữ liệu gốc từ prop/store), hãy dùng `WeakMap<Object, ComputedResult>` để khi object gốc biến mất khỏi state, kết quả cache cũng tự động biến mất.",
        ],
        tradeoffs: [
          "Đặt `maxEntries` quá nhỏ sẽ làm giảm tỷ lệ Cache Hit (Cache Thrashing) nếu người dùng chuyển qua lại giữa nhiều mục hơn kích thước cache — cần chọn kích thước dựa trên Working Set thực tế của người dùng.",
        ],
        devtoolsSteps: [
          "Ở chế độ `Baseline` (Unbounded `Map`), bấm 'Run Stress Test' để duyệt qua 40 tài liệu nặng: cả 40 bản ghi lưu vĩnh viễn trong RAM làm bộ nhớ tăng không điểm dừng.",
          "Chuyển sang chế độ `Optimized` (Bounded LRU Cache giới hạn `max = 8` mục): khi duyệt qua 40 tài liệu, bộ nhớ luôn giữ phẳng ở ngưỡng an toàn (chỉ giữ đúng 8 tài liệu vừa xem gần nhất) trong khi vẫn đạt tốc độ Cache Hit 0ms cho các tài liệu đang làm việc.",
        ],
        takeaway:
          "Mọi bộ nhớ đệm (`Map` / `Object` cache) trong ứng dụng SPA bắt buộc phải có chiến lược trục xuất (**Eviction Policy**: LRU `maxSize`, TTL, hoặc `WeakMap`). Cache không giới hạn chính là Memory Leak hợp pháp hóa.",
      },
      en: {
        title: "Unbounded In-Memory Cache vs Bounded LRU & WeakMap",
        subtitle:
          "Preventing naive client-side memoization caches from turning into slow-burning memory bombs in long-lived SPA sessions",
        symptomSummary:
          "An SPA starts fast thanks to client caching, but after an hour of browsing hundreds of documents or customer profiles, tab memory balloons past 1GB.",
        rootCauseSummary:
          "Caching parsed payloads or computed results in an unbounded `new Map()` or module dictionary without an eviction policy (LRU max capacity or TTL).",
        symptoms: [
          "Heap usage grows monotonically with every unique item ID viewed during the user session.",
          "Items viewed hours ago remain pinned in memory indefinitely.",
        ],
        underTheHood: [
          "A standard JavaScript `Map` holds strong references to all keys and values forever unless explicitly deleted.",
          "An **O(1) LRU Cache** leverages JS `Map` insertion-order iteration: on `get(key)`, re-inserting the entry moves it to the most-recently-used tail; when `size > maxCapacity`, `map.keys().next().value` gives the oldest entry in `O(1)` time for immediate eviction.",
        ],
        solution: [
          "Replace unbounded `Map` caches with a bounded **O(1) LRU Cache** capped at a realistic working-set size (e.g., 20–50 items).",
          "When caching derived computations keyed by an object reference, use `WeakMap<ObjectKey, Result>` so cache entries are automatically garbage-collected when the source object is no longer referenced.",
        ],
        tradeoffs: [
          "Setting LRU capacity smaller than the user's active working set causes cache thrashing (frequent evictions and recomputations); tune capacity to match typical user navigation loops.",
        ],
        devtoolsSteps: [
          "In `Baseline` mode (Unbounded `Map`), click 'Run Stress Test' to browse 40 heavy documents: watch all 40 payloads accumulate in memory without bound.",
          "Switch to `Optimized` mode (Bounded LRU Cache, `max = 8`): browsing 40 documents keeps memory strictly capped at 8 entries while still serving repeat lookups in 0ms.",
        ],
        takeaway:
          "An unbounded cache in a long-lived SPA is a memory leak in disguise. Always enforce an explicit eviction policy (LRU max size, TTL, or `WeakMap`).",
      },
    },
    badCode: `// [Baseline] Unoptimized: Unbounded Map grows forever as user views more documents in the SPA
const documentCache = new Map<string, ParsedDocument>();

export function getParsedDocumentBad(docId: string, rawPayload: string) {
  if (!documentCache.has(docId)) {
    // Never evicted! After viewing 500 docs, all 500 stay in RAM.
    documentCache.set(docId, parseHeavyDocument(rawPayload));
  }
  return documentCache.get(docId)!;
}`,
    goodCode: `// [Optimized]: O(1) Bounded LRU Cache leveraging JS Map insertion order
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  constructor(private readonly maxEntries = 10) {}

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    const val = this.cache.get(key)!;
    // Refresh recency by re-inserting at the end
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) this.cache.delete(key);
    else if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}`,
  },
]
