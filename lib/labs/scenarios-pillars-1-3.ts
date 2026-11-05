import type { LabPatternMapping } from "./types"

type Pillars1To3Slug =
  | "rerender-storms"
  | "concurrent-react"
  | "dom-virtualization"
  | "long-tasks-yielding"
  | "web-workers-offload"
  | "layout-thrashing"
  | "detached-dom-leaks"
  | "closures-listeners-leaks"
  | "unbounded-cache-lru"

export const SCENARIOS_PILLARS_1_TO_3: Record<
  Pillars1To3Slug,
  { vi: LabPatternMapping; en: LabPatternMapping }
> = {
  "rerender-storms": {
    vi: {
      whenToApply: [
        "Khi một state thay đổi liên tục ở tần suất cao (con trỏ chuột, thanh trượt `range`, bộ đếm thời gian, ô input đang gõ, giá cổ phiếu) được đặt chung trong React Context hoặc ở Component cha cao nhất.",
        "Khi trên React DevTools Profiler xuất hiện hiện tượng 'Thác đổ màu vàng/cam' — hàng chục component con không liên quan cũng bị re-render theo dù props thực tế của chúng không đổi.",
        "Khi một form lớn (20-50 trường dữ liệu) hoặc trang Checkout bị trễ phím gõ (`INP > 150ms`) mỗi khi người dùng nhập vào 1 ô text bất kỳ.",
      ],
      whenNotToApply: [
        "State tần suất thấp (như `theme: dark/light`, `locale: vi/en`, thông tin `currentUser` sau khi đăng nhập) — dùng React Context thuần là hoàn toàn đủ và đơn giản.",
        "Cây UI nhỏ (< 20 component nhẹ) không có phép tính nặng: việc tách store quá sớm sẽ làm tăng độ phức tạp kiến trúc không cần thiết.",
      ],
      scenarios: [
        {
          domain: "Thiết kế Đồ họa / Figma / Canva Editor",
          title: "Kéo thả phần tử trên Canvas làm giật toàn bộ thanh Toolbar & Layers Panel",
          problem:
            "Đặt tọa độ `cursorX, cursorY` và `selectedNode` chung vào một `EditorContext`. Mỗi khi người dùng di chuột (60-120 lần/giây), toàn bộ 200+ mục trong cây Layers bên trái và bảng thuộc tính bên phải đều bị React chạy lại hàm render.",
          application:
            "Chuyển trạng thái tọa độ và danh sách node sang **Zustand Store**. Mỗi item trong cây Layers chỉ đăng ký atomic selector `useEditorStore(s => s.nodes[id].name)`, còn thanh trạng thái tọa độ tách thành một component nhỏ tự subscribe `s => s.cursor`.",
          outcome:
            "Khi kéo thả đối tượng ở 120Hz, chỉ đúng 1 node đang kéo và nhãn tọa độ được cập nhật; 200+ layer còn lại giữ nguyên 0 lần re-render.",
        },
        {
          domain: "E-Commerce / Trang Giỏ hàng & Thanh toán (Multi-step Checkout)",
          title: "Gõ địa chỉ giao hàng bị khựng phím vì render lại toàn bộ danh sách sản phẩm",
          problem:
            "Lưu cả `shippingAddress`, `couponCode`, `cartItems` (30 món hàng) và `paymentMethod` trong một `CheckoutContext` hoặc state của `CheckoutPage`. Gõ 1 ký tự vào ô 'Địa chỉ' khiến cả 30 thẻ `CartItemCard` và bảng tính thuế bị render lại.",
          application:
            "Áp dụng **State Colocation** (đẩy state nhập liệu xuống riêng form `ShippingAddressForm` hoặc dùng `react-hook-form` изолированно) kết hợp **Zustand `useShallow`** cho phần tổng tiền tóm tắt (`subtotal`, `tax`).",
          outcome:
            "Độ trễ gõ phím (`INP`) giảm từ ~140ms xuống < 12ms; danh sách sản phẩm trong giỏ không bao giờ bị re-render khi khách đang nhập địa chỉ.",
        },
        {
          domain: "Fintech / Dashboard Theo dõi Danh mục Đầu tư",
          title: "Nhấp nháy giá 1 mã cổ phiếu kéo theo cả bảng 50 mã cổ phiếu re-render",
          problem:
            "Truyền mảng `tickers` từ `PortfolioContext` xuống 50 thẻ `<StockCard />`. Khi WebSocket báo mã `FPT` tăng 100đ, mảng `tickers` tạo tham chiếu mới khiến cả 49 mã đứng yên cũng bị re-render.",
          application:
            "Chuẩn hóa dữ liệu trong Zustand thành dictionary `pricesBySymbol: Record<string, number>`. Mỗi `<StockCard symbol='FPT' />` chỉ subscribe đúng `useMarketStore(s => s.pricesBySymbol[symbol])`.",
          outcome:
            "Mã nào biến động giá thì chỉ đúng thẻ DOM của mã đó cập nhật, tiết kiệm 98% chi phí CPU Reconciliation.",
        },
        {
          domain: "SaaS / Quản lý Dự án (Jira / Linear Kanban Board)",
          title: "Mở/đóng bộ lọc hoặc gõ tìm kiếm nhanh làm đơ 150 thẻ công việc trên bảng",
          problem:
            "Gộp `searchText`, `activeModalId`, `hoveredTaskId` chung vào `BoardContext`. Rê chuột qua từng thẻ task làm `hoveredTaskId` đổi liên tục và kích hoạt re-render toàn bộ các cột `Todo`, `In Progress`, `Done`.",
          application:
            "Tách trạng thái UI tạm thời (`hoveredTaskId`, `searchText`) ra khỏi dữ liệu cột. Dùng atomic selector theo từng `taskId` hoặc xử lý hiệu ứng hover bằng CSS thuần (`group-hover:`) thay vì React state.",
          outcome:
            "Thao tác rê chuột và mở popup chi tiết task mượt 60 FPS tức thì ngay cả trên bảng có hàng trăm ticket.",
        },
      ],
    },
    en: {
      whenToApply: [
        "When high-frequency state (mouse coordinates, range sliders, timers, live text inputs, ticker prices) lives inside a shared React Context or top-level parent component.",
        "When React DevTools Profiler shows a full-tree flamegraph cascade where dozens of unrelated child components re-render despite unchanged props.",
        "When a large form (20-50 fields) or Checkout page suffers from typing lag (`INP > 150ms`) on every keystroke.",
      ],
      whenNotToApply: [
        "Low-frequency global state (`theme: dark/light`, `locale: vi/en`, authenticated `currentUser`) — standard React Context is completely fine.",
        "Small component trees (< 20 lightweight nodes) with trivial render cost where external store abstractions add unnecessary boilerplate.",
      ],
      scenarios: [
        {
          domain: "Design Tool / Figma / Canva Canvas Editor",
          title: "Dragging a canvas shape freezes the Layers Panel and Inspector Toolbar",
          problem:
            "Storing `cursorX, cursorY` and `selectedNode` in a single `EditorContext`. Moving the mouse (60-120Hz) forces all 200+ items in the left Layers tree and right Inspector panel to re-render.",
          application:
            "Move state to a **Zustand Store**. Each layer row subscribes via an atomic selector `useEditorStore(s => s.nodes[id].name)`, while the coordinate readout is isolated in its own leaf component subscribing to `s => s.cursor`.",
          outcome:
            "Dragging shapes at 120Hz updates only the active node and coordinate readout; the 200+ layer rows record 0 re-renders.",
        },
        {
          domain: "E-Commerce / Multi-step Checkout & Cart",
          title: "Typing a shipping address lags because 30 cart items re-render on every keystroke",
          problem:
            "Holding `shippingAddress`, `couponCode`, and `cartItems` in one monolithic `CheckoutContext`. Typing one character into the street input re-renders all 30 `<CartItemCard />` components.",
          application:
            "Apply **State Colocation** (isolate address input state inside `<ShippingAddressForm />`) and use **Zustand `useShallow`** for the order summary totals.",
          outcome:
            "Typing latency (`INP`) drops from ~140ms to < 12ms with zero cart list re-renders during form entry.",
        },
        {
          domain: "Fintech / Live Portfolio Watchlist",
          title: "A single stock tick triggers a full re-render of all 50 watchlist cards",
          problem:
            "Passing an array of `tickers` through React Context. When one symbol updates via WebSocket, the new array reference causes all 49 unchanged `<StockCard />` components to re-render.",
          application:
            "Normalize store state into `pricesBySymbol: Record<string, number>` and let each `<StockCard symbol={sym} />` subscribe atomically to `useMarketStore(s => s.pricesBySymbol[sym])`.",
          outcome:
            "Only the specific card whose price changed re-renders, eliminating 98% of wasted React reconciliation work.",
        },
        {
          domain: "SaaS / Kanban Board (Jira / Linear)",
          title: "Hovering over cards or opening a quick filter re-renders every column",
          problem:
            "Storing `hoveredTaskId` and `filterQuery` in `BoardContext`. Moving the pointer across cards continuously mutates context and re-renders `Todo`, `In Progress`, and `Done` columns.",
          application:
            "Colocate transient UI state or subscribe per-card via atomic selectors, and replace JS hover state with CSS `group-hover:` where possible.",
          outcome:
            "Pointer movement and modal interactions stay locked at 60 FPS even on boards with hundreds of issues.",
        },
      ],
    },
  },

  "concurrent-react": {
    vi: {
      whenToApply: [
        "Khi một thao tác của người dùng (gõ phím, chuyển tab, bấm chọn filter) vừa cần phản hồi thị giác ngay lập tức (< 16ms), vừa kéo theo việc render lại một cây UI rất nặng (danh sách lớn, biểu đồ SVG phức tạp).",
        "Khi bạn đã debounce input nhưng vẫn thấy hiện tượng 'đứng hình 200-400ms' ngay tại thời điểm hàm debounce thực thi.",
        "Khi chuyển tab có nhiều component con tốn CPU khiến nút Tab không sáng lên ngay khi click (chỉ số `INP` báo đỏ > 200ms).",
      ],
      whenNotToApply: [
        "Khi tác vụ nặng là **vòng lặp tính toán JS thuần túy trong 1 hàm duy nhất** (ví dụ `JSON.parse` 50MB, mã hóa file, xử lý ảnh) — `startTransition` chỉ cắt nhỏ được việc render các React Fiber, KHÔNG cắt nhỏ được 1 hàm JS thuần (hãy dùng Web Worker hoặc `scheduler.yield()` ở Lab 2.1/2.2).",
        "Không bọc trực tiếp state điều khiển giá trị của ô `<input value={text} />` vào trong `startTransition` (vì ô input cần cập nhật đồng bộ tức thì).",
      ],
      scenarios: [
        {
          domain: "E-Commerce / Bộ lọc Sản phẩm Đa chiều (Faceted Search)",
          title: "Tick chọn bộ lọc 'Thương hiệu / Khoảng giá' làm checkbox bị đơ 300ms mới hiện dấu tick",
          problem:
            "Khi khách click vào checkbox lọc sản phẩm, React gộp chung việc vẽ dấu tick trên checkbox và việc lọc + render lại 800 thẻ sản phẩm cùng biểu đồ giá vào 1 lần render đồng bộ duy nhất.",
          application:
            "Cập nhật trạng thái dấu tick của checkbox bằng `setSelectedBrands` bình thường (Urgent update), và bọc việc cập nhật bộ lọc danh sách sản phẩm trong `startTransition(() => setAppliedFilters(next))` hoặc dùng `useDeferredValue(selectedBrands)`.",
          outcome:
            "Checkbox hiện dấu tick ngay lập tức ở frame kế tiếp (< 8ms), trong khi danh sách sản phẩm render ngầm trên nền có thể hủy ngang nếu khách bấm tiếp checkbox thứ 2.",
        },
        {
          domain: "BI & Analytics / Chuyển đổi Tab Báo cáo Doanh thu",
          title: "Click chuyển từ Tab 'Tổng quan' sang Tab 'Phễu Chuyển đổi' bị treo cứng thanh điều hướng",
          problem:
            "Tab 'Phễu Chuyển đổi' chứa 6 biểu đồ Recharts/SVG phức tạp mất 250ms để mount. Nếu chuyển tab đồng bộ, người dùng bấm xong thấy giao diện đứng im không phản hồi, tưởng chưa ăn click nên bấm liên tục.",
          application:
            "Bọc `setActiveTab(nextTab)` trong `useTransition()`. Hiển thị ngay trạng thái active trên thanh Tab cùng chỉ báo nhẹ `isPending` trong khi React chuẩn bị cây Fiber của Tab mới ở chế độ interruptible.",
          outcome:
            "Thanh Tab phản hồi tức thì khi click; nếu người dùng đổi ý bấm sang Tab thứ 3 ngay lập tức, React tự động hủy bỏ việc render Tab 2 đang dang dở.",
        },
        {
          domain: "Developer Tools / Trình soạn thảo Markdown & Live Preview",
          title: "Gõ văn bản dài vào khung soạn thảo bị trễ chữ vì khung Preview bên phải phải parse AST + Highlight code",
          problem:
            "Mỗi phím gõ vào `<textarea>` đều bắt khung `<MarkdownPreview text={text} />` chạy lại bộ phân tích cú pháp và render hàng trăm thẻ DOM ngay trong cùng 1 sự kiện `onChange`.",
          application:
            "Truyền `const deferredText = useDeferredValue(text)` vào `<MarkdownPreview text={deferredText} />` và bọc `MarkdownPreview` bằng `React.memo`.",
          outcome:
            "Khung gõ chữ mượt tuyệt đối ở 60 FPS dù gõ nhanh liên tục; khung Preview tự động cập nhật mượt mà ngay khi ngón tay ngừng gõ vài mili-giây.",
        },
        {
          domain: "SaaS CRM / Tìm kiếm Khách hàng Kèm Biểu đồ Phân bổ",
          title: "Gõ tên khách hàng làm giật con trỏ input vì biểu đồ thống kê bên trên tính toán lại",
          problem:
            "Ô tìm kiếm vừa lọc bảng danh sách khách hàng vừa cập nhật 4 biểu đồ tròn (Pie/Bar Chart) tổng hợp theo vùng miền.",
          application:
            "Giữ state `searchInput` ở mức ưu tiên cao (`SyncLane`) cho ô `<input>`, dùng `useDeferredValue(searchInput)` cho phần tính toán dữ liệu biểu đồ và danh sách kết quả.",
          outcome:
            "Loại bỏ hoàn toàn hiện tượng nuốt phím hoặc khựng con trỏ chuột khi gõ nhanh.",
        },
      ],
    },
    en: {
      whenToApply: [
        "When a user interaction (typing, switching tabs, toggling filters) requires immediate visual feedback (< 16ms) but also triggers an expensive React subtree render.",
        "When debouncing input still causes a noticeable 200-400ms UI freeze at the exact moment the debounce timer fires.",
        "When switching between complex tabs causes the tab button itself to feel unresponsive (`INP > 200ms`).",
      ],
      whenNotToApply: [
        "When the bottleneck is a **single monolithic synchronous JS computation** (e.g., parsing a 50MB JSON string or image processing) — `startTransition` only slices React Fiber rendering across 5ms chunks, not arbitrary JS loops (use Web Workers or `scheduler.yield()` in Labs 2.1/2.2).",
        "Never wrap controlled `<input value={text} />` state updates directly inside `startTransition`.",
      ],
      scenarios: [
        {
          domain: "E-Commerce / Faceted Product Filtering",
          title: "Clicking a brand filter checkbox freezes for 300ms before the checkmark appears",
          problem:
            "React batches the checkbox state update together with re-rendering 800 product cards and price histograms in a single synchronous commit.",
          application:
            "Update the checkbox state urgently (`setSelectedBrands`), and defer the product grid update via `startTransition(() => setAppliedFilters(next))` or `useDeferredValue`.",
          outcome:
            "The checkbox ticks immediately (< 8ms), while the heavy product grid renders in interruptible 5ms background slices.",
        },
        {
          domain: "BI & Analytics / Heavy Dashboard Tab Switching",
          title: "Clicking the 'Conversion Funnel' tab freezes the entire navigation bar",
          problem:
            "Mounting 6 complex SVG charts takes 250ms synchronously, blocking the browser from painting the active tab state.",
          application:
            "Wrap `setActiveTab(nextTab)` inside `useTransition()`. Highlight the selected tab and show a subtle `isPending` indicator while React prepares the new tab subtree in the background.",
          outcome:
            "Tab navigation responds instantly; if the user clicks another tab mid-render, React aborts the stale work immediately.",
        },
        {
          domain: "Developer Tools / Live Markdown & Code Previewer",
          title: "Typing in the editor lags because the right-hand preview pane re-parses AST on every keystroke",
          problem:
            "Every `onChange` event forces `<MarkdownPreview />` to synchronously re-render hundreds of formatted DOM nodes.",
          application:
            "Pass `const deferredText = useDeferredValue(text)` into a memoized `<MarkdownPreview text={deferredText} />`.",
          outcome:
            "Typing stays at a locked 60 FPS while the preview pane updates smoothly between keystrokes.",
        },
        {
          domain: "SaaS CRM / Live Search with Aggregated Charts",
          title: "Searching contacts stutters the input cursor due to live chart recalculations",
          problem:
            "Filtering contacts simultaneously re-renders 4 regional breakdown charts on every character typed.",
          application:
            "Keep `searchInput` synchronous for the `<input>` element and derive chart/table props from `useDeferredValue(searchInput)`.",
          outcome:
            "Zero input lag or dropped frames during rapid typing.",
        },
      ],
    },
  },

  "dom-virtualization": {
    vi: {
      whenToApply: [
        "Khi cần hiển thị danh sách, bảng dữ liệu, log console, hoặc lưới ảnh có từ **> 200 phần tử phức tạp** hoặc **> 500 phần tử đơn giản** trên cùng một vùng cuộn (scroll container).",
        "Khi Chrome DevTools báo cảnh báo `Avoid an excessive DOM size` (> 1,500 DOM nodes) và thời gian **Style / Layout (Reflow)** vọt lên hàng chục mili-giây mỗi khi trang thay đổi kích thước hoặc mở sidebar.",
        "Khi làm tính năng Infinite Scroll (cuộn vô tận) mà càng cuộn xuống sâu trang web càng nặng và ngốn hàng trăm MB RAM.",
      ],
      whenNotToApply: [
        "Danh sách ngắn (< 100 dòng) hoặc các trang bài viết chuẩn SEO cần Googlebot đọc toàn bộ nội dung HTML tĩnh ngay khi tải trang mà không có phân trang.",
        "Khi bạn có thể dùng phân trang truyền thống (Server-side Pagination 20-50 dòng/trang) phù hợp với nghiệp vụ hơn là cuộn hàng vạn dòng.",
      ],
      scenarios: [
        {
          domain: "Cloud / DevOps / Bảng Theo dõi Server Logs (Datadog / Vercel Logs)",
          title: "Hiển thị 20,000 dòng log triển khai (Build/Runtime Logs) có độ cao dòng thay đổi (Dynamic Row Height)",
          problem:
            "Render trực tiếp 20,000 thẻ `<div className='log-line'>` tạo ra hơn 120,000 DOM nodes, làm đơ trình duyệt 1.8 giây lúc mở trang và tụt FPS xuống < 15 khi cuộn chuột.",
          application:
            "Sử dụng `@tanstack/react-virtual` (`useVirtualizer`) với `measureElement` để đo tự động các dòng log bị xuống dòng (`word-wrap`), kết hợp `overscan: 10`.",
          outcome:
            "DOM thực tế luôn cố định ở mức ~35 dòng (~200 DOM nodes); cuộn xuyên suốt 20,000 dòng mượt 60 FPS và tiết kiệm 85% bộ nhớ Heap.",
        },
        {
          domain: "Ứng dụng Nhắn tin / Slack / Discord / AI Chat History",
          title: "Cuộn ngược lịch sử hàng ngàn tin nhắn có kèm khối code, ảnh và hộp thoại dài ngắn khác nhau",
          problem:
            "Trong phòng chat hoạt động liên tục cả ngày, số lượng tin nhắn lên tới 5,000+. Nếu giữ nguyên toàn bộ trong DOM, mọi thao tác mở emoji picker hay gõ tin nhắn mới đều gây Recalculate Style lên toàn bộ 5,000 tin nhắn cũ.",
          application:
            "Áp dụng Virtualized Scroll Container giữ vị trí neo ở đáy (`scrollToIndex(count - 1)`) và chỉ mount các bong bóng chat nằm trong vùng nhìn thấy (`viewport`).",
          outcome:
            "Phòng chat mở tức thì trong < 30ms và giữ nguyên tốc độ phản hồi như lúc mới có 10 tin nhắn.",
        },
        {
          domain: "B2B SaaS / Dropdown / Combobox Chọn Mã Hàng Hóa (SKU Selector)",
          title: "Bấm mở ô Select chứa 8,000 mã sản phẩm (SKU) hoặc danh mục tỉnh/huyện/xã làm đứng trang 1 giây",
          problem:
            "Nhiều hệ thống ERP/POS nạp toàn bộ 8,000 thẻ `<SelectItem>` vào bên trong `<Popover>` ngay khi người dùng bấm mở dropdown.",
          application:
            "Kết hợp `<Command>` / `<Popover>` của shadcn với `useVirtualizer` bên trong danh sách kết quả để chỉ render 12 mục đang hiển thị trong khung 300px của dropdown.",
          outcome:
            "Dropdown 8,000 mã SKU bật lên ngay lập tức ở 0ms độ trễ cảm nhận.",
        },
        {
          domain: "Social Media / E-Commerce Infinite Product Feed",
          title: "Lướt bảng tin sản phẩm (Infinite Scroll) đến sản phẩm thứ 500 trên điện thoại làm trình duyệt tự crash (Out of Memory)",
          problem:
            "Mỗi lần cuộn chạm đáy lại nối thêm (`append`) 40 thẻ sản phẩm có ảnh độ phân giải cao vào mảng DOM hiện tại mà không thu hồi các thẻ đã cuộn qua ở phía trên.",
          application:
            "Dùng Window Virtualization (`useWindowVirtualizer`) để tự động unmount các hàng sản phẩm đã cuộn khuất khỏi màn hình phía trên và chỉ giữ lại chiều cao giả lập bằng `transform: translateY()`.",
          outcome:
            "Người dùng có thể lướt qua 10,000 sản phẩm liên tục trên thiết bị di động mà mức tiêu thụ RAM vẫn giữ phẳng.",
        },
      ],
    },
    en: {
      whenToApply: [
        "When rendering lists, data tables, log viewers, or media grids with **> 200 complex items** or **> 500 simple rows** inside a scroll container.",
        "When Lighthouse flags `Avoid an excessive DOM size` (> 1,500 DOM nodes) and Chrome DevTools shows expensive **Recalculate Style / Layout** passes whenever the viewport or sidebar resizes.",
        "When building Infinite Scroll feeds that progressively consume more RAM and degrade FPS the further the user scrolls.",
      ],
      whenNotToApply: [
        "Short lists (< 100 items) or SEO-critical editorial lists where search crawlers require all static HTML links in the initial document.",
        "When standard server-side pagination (20-50 rows per page) better fits the user's workflow.",
      ],
      scenarios: [
        {
          domain: "Cloud / DevOps / Live Log Viewer (Datadog / Vercel Logs)",
          title: "Rendering 20,000 build/runtime log lines with variable multi-line wrapping",
          problem:
            "Mounting 20,000 `<div className='log-line'>` elements creates 120,000+ DOM nodes, freezing initial mount for 1.8s and dropping scroll FPS below 15.",
          application:
            "Use `@tanstack/react-virtual` (`useVirtualizer`) with dynamic `measureElement` ref callbacks and `overscan: 10`.",
          outcome:
            "Only ~35 visible log lines (~200 DOM nodes) exist in the DOM at any moment; scrolling 20,000 lines stays locked at 60 FPS.",
        },
        {
          domain: "Messaging & AI Chat / Slack / Discord History",
          title: "Scrolling through 5,000+ chat messages containing code blocks and media cards",
          problem:
            "Keeping thousands of rich message bubbles mounted causes every emoji picker toggle or input resize to trigger a full-document Style & Layout recalculation.",
          application:
            "Virtualize the message viewport with bottom-anchored scroll positioning so only messages near the viewport remain mounted.",
          outcome:
            "Chat rooms with 10,000 messages open in < 30ms with constant memory usage.",
        },
        {
          domain: "B2B ERP / POS / 8,000-Item SKU Combobox Dropdown",
          title: "Opening a product SKU selector dropdown freezes the UI for 1 second",
          problem:
            "Mounting all 8,000 `<CommandItem>` nodes inside a popover menu whenever the user clicks the trigger button.",
          application:
            "Wrap the inner scroll list of the `<Command>` / `<Popover>` with `useVirtualizer` so only the ~12 visible items inside the 300px menu height are rendered.",
          outcome:
            "The 8,000-item dropdown opens instantaneously with zero main-thread spike.",
        },
        {
          domain: "E-Commerce / Mobile Infinite Scroll Product Feed",
          title: "Scrolling past 500 high-res product cards crashes mobile Safari due to memory pressure",
          problem:
            "Appending page after page of DOM nodes and decoded bitmap images without unmounting offscreen items.",
          application:
            "Use `useWindowVirtualizer` to recycle offscreen product rows while maintaining exact scroll scrollbar geometry via `translateY` offsets.",
          outcome:
            "Users can browse thousands of products on mobile devices with flat DOM node count and stable Heap memory.",
        },
      ],
    },
  },

  "long-tasks-yielding": {
    vi: {
      whenToApply: [
        "Khi bạn phải chạy một vòng lặp xử lý mảng lớn trên Client (kiểm tra hợp lệ 5,000 dòng Excel khi import, tính toán biểu đồ, khởi tạo hàng loạt module) mất tổng cộng **> 50ms** (ngưỡng định nghĩa Long Task của W3C).",
        "Khi người dùng bấm nút 'Xử lý / Áp dụng' rồi bấm ngay nút 'Hủy' hoặc gõ vào ô tìm kiếm nhưng trình duyệt bị treo cứng không nhận sự kiện click tiếp theo (`INP > 200ms`, `TBT` cao).",
        "Khi tác vụ cần truy cập vào các đối tượng trên Main Thread (hoặc khó đóng gói sang Web Worker) nhưng vẫn cần giữ cho giao diện phản hồi mượt.",
      ],
      whenNotToApply: [
        "Khi thuật toán nặng hoàn toàn độc lập với DOM và kéo dài nhiều giây (như nén video, parse CSV 100MB, chạy mô hình AI/WASM) — trường hợp đó nên đẩy hẳn sang **Web Worker** (Lab 2.2) để không tốn dù chỉ 5ms mỗi nhịp trên Main Thread.",
        "Tác vụ siêu nhẹ (< 5ms) — việc gọi `await scheduler.yield()` cho mọi phần tử nhỏ lẻ sẽ làm tăng overhead lập lịch không cần thiết (chỉ nên yield định kỳ mỗi 4-8ms).",
      ],
      scenarios: [
        {
          domain: "B2B SaaS / Kế toán / Import & Validate File Excel 10,000 Dòng",
          title: "Kiểm tra định dạng mã số thuế, email, công nợ cho 10,000 dòng dữ liệu ngay trên trình duyệt",
          problem:
            "Chạy vòng lặp `for` đồng bộ qua 10,000 dòng mất 450ms liên tục. Trong 450ms đó, thanh Progress Bar đứng im ở 0% rồi nhảy vọt lên 100%, và nút 'Hủy Import' bị liệt hoàn toàn.",
          application:
            "Kiểm tra `performance.now() - sliceStart >= 5` trong vòng lặp; mỗi khi chạm ngưỡng 5ms thì gọi `await scheduler.yield()` (hoặc fallback `MessageChannel`) để trình duyệt kịp vẽ thanh Progress Bar và nhận sự kiện bấm nút 'Hủy'.",
          outcome:
            "Thanh Progress Bar chạy mượt 60 FPS từ 1% đến 100%, nút 'Hủy' ăn click ngay lập tức (< 16ms), và `TBT` giảm về 0ms.",
        },
        {
          domain: "Ứng dụng Web / Khởi tạo Hàng loạt Plugin & Analytics lúc Bootstrap",
          title: "Hàm khởi động ứng dụng gọi liên tiếp 8 công việc: đọc localStorage, giải mã cache, khởi tạo i18n, gắn telemetry",
          problem:
            "Gom cả 8 bước khởi tạo vào 1 hàm đồng bộ duy nhất tạo ra một Long Task 180ms ngay lúc trang vừa hydrate xong, làm đơ cú click đầu tiên của người dùng.",
          application:
            "Chèn điểm nhường luồng (`await yieldToMain()`) giữa các bước khởi tạo không khẩn cấp để ưu tiên xử lý thao tác click/cuộn trang sớm của người dùng trước.",
          outcome:
            "Cải thiện trực tiếp điểm số Core Web Vitals `TBT` (Total Blocking Time) và `INP` ngay khi vừa mở trang.",
        },
        {
          domain: "EdTech / Hệ thống Chấm bài Thi Trực tuyến & So khớp Văn bản",
          title: "Chấm điểm và tô màu lỗi ngữ pháp cho bài luận 5,000 từ theo thời gian thực",
          problem:
            "Chạy bộ quy tắc 150 biểu thức chính quy (Regex) lên toàn bộ văn bản trong một lần chạy đồng bộ làm con trỏ soạn thảo bị giật cục.",
          application:
            "Chia danh sách 150 quy tắc kiểm tra thành từng lô (batch) 5ms và dùng `scheduler.yield()` kèm biến cờ hủy (`AbortController`) nếu học sinh gõ thêm chữ mới.",
          outcome:
            "Gõ bài luận mượt mà không bao giờ bị khựng phím, kết quả kiểm tra lỗi hiện dần ngay bên dưới.",
        },
        {
          domain: "E-Commerce / Tính toán Khuyến mãi Chồng chéo (Cart Rule Engine)",
          title: "Áp dụng 120 điều kiện voucher & combo giảm giá cho giỏ hàng sỉ B2B (200 mặt hàng)",
          problem:
            "Mỗi khi khách hàng tăng/giảm số lượng sản phẩm, bộ máy tính khuyến mãi chạy đồng bộ 120ms làm nút `+` / `-` bị khựng.",
          application:
            "Chia nhỏ vòng lặp đánh giá rule khuyến mãi bằng Cooperative Yielding mỗi 5ms để giao diện cập nhật số lượng ngay lập tức trước khi hiển thị giá sau chiết khấu.",
          outcome:
            "Nút tăng/giảm số lượng phản hồi tức thì ở < 10ms `INP`.",
        },
      ],
    },
    en: {
      whenToApply: [
        "When executing client-side loops over large datasets (validating 5,000 imported spreadsheet rows, computing aggregates, bootstrapping subsystems) that take **> 50ms** in total.",
        "When clicking 'Process / Apply' prevents the user from clicking 'Cancel' or typing into an input because the main thread is locked (`INP > 200ms`, high `TBT`).",
        "When a task requires convenient access to main-thread state or closures without spinning up a dedicated Web Worker.",
      ],
      whenNotToApply: [
        "Multi-second CPU-bound number crunching (video encoding, parsing 100MB CSVs, WASM/AI inference) — offload those completely to a **Web Worker** (Lab 2.2) so they consume 0ms on the main thread.",
        "Micro-operations taking < 5ms total — yielding on every single array item adds scheduling overhead; always batch by a ~4-5ms time budget (`performance.now() - start >= 5`).",
      ],
      scenarios: [
        {
          domain: "B2B SaaS / Accounting / Client-Side Excel Import & Validation (10,000 Rows)",
          title: "Validating tax IDs, emails, and ledger balances across 10,000 spreadsheet rows",
          problem:
            "A synchronous `for` loop runs for 450ms straight. The progress bar freezes at 0% then jumps to 100%, and the 'Cancel Import' button is completely unresponsive.",
          application:
            "Check `performance.now() - sliceStart >= 5` inside the loop; whenever 5ms elapses, `await scheduler.yield()` so the browser can paint the progress bar and dispatch pending click events.",
          outcome:
            "The progress bar animates at 60 FPS, the Cancel button responds in < 16ms, and `TBT` drops to 0ms.",
        },
        {
          domain: "Web App Bootstrap / Sequential Initialization Pipeline",
          title: "Running 8 startup tasks (cache hydration, feature flags, analytics, i18n) in one block",
          problem:
            "Combining all startup tasks into one synchronous function creates a 180ms Long Task right after hydration, delaying the user's first interaction.",
          application:
            "Insert `await yieldToMain()` checkpoints between non-critical initialization steps so user input events take priority.",
          outcome:
            "Dramatically reduces Total Blocking Time (`TBT`) and early page-load `INP`.",
        },
        {
          domain: "EdTech / Live Essay Grammar & Plagiarism Checker",
          title: "Running 150 regex lint rules across a 5,000-word document",
          problem:
            "Executing all 150 rules synchronously freezes the text cursor while the student is typing.",
          application:
            "Evaluate lint rules in 5ms time-sliced batches with `scheduler.yield()` and abort the current pass if a new keystroke arrives.",
          outcome:
            "Zero cursor stutter during typing with progressive lint underlines.",
        },
        {
          domain: "B2B E-Commerce / Wholesale Cart Promotion Rule Engine",
          title: "Evaluating 120 combinational discount rules across a 200-SKU wholesale order",
          problem:
            "Clicking the quantity `+` / `-` button blocks for 120ms while promotion tiers recalculate synchronously.",
          application:
            "Yield every 5ms during rule evaluation so the button press and quantity badge paint on the very next frame.",
          outcome:
            "Quantity steppers respond in < 10ms `INP`.",
        },
      ],
    },
  },

  "web-workers-offload": {
    vi: {
      whenToApply: [
        "Khi ứng dụng phải thực hiện các tác vụ **thuần tính toán CPU hoặc xử lý dữ liệu lớn** (parse/xuất CSV/Excel/JSON lớn, tìm kiếm Fuzzy Search trên 50,000 bản ghi, nén/resize ảnh trên Canvas, mã hóa Cryptography, parse AST/Markdown/PDF).",
        "Khi bạn cần giữ cho các hiệu ứng chuyển động, video, hoặc thao tác kéo thả trên Main Thread đạt chuẩn **60-120 FPS tuyệt đối** mà không bị bất kỳ khung hình nào rớt nhịp.",
        "Khi xử lý dữ liệu nhị phân lớn (`ArrayBuffer`, `Uint8Array`, `ImageBitmap`) có thể chuyển quyền sở hữu zero-copy qua `Transferable Objects`.",
      ],
      whenNotToApply: [
        "Tác vụ cần đọc/ghi trực tiếp cây DOM (Web Worker không có quyền truy cập `document` hay `window`).",
        "Dữ liệu đầu vào rất nhỏ (< 50KB) nhưng bạn lại `postMessage` một object phức tạp hàng nghìn lần/giây mà không dùng `Transferable` — chi phí clone dữ liệu (`Structured Clone`) có thể lớn hơn cả thời gian tính toán.",
      ],
      scenarios: [
        {
          domain: "SaaS / ERP / Xuất và Đọc File Báo cáo CSV / Excel 100,000 Dòng",
          title: "Bấm nút 'Xuất Báo cáo Excel' làm đơ toàn bộ trình duyệt suốt 3 giây kèm cảnh báo 'Page Unresponsive'",
          problem:
            "Hàm chuyển đổi 100,000 bản ghi JSON sang định dạng CSV/XLSX và nén ZIP chạy trực tiếp trên Main Thread, khóa cứng toàn bộ giao diện.",
          application:
            "Đẩy toàn bộ logic tạo file và nén dữ liệu sang **Web Worker**. Khi hoàn tất, Worker trả về `ArrayBuffer` qua cơ chế **Transferable Objects** (`postMessage(buffer, [buffer])`, tốn 0ms copy) hoặc tạo `Blob URL` để tải xuống.",
          outcome:
            "Main Thread tốn đúng 0ms CPU; người dùng vẫn chuyển tab, cuộn bảng và thao tác bình thường ở 60 FPS trong lúc file 50MB đang được đóng gói ngầm.",
        },
        {
          domain: "E-Commerce / Mạng xã hội / Nén & Cắt Ảnh Avatar / Sản phẩm trước khi Upload",
          title: "Chọn 10 ảnh chụp từ điện thoại (mỗi ảnh 8MB, 4000x3000px) để nén xuống WebP làm đứng cứng vòng xoay Loading",
          problem:
            "Dùng thẻ `<canvas>` trên Main Thread và gọi `canvas.toBlob('image/webp')` khiến luồng chính bị khóa cứng trong lúc giải mã và mã hóa pixel.",
          application:
            "Sử dụng **`OffscreenCanvas`** bên trong Web Worker kết hợp `createImageBitmap(file)` để resize và nén sang định dạng WebP hoàn toàn trên luồng phụ.",
          outcome:
            "Vòng xoay loading và thanh tiến trình upload mượt tuyệt đối; dung lượng ảnh giảm 85% trước khi gửi lên server mà không gây lag UI.",
        },
        {
          domain: "Documentation / IDE / Tìm kiếm Toàn văn (Client-side Full-Text & Fuzzy Search)",
          title: "Tìm kiếm tức thì (Command+K) trên 30,000 tài liệu / sản phẩm lưu offline trong IndexedDB",
          problem:
            "Chạy thuật toán tính điểm khớp chuỗi (Levenshtein / Fuzzy Matching) và sắp xếp 30,000 bản ghi trên Main Thread mất 160ms mỗi lần gõ phím.",
          application:
            "Khởi tạo chỉ mục tìm kiếm (Search Index) nằm thường trực bên trong một Web Worker. Khi người dùng gõ vào hộp thoại `Command+K`, Main Thread chỉ gửi chuỗi truy vấn (`20 bytes`) sang Worker và nhận về đúng 15 kết quả đầu bảng.",
          outcome:
            "Thời gian tính toán trên Main Thread giảm xuống < 1ms; hộp thoại Command Palette phản hồi tức thì ở 120 FPS.",
        },
        {
          domain: "Fintech / Bảo mật / Mã hóa End-to-End (E2EE) Tin nhắn & Tài liệu",
          title: "Giải mã hàng loạt tin nhắn lịch sử hoặc ký số file hợp đồng PDF trên trình duyệt",
          problem:
            "Các phép toán băm (PBKDF2 / SHA-256) và giải mã AES-GCM trên hàng trăm bản ghi làm giật giao diện khi mới mở cuộc trò chuyện.",
          application:
            "Thực thi Web Crypto API + giải mã hàng loạt trong Web Worker và trả kết quả về theo từng khung nhìn hiển thị.",
          outcome:
            "Giao diện mở tức thì, không còn hiện tượng treo trang khi tải khóa bảo mật.",
        },
      ],
    },
    en: {
      whenToApply: [
        "When executing **CPU-intensive or large-dataset operations** (parsing/exporting large CSV/Excel/JSON files, fuzzy searching 50,000+ records, image resizing/compression, cryptography, AST/PDF parsing).",
        "When animations, video playback, or canvas interactions on the Main Thread must remain at a rock-solid **60-120 FPS** with zero dropped frames.",
        "When processing large binary payloads (`ArrayBuffer`, `Uint8Array`, `ImageBitmap`) that can be transferred with zero copy overhead via `Transferable Objects`.",
      ],
      whenNotToApply: [
        "Tasks that directly mutate or measure DOM elements (Web Workers cannot access `document` or `window`).",
        "Tiny payloads (< 50KB) where `Structured Clone` serialization overhead across `postMessage` exceeds the actual computation time.",
      ],
      scenarios: [
        {
          domain: "SaaS / ERP / Exporting 100,000-Row CSV / Excel Reports",
          title: "Clicking 'Export Report' freezes the browser tab for 3 seconds",
          problem:
            "Serializing 100,000 JSON records into CSV/XLSX and zipping them on the Main Thread blocks all user interactions and animations.",
          application:
            "Run report generation inside a **Web Worker** and return the resulting `ArrayBuffer` using **Transferable Objects** (`postMessage(buffer, [buffer])`) for zero-copy handoff.",
          outcome:
            "0ms Main Thread blocking; users can continue browsing and interacting at 60 FPS while the 50MB file builds in the background.",
        },
        {
          domain: "E-Commerce / Social Media / Client-Side Image Resizing & WebP Compression",
          title: "Selecting 10 high-res camera photos (8MB each) freezes the upload spinner",
          problem:
            "Drawing 4000x3000px images onto a main-thread `<canvas>` and calling `toBlob('image/webp')` locks the UI thread during pixel encoding.",
          application:
            "Transfer `ImageBitmap` objects to a Web Worker using **`OffscreenCanvas`** and `convertToBlob({ type: 'image/webp' })`.",
          outcome:
            "Upload animations stay silky smooth while images are compressed by 85% off the main thread.",
        },
        {
          domain: "Documentation / E-Commerce / Command+K Fuzzy Search over 30,000 Items",
          title: "Fuzzy-searching 30,000 cached products or docs blocks every keystroke for 160ms",
          problem:
            "Running string-distance scoring and sorting across 30,000 objects on the Main Thread stalls the search input.",
          application:
            "Keep the search index inside a dedicated Web Worker. Send only the short query string (`20 bytes`) from the Main Thread and receive back only the top 15 matched items.",
          outcome:
            "Main Thread work drops to < 1ms per keystroke with 120 FPS Command Palette responsiveness.",
        },
        {
          domain: "Fintech / Security / End-to-End Encryption (E2EE) Document Signing",
          title: "Decrypting message batches or hashing large PDF contracts freezes the app",
          problem:
            "Running PBKDF2 key derivation and bulk payload decryption on the Main Thread stalls UI rendering.",
          application:
            "Offload crypto pipelines and buffer transformations to a background Worker thread.",
          outcome:
            "Zero UI jank during cryptographic verification and decryption.",
        },
      ],
    },
  },

  "layout-thrashing": {
    vi: {
      whenToApply: [
        "Khi bạn cần đo kích thước/tọa độ thực tế của nhiều phần tử DOM (`offsetWidth`, `offsetHeight`, `scrollTop`, `getBoundingClientRect()`, `getComputedStyle()`) rồi cập nhật lại vị trí/kích thước của chúng.",
        "Khi trên Chrome DevTools Performance xuất hiện các khối màu tím **Layout (Reflow)** kèm tam giác đỏ ở góc trên cùng với cảnh báo **'Forced reflow is a likely performance bottleneck'**.",
        "Khi làm các hiệu ứng chuyển động, kéo thả, phóng to/thu nhỏ, hoặc đồng bộ cuộn giữa nhiều cột mà bị giật khung hình.",
      ],
      whenNotToApply: [
        "Khi bài toán bố cục hoàn toàn có thể giải quyết bằng **CSS thuần** (`display: grid`, `flexbox`, `container-type: inline-size`, `position: sticky`, hoặc `CSS Anchor Positioning`) mà không cần dùng JS để đo đạc.",
      ],
      scenarios: [
        {
          domain: "UI Library / Hệ thống Tooltip, Popover & Dropdown Định vị Tự động",
          title: "Mở đồng thời nhiều Tooltip/Badge hoặc cập nhật vị trí Popover khi cuộn trang làm giật khung hình",
          problem:
            "Trong vòng lặp qua các phần tử, code vừa đọc `trigger.getBoundingClientRect()` để lấy vị trí, vừa gán ngay `tooltip.style.top = ...` rồi lặp sang phần tử tiếp theo — ép trình duyệt phải tính lại Layout đồng bộ ở mỗi bước lặp.",
          application:
            "Áp dụng quy tắc **FastDOM (Read Phase → Write Phase)**: Bước 1 đọc toàn bộ `getBoundingClientRect()` của mọi phần tử lưu vào mảng tạm; Bước 2 mới cập nhật `style.transform = translate3d(x, y, 0)` bên trong `requestAnimationFrame`.",
          outcome:
            "Trình duyệt chỉ chạy đúng 1 lần Layout duy nhất trong cả frame thay vì N lần, giảm thời gian xử lý từ > 80ms xuống < 2ms.",
        },
        {
          domain: "SaaS / Bảng Dữ liệu (Data Table) Tự động Căn chỉnh Độ rộng Cột",
          title: "Tính năng 'Auto-fit Columns' đo độ rộng nội dung của 500 ô bảng để căn chỉnh cột làm đơ trang",
          problem:
            "Duyệt qua từng ô `<td>`, đọc `cell.scrollWidth` rồi lập tức gán `col.style.width = maxWidth + 'px'` ngay trong cùng vòng lặp.",
          application:
            "Đọc toàn bộ `scrollWidth` của các ô trong 1 lượt duyệt đầu tiên để tìm ra mảng `maxWidths[]` cho từng cột, sau đó mới áp dụng đồng loạt vào biến CSS hoặc `<colgroup>` trong 1 lượt ghi duy nhất.",
          outcome:
            "Loại bỏ hoàn toàn 500 lần Forced Synchronous Layout liên tiếp.",
        },
        {
          domain: "Landing Page / E-Commerce / Hiệu ứng Parallax & Sticky Header khi Cuộn trang",
          title: "Cuộn chuột trên trang chủ bị khựng do sự kiện `scroll` đọc `window.scrollY` và sửa `style.height` / `style.top`",
          problem:
            "Thay đổi các thuộc tính hình học (`height`, `top`, `margin-top`) trên thanh Header hoặc Banner mỗi khi cuộn chuột buộc trình duyệt phải tính lại bố cục (Reflow) của toàn bộ phần nội dung bên dưới.",
          application:
            "Không bao giờ sửa `top`/`height` khi cuộn! Chỉ dùng các thuộc tính chạy trên **GPU Compositor Thread** là `transform: translate3d(0, y, 0)` và `transform: scale()` kết hợp đọc vị trí qua `IntersectionObserver`.",
          outcome:
            "Cuộn trang đạt 120 FPS mượt tuyệt đối vì bỏ qua hoàn toàn cả bước Layout lẫn bước Paint trên Main Thread.",
        },
        {
          domain: "EdTech / Trình soạn thảo Công thức / Sơ đồ Tư duy (Mindmap / Node Graph)",
          title: "Vẽ đường nối SVG (Edges) giữa 100 hộp văn bản (Nodes) sau khi người dùng sửa chữ",
          problem:
            "Mỗi khi sửa chữ trong 1 node, code lặp qua 100 node vừa cập nhật nội dung DOM vừa gọi `getBBox()` / `offsetWidth` để tính lại tọa độ dây nối.",
          application:
            "Dùng `ResizeObserver` (cung cấp sẵn `entry.contentRect` từ trình duyệt mà không gây Forced Reflow!) để nhận kích thước mới của các node và gom việc vẽ lại đường SVG vào 1 callback `requestAnimationFrame`.",
          outcome:
            "Cập nhật sơ đồ 100 node mượt mà dưới 4ms mỗi frame.",
        },
      ],
    },
    en: {
      whenToApply: [
        "When measuring DOM geometry (`offsetWidth`, `offsetHeight`, `scrollTop`, `getBoundingClientRect()`, `getComputedStyle()`) and subsequently mutating styles on multiple elements.",
        "When Chrome DevTools Performance shows purple **Layout** bars flagged with a red warning triangle (**'Forced reflow is a likely performance bottleneck'**).",
        "When drag-and-drop, resize, or scroll-linked animations stutter despite low JavaScript business logic cost.",
      ],
      whenNotToApply: [
        "When layout sizing and positioning can be expressed declaratively in **pure CSS** (`grid`, `flexbox`, `container-type: inline-size`, `position: sticky`, or `CSS Anchor Positioning`) without JS measurement.",
      ],
      scenarios: [
        {
          domain: "UI Primitives / Tooltip, Popover & Floating Element Positioning",
          title: "Positioning multiple floating badges or popovers on scroll causes severe frame drops",
          problem:
            "Looping over elements and interleaving `trigger.getBoundingClientRect()` (DOM read) with `popover.style.top = ...` (DOM write) forces synchronous reflow on every iteration.",
          application:
            "Enforce strict **Read-Then-Write Separation**: batch all `getBoundingClientRect()` reads into an array first, then apply all position updates using `transform: translate3d(x, y, 0)` in a single pass.",
          outcome:
            "Collapses N forced synchronous layouts down to a single browser layout pass (< 2ms).",
        },
        {
          domain: "SaaS / Data Grid 'Auto-Fit Column Widths' Feature",
          title: "Measuring 500 table cells to auto-size columns freezes the browser for 300ms",
          problem:
            "Reading `cell.scrollWidth` and immediately setting `col.style.width` inside the same loop invalidates the layout tree 500 times in a row.",
          application:
            "Read all cell widths first to compute the `maxWidths[]` array in memory, then write all column widths in a single DOM mutation pass.",
          outcome:
            "Eliminates 500 consecutive forced synchronous reflows.",
        },
        {
          domain: "Marketing / E-Commerce / Scroll-Linked Shrinking Header & Parallax",
          title: "Scrolling the storefront stutters because `scroll` listeners mutate `style.height` and `style.top`",
          problem:
            "Mutating geometric properties (`height`, `top`, `margin`) during scroll invalidates layout for the entire document below the header on every pixel scrolled.",
          application:
            "Replace layout-triggering properties with **Compositor-only** properties (`transform: translate3d()`, `scale()`, `opacity`) and use `IntersectionObserver` for threshold detection.",
          outcome:
            "Locked 120 FPS scrolling by bypassing Main-Thread Layout and Paint entirely.",
        },
        {
          domain: "Diagramming / Node-Graph & Mindmap Editor",
          title: "Recalculating SVG connector lines between 100 editable nodes after text changes",
          problem:
            "Mutating node labels and immediately reading `offsetWidth` / `getBBox()` in a loop over 100 nodes.",
          application:
            "Use `ResizeObserver` (which delivers `entry.contentRect` after layout without triggering forced synchronous reflow) and batch SVG path updates inside `requestAnimationFrame`.",
          outcome:
            "100-node graph updates complete in under 4ms per frame.",
        },
      ],
    },
  },

  "detached-dom-leaks": {
    vi: {
      whenToApply: [
        "Khi ứng dụng Single-Page App (SPA) dùng càng lâu, chuyển qua lại giữa các trang hoặc đóng/mở Modal nhiều lần thì RAM (`JS Heap`) càng tăng dần không bao giờ giảm xuống (đồ thị răng cưa đi lên).",
        "Khi trong tab **Memory → Heap Snapshot** của Chrome DevTools, bạn gõ tìm `Detached` và thấy hàng trăm/hàng ngàn `Detached HTMLDivElement` còn tồn tại dù giao diện đó đã đóng từ lâu.",
        "Khi tích hợp các thư viện bên thứ ba thao tác trực tiếp lên DOM (Chart.js, D3, Mapbox, Google Maps, Quill/TipTap Editor, Video.js) bên trong React component.",
      ],
      whenNotToApply: [
        "Khi bạn cố ý giữ lại một số ít phần tử nhẹ trong bộ nhớ đệm có giới hạn kích thước rõ ràng (ví dụ `<Activity>` / Keep-Alive cho đúng 1-2 tab chính vừa truy cập).",
      ],
      scenarios: [
        {
          domain: "Analytics / BI / Đóng mở Modal Chi tiết Biểu đồ hoặc Bản đồ (Mapbox / ECharts)",
          title: "Mỗi lần mở rồi đóng Popup Bản đồ Giao hàng là trình duyệt mất thêm 25MB RAM không thể thu hồi",
          problem:
            "Instance của thư viện `mapboxgl.Map` hoặc `echarts.init(domRef.current)` được lưu vào một biến mảng/cache toàn cục hoặc chưa gọi hàm `.remove()` / `.dispose()` khi Modal unmount. Đối tượng JS này giữ chặt tham chiếu tới thẻ `<div ref={domRef}>`, khiến cả cây DOM của Modal biến thành **Detached DOM Tree**.",
          application:
            "Trong cleanup function của `useEffect`, bắt buộc gọi `chartInstance.dispose()` / `map.remove()`, gán `ref.current = null`, và tuyệt đối không lưu DOM element vào mảng toàn cục.",
          outcome:
            "Garbage Collector (GC) thu hồi 100% bộ nhớ DOM và Canvas WebGL ngay sau khi đóng Modal; mở đóng 100 lần RAM vẫn giữ nguyên.",
        },
        {
          domain: "SaaS / Trình soạn thảo Rich-Text (TipTap / ProseMirror / CKEditor)",
          title: "Chuyển qua lại giữa 30 bài viết trong trang Admin CMS làm tab Chrome ngốn 1.2GB RAM",
          problem:
            "Service quản lý lịch sử Undo/Redo hoặc Plugin tự tạo lưu tham chiếu tới `editorView.dom` trong một Singleton Store ngoài React mà không xóa khi người dùng chuyển sang bài viết khác.",
          application:
            "Dùng `WeakMap<Element, Metadata>` nếu cần gắn dữ liệu phụ trợ vào DOM node, và gọi `editor.destroy()` triệt để trong `useEffect` cleanup khi đổi `documentId`.",
          outcome:
            "Số lượng `Detached HTMLElement` trong Heap Snapshot giảm về 0; dung lượng RAM ổn định quanh mức 45MB suốt cả ngày làm việc.",
        },
        {
          domain: "Media / E-Learning / Trình phát Video (HLS.js / Video.js) khi chuyển bài học",
          title: "Học viên chuyển qua 10 video bài giảng liên tiếp thì trình duyệt bị đơ và mất tiếng",
          problem:
            "Thẻ `<video>` đã bị React xóa khỏi màn hình khi chuyển bài, nhưng instance `Hls` vẫn còn giữ tham chiếu tới thẻ `<video>` cũ cùng bộ đệm MediaSource trong bộ nhớ.",
          application:
            "Trong `useEffect` cleanup: gọi `hls.detachMedia()`, `hls.destroy()`, xóa `videoEl.removeAttribute('src')` và gọi `videoEl.load()` để giải phóng hoàn toàn cả thẻ `<video>` lẫn bộ đệm giải mã.",
          outcome:
            "Giải phóng tức thì hàng chục MB buffer video và DOM node khi chuyển bài.",
        },
        {
          domain: "Design System / Quản lý Focus Trap & Portal Overlay",
          title: "Lịch sử các phần tử từng được Focus (`previouslyFocusedElements[]`) giữ sống cả trang cũ",
          problem:
            "Một tiện ích Accessibility đẩy `document.activeElement` vào một mảng lịch sử toàn cục mỗi khi mở Dialog để trả lại focus lúc đóng, nhưng quên `.pop()` hoặc xóa khi route thay đổi.",
          application:
            "Lưu tham chiếu bằng `WeakRef<HTMLElement>` hoặc dọn sạch ngăn xếp focus ngay trong hàm cleanup khi Dialog unmount.",
          outcome:
            "Không còn hiện tượng 1 nút `<button>` cũ giữ sống toàn bộ cây DOM của trang trước đó.",
        },
      ],
    },
    en: {
      whenToApply: [
        "When navigating between routes or repeatedly opening/closing modals in a SPA causes `JS Heap` memory to climb in a sawtooth-upward pattern that never returns to baseline.",
        "When filtering Chrome DevTools **Memory → Heap Snapshot** by `Detached` reveals hundreds or thousands of `Detached HTMLDivElement` nodes.",
        "When wrapping imperative third-party DOM libraries (Mapbox, ECharts, Chart.js, ProseMirror/TipTap, Video.js/HLS.js) inside React components.",
      ],
      whenNotToApply: [
        "When intentionally preserving a strictly bounded set of 1-2 active views using a controlled Keep-Alive / `<Activity>` boundary.",
      ],
      scenarios: [
        {
          domain: "Analytics / Logistics / Interactive Mapbox or ECharts Modal",
          title: "Opening and closing the Delivery Map modal leaks 25MB of RAM every single time",
          problem:
            "An imperative `mapboxgl.Map` or `echarts` instance is stored in a module-level registry or not `.remove()`d / `.dispose()`d on unmount, retaining a direct reference to its container `<div>` and keeping the entire modal subtree alive as a **Detached DOM Tree**.",
          application:
            "Always call `instance.dispose()` / `map.remove()` in the `useEffect` cleanup, clear any external references, and never store raw DOM nodes in module arrays.",
          outcome:
            "Garbage Collection reclaims 100% of DOM and WebGL buffers upon modal close; opening 100 times keeps Heap memory flat.",
        },
        {
          domain: "SaaS CMS / Rich-Text Editor (TipTap / ProseMirror / CKEditor)",
          title: "Switching between 30 articles in an admin CMS bloats the Chrome tab to 1.2GB RAM",
          problem:
            "A singleton plugin or undo-history manager retains a reference to `editorView.dom` across route transitions.",
          application:
            "Associate DOM metadata via `WeakMap<Element, Data>` (which allows GC as soon as the element leaves the document) and call `editor.destroy()` on unmount.",
          outcome:
            "Zero `Detached HTMLElement` nodes in Heap Snapshots across dozens of route changes.",
        },
        {
          domain: "EdTech / Video Streaming / HLS.js Player Across Lesson Navigation",
          title: "Watching 10 consecutive video lessons exhausts browser memory and stalls playback",
          problem:
            "React unmounts the `<video>` element on route change, but the `Hls` controller still holds a reference to the detached `<video>` node and its decoded `MediaSource` buffers.",
          application:
            "In `useEffect` cleanup: invoke `hls.detachMedia()`, `hls.destroy()`, clear `video.removeAttribute('src')`, and call `video.load()`.",
          outcome:
            "Immediately releases detached video DOM elements and tens of megabytes of media buffers.",
        },
        {
          domain: "Design System / Focus Manager & Modal Portals",
          title: "A global focus-history stack keeps entire previous pages alive in memory",
          problem:
            "Pushing `document.activeElement` into a global `focusHistory[]` array when opening dialogs without popping or clearing on route navigation.",
          application:
            "Store element references using `WeakRef<HTMLElement>` or guarantee stack cleanup inside the `useEffect` teardown.",
          outcome:
            "Prevents a single retained `<button>` reference from anchoring an entire detached page tree in V8 Heap.",
        },
      ],
    },
  },

  "closures-listeners-leaks": {
    vi: {
      whenToApply: [
        "Khi component có đăng ký sự kiện toàn cục (`window.addEventListener`, `document.addEventListener`), bộ đếm thời gian (`setInterval`, `setTimeout`), hoặc Event Bus / WebSocket (`socket.on`, `eventEmitter.on`).",
        "Khi bạn thấy một hàm xử lý sự kiện (ví dụ `onKeyDown` hoặc `onScroll`) tự nhiên chạy **nhiều lần (2x, 5x, 10x)** chỉ với 1 lần bấm phím sau khi người dùng chuyển trang qua lại.",
        "Khi một hàm callback bất đồng bộ hoặc closure giữ tham chiếu tới một state/biến lớn trong phạm vi lexical (`Lexical Scope`), ngăn cản Garbage Collector dọn dẹp.",
      ],
      whenNotToApply: [
        "Sự kiện gắn trực tiếp qua JSX của React (`<button onClick={...} />`) trên chính phần tử đó — React tự động quản lý thông qua Event Delegation ở gốc root và tự giải phóng khi phần tử unmount.",
      ],
      scenarios: [
        {
          domain: "Productivity SaaS / Phím tắt Toàn cục (Global Keyboard Shortcuts `Cmd+S`, `Cmd+K`)",
          title: "Bấm `Cmd+S` một lần nhưng gửi tới 5 request lưu dữ liệu trùng lặp lên Server",
          problem:
            "Trong `useEffect`, đăng ký `window.addEventListener('keydown', handleKeyDown)` nhưng quên `removeEventListener`, hoặc truyền một hàm inline mới vào `removeEventListener` khác tham chiếu với hàm lúc `addEventListener`. Mỗi lần mở lại trang soạn thảo là nhân bản thêm 1 listener chạy ngầm.",
          application:
            "Sử dụng **`AbortController`** (`window.addEventListener('keydown', handler, { signal: controller.signal })`) và gọi `controller.abort()` trong hàm return của `useEffect` để hủy sạch mọi listener chỉ bằng 1 dòng lệnh.",
          outcome:
            "Đảm bảo 100% chỉ có đúng 1 listener hoạt động tại mọi thời điểm và giải phóng hoàn toàn closure của component cũ.",
        },
        {
          domain: "Fintech / Crypto / Polling & WebSocket Subscription khi chuyển cặp tiền (`BTC/USDT` → `ETH/USDT`)",
          title: "Chuyển qua 5 cặp tiền tệ khiến giao diện nhảy loạn xạ giữa giá của đồng cũ và đồng mới",
          problem:
            "Khi đổi `symbol`, `setInterval` hoặc `socket.on('ticker', callback)` của đồng tiền cũ không được dọn dẹp (`clearInterval` / `socket.off`), khiến 5 vòng lặp ngầm cùng chạy và giữ sống toàn bộ closure dữ liệu lịch sử nến của 5 cặp tiền.",
          application:
            "Trả về hàm cleanup hủy đăng ký kênh cũ (`socket.off('ticker', onTick)` + `clearInterval(id)`) ngay khi dependency `[symbol]` thay đổi.",
          outcome:
            "Không còn hiện tượng nhân bản timer hay ghi đè dữ liệu chéo (Stale Closure Race).",
        },
        {
          domain: "E-Commerce / Theo dõi Cuộn trang & Resize Màn hình (`scroll` / `resize` Listeners)",
          title: "Truy cập 15 trang chi tiết sản phẩm xong thì thao tác cuộn trang bắt đầu giật lag nặng",
          problem:
            "Mỗi trang sản phẩm gắn 1 listener `window.addEventListener('scroll', ...)` mà không gỡ bỏ khi chuyển trang. Sau 15 trang, mỗi pixel cuộn chuột kích hoạt đồng thời 15 hàm callback cũ vẫn đang giữ tham chiếu tới dữ liệu sản phẩm cũ.",
          application:
            "Luôn gắn `{ passive: true, signal: abortController.signal }` cho sự kiện `scroll` và gọi `abortController.abort()` khi unmount.",
          outcome:
            "Số lượng active listeners trên `window` luôn bằng đúng 1; cuộn trang mượt ổn định dù duyệt qua hàng trăm sản phẩm.",
        },
        {
          domain: "Analytics SDK / Closure Giữ chặt Dữ liệu Nặng (Accidental Scope Retention)",
          title: "Một hàm `setInterval` nhỏ chỉ gửi ping 30 giây/lần nhưng lại giữ sống mảng dữ liệu 40MB trong RAM",
          problem:
            "Trong cùng một component có biến `const rawDataset = parse40MBData()`. Dù hàm callback bên trong `setInterval` chỉ đọc `sessionId`, V8 Context có thể giữ lại toàn bộ Lexical Environment nếu các closure trong cùng scope chia sẻ biến.",
          application:
            "Tách hàm tạo timer ra ngoài scope chứa biến nặng hoặc chỉ truyền đúng giá trị nguyên thủy (`primitive sessionId`) vào hook quản lý nhịp ping kèm cleanup chuẩn.",
          outcome:
            "Mảng `rawDataset` 40MB được GC thu hồi ngay lập tức sau khi xử lý xong.",
        },
      ],
    },
    en: {
      whenToApply: [
        "Whenever a component registers global event listeners (`window.addEventListener`, `document.addEventListener`), timers (`setInterval`, `setTimeout`), or pub/sub handlers (`socket.on`, `eventBus.on`).",
        "When an action (like pressing a keyboard shortcut or scrolling) unexpectedly fires **multiple times (2x, 5x, 10x)** after navigating between pages.",
        "When long-lived callbacks or closures capture a component's lexical scope and prevent V8 Garbage Collection.",
      ],
      whenNotToApply: [
        "Standard declarative React JSX event props (`<button onClick={...} />`) — React manages these via root event delegation and cleans them up automatically when the Fiber unmounts.",
      ],
      scenarios: [
        {
          domain: "Productivity SaaS / Global Keyboard Shortcuts (`Cmd+S`, `Cmd+K`)",
          title: "Pressing `Cmd+S` once triggers 5 duplicate save API requests",
          problem:
            "Registering `window.addEventListener('keydown', handler)` inside `useEffect` without a matching teardown (or passing a mismatched inline function to `removeEventListener`). Every route revisit stacks another zombie listener.",
          application:
            "Pass an **`AbortController` signal** (`window.addEventListener('keydown', handler, { signal: controller.signal })`) and call `controller.abort()` in the `useEffect` cleanup.",
          outcome:
            "Guarantees exactly 1 active listener and immediately releases the old component closure on unmount.",
        },
        {
          domain: "Fintech / Crypto / Switching Trading Pairs (`BTC/USDT` → `ETH/USDT`)",
          title: "Switching across 5 trading pairs causes flickering prices and 5x CPU load",
          problem:
            "Failing to clear `setInterval` or `socket.off('ticker', onTick)` when `[symbol]` changes leaves 5 background closures alive, each holding megabytes of historical candlestick arrays.",
          application:
            "Return a deterministic cleanup function that unsubscribes the exact listener reference and aborts in-flight timers whenever `symbol` changes.",
          outcome:
            "Eliminates zombie timers, stale closure state corruption, and memory retention.",
        },
        {
          domain: "E-Commerce / Window Scroll & Resize Listeners Across Product Pages",
          title: "Scrolling becomes progressively choppier after browsing 15 product detail pages",
          problem:
            "Each product page attaches a `window` scroll listener without removing it on unmount. After 15 navigations, 15 zombie listeners execute on every scroll tick.",
          application:
            "Attach listeners with `{ passive: true, signal: controller.signal }` and abort on component unmount.",
          outcome:
            "Listener count stays constant at 1 regardless of how many pages the user visits.",
        },
        {
          domain: "Analytics / Accidental Lexical Scope Retention in Closures",
          title: "A lightweight 30-second heartbeat timer keeps a 40MB dataset pinned in V8 Heap",
          problem:
            "Defining a long-lived `setInterval` closure inside the same function scope that holds a massive temporary `rawDataset` object.",
          application:
            "Extract the timer into a dedicated hook that receives only primitive identifiers (`sessionId`) and cleans up strictly on unmount.",
          outcome:
            "Allows V8 Garbage Collector to reclaim the 40MB dataset immediately after initial processing.",
        },
      ],
    },
  },

  "unbounded-cache-lru": {
    vi: {
      whenToApply: [
        "Khi bạn tự xây dựng bộ nhớ đệm (in-memory cache) bằng `new Map()`, `{}` (Object), hoặc mảng tích lũy trong Zustand/Singleton để lưu kết quả API, dữ liệu đã tính toán (`memoization`), hoặc lịch sử truy vấn.",
        "Khi cấu hình TanStack Query với `gcTime: Infinity` trên các trang có vô số khóa truy vấn (`queryKey`) động (như tìm kiếm, phân trang, lọc theo ID sản phẩm).",
        "Khi cần gắn dữ liệu tính toán phụ trợ (bộ đệm đã parse, trạng thái mở rộng, kích thước đo đạc) vào các Object dữ liệu hoặc DOM Element.",
      ],
      whenNotToApply: [
        "Bảng tra cứu tĩnh (Static Lookup Config) có số lượng phần tử cố định và nhỏ (ví dụ danh sách 63 tỉnh thành hoặc 20 loại tiền tệ).",
      ],
      scenarios: [
        {
          domain: "E-Commerce / SaaS / Tự viết Hàm Memoize hoặc Cache Kết quả Tìm kiếm bằng `new Map()`",
          title: "Cache kết quả gợi ý tìm kiếm vào `const searchCache = new Map()` làm tràn RAM sau 30 phút sử dụng",
          problem:
            "Mỗi khi khách gõ `a`, `ip`, `iph`, `ipho`, `iphon`, `iphone 16`..., ứng dụng lưu toàn bộ mảng kết quả vào `Map` toàn cục mà không có giới hạn số lượng phần tử tối đa (`maxEntries`) hay thời gian hết hạn (`TTL`).",
          application:
            "Thay thế `Map` trần bằng cấu trúc **Bounded LRU Cache (Least Recently Used)** giới hạn cứng (ví dụ `maxEntries = 100`) — tự động đẩy phần tử ít dùng nhất ra khỏi bộ nhớ khi đầy — hoặc dùng TanStack Query với `gcTime: 5 * 60 * 1000`.",
          outcome:
            "Dung lượng bộ nhớ dành cho cache luôn có trần cố định (O(1) bounded memory) bất kể người dùng tìm kiếm bao nhiêu nghìn lần.",
        },
        {
          domain: "B2B Admin / Dashboard Quản lý Đơn hàng Mở tab suốt 8 tiếng làm việc",
          title: "Nhân viên vận hành duyệt qua 2,000 đơn hàng trong ca trực khiến trình duyệt báo lỗi `Out of Memory`",
          problem:
            "Cấu hình `gcTime: Infinity` trong React Query hoặc nối dồn mọi chi tiết đơn hàng đã xem vào `useOrderStore.ordersById[id]` mà không bao giờ dọn dẹp các đơn hàng đã xem từ nhiều giờ trước.",
          application:
            "Thiết lập chính sách thu hồi rác tự động (`gcTime: 300_000` — 5 phút sau khi không còn component nào mount dữ liệu đó sẽ tự xóa khỏi RAM) và dùng LRU cho store tự quản lý.",
          outcome:
            "Ứng dụng chạy bền bỉ suốt ca làm việc 8-12 tiếng mà Heap Memory luôn phẳng dưới 60MB.",
        },
        {
          domain: "Data Visualization / Trình xem Tài liệu & Đồ thị Lưu Cache theo Object Tham chiếu",
          title: "Tính toán và cache cấu trúc cây AST / dữ liệu chuẩn hóa cho từng Object tài liệu",
          problem:
            "Dùng `new Map<DocumentObject, ParsedAST>()` để tránh tính toán lại. Ngay cả khi `DocumentObject` gốc đã bị xóa khỏi danh sách khi chuyển trang, `Map` vẫn giữ chặt tham chiếu tới nó khiến cả Object gốc lẫn `ParsedAST` không bao giờ được GC giải phóng.",
          application:
            "Sử dụng **`WeakMap<DocumentObject, ParsedAST>()`**! Vì khóa của `WeakMap` là tham chiếu yếu (weak reference), ngay khi `DocumentObject` gốc không còn biến nào khác trỏ tới, V8 GC sẽ tự động dọn sạch cả khóa lẫn giá trị `ParsedAST`.",
          outcome:
            "Vừa tận dụng được tốc độ O(1) của cache khi đối tượng còn sống, vừa tự động giải phóng 100% RAM khi đối tượng bị hủy mà không cần viết code xóa thủ công.",
        },
        {
          domain: "AI Chat / Lưu Lịch sử Stream & Log Sự kiện Trong Bộ nhớ",
          title: "Lưu toàn bộ các gói tin raw telemetry / debug logs vào mảng `logs.push(entry)` không giới hạn",
          problem:
            "Mảng `logs` phình to lên hàng trăm nghìn phần tử sau vài giờ chạy ứng dụng.",
          application:
            "Sử dụng **Ring Buffer (Bộ đệm vòng)** hoặc cắt mảng có trần cố định `logs.slice(-200)` để luôn chỉ giữ lại N bản ghi gần nhất.",
          outcome:
            "Ngăn chặn triệt để lỗi rò rỉ bộ nhớ tích lũy theo thời gian.",
        },
      ],
    },
    en: {
      whenToApply: [
        "When building custom in-memory caches using `new Map()`, plain objects `{}`, or growing arrays in Zustand/singletons to store API responses, memoized calculations, or query history.",
        "When configuring TanStack Query on routes with high-cardinality dynamic `queryKey`s (search queries, pagination, item detail IDs).",
        "When associating derived metadata or parsed structures with object references or DOM elements.",
      ],
      whenNotToApply: [
        "Small, static lookup tables with a fixed, finite number of keys (e.g., 50 country codes or 20 currency symbols).",
      ],
      scenarios: [
        {
          domain: "E-Commerce / SaaS / Custom Autocomplete Cache with `new Map()`",
          title: "Caching every search keystroke prefix in a module-level `Map` exhausts RAM after 30 minutes",
          problem:
            "Every prefix (`i`, `ip`, `iph`, `ipho`...) stores a full product array inside an unbounded global `Map` without eviction or TTL.",
          application:
            "Replace raw `Map` with a **Bounded LRU (Least Recently Used) Cache** (`maxEntries = 100`) that evicts the oldest accessed entry in O(1) using `Map.prototype.keys().next().value`, or rely on TanStack Query's bounded `gcTime`.",
          outcome:
            "Memory footprint stays strictly capped at O(maxEntries) regardless of session length.",
        },
        {
          domain: "B2B Operations / Order Management Portal Open for an 8-Hour Shift",
          title: "Support agents inspecting 2,000 order details over a shift hit Chrome `Out of Memory` crashes",
          problem:
            "Setting `gcTime: Infinity` or accumulating every viewed order payload inside a global `ordersById` dictionary without eviction.",
          application:
            "Configure `gcTime: 5 * 60 * 1000` (5 minutes) so inactive query cache entries are garbage-collected automatically after unmount, backed by an LRU cap for custom stores.",
          outcome:
            "The app runs reliably for 8-12 hour shifts with stable Heap memory under 60MB.",
        },
        {
          domain: "Document Editor / Data Visualization / Derived Object Metadata Cache",
          title: "Caching parsed ASTs or layout metrics keyed by data object instances",
          problem:
            "Using `new Map<DocObject, ParsedAST>()` pins every `DocObject` in memory forever, even after the user closes the document.",
          application:
            "Use **`WeakMap<DocObject, ParsedAST>()`**! Because `WeakMap` holds weak keys, V8 Garbage Collector automatically reclaims both the key and cached AST as soon as the `DocObject` is no longer referenced elsewhere.",
          outcome:
            "Zero-maintenance O(1) caching with automatic garbage collection when objects go out of scope.",
        },
        {
          domain: "Real-Time Telemetry / In-Memory Event Log Collector",
          title: "Pushing debug events into an unbounded `events.push(payload)` array",
          problem:
            "The in-memory log array grows to hundreds of thousands of objects over long sessions.",
          application:
            "Enforce a **Ring Buffer** or fixed sliding window (`events.slice(-200)`) on every insertion.",
          outcome:
            "Eliminates slow-drip memory leaks in long-running sessions.",
        },
      ],
    },
  },
}
