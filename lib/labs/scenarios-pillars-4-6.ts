import type { LabPatternMapping } from "./types"

type Pillars4To6Slug =
  | "network-waterfalls"
  | "cls-layout-shifts"
  | "dedup-optimistic-ui"
  | "high-frequency-streams"
  | "heavy-data-grid"
  | "input-responsiveness"
  | "code-splitting-prefetch"
  | "barrel-files-treeshaking"
  | "third-party-isolation"

export const SCENARIOS_PILLARS_4_TO_6: Record<
  Pillars4To6Slug,
  { vi: LabPatternMapping; en: LabPatternMapping }
> = {
  "network-waterfalls": {
    vi: {
      whenToApply: [
        "Khi mở tab **Network** trong Chrome DevTools và thấy biểu đồ dạng bậc thang (Staircase Waterfall): Request B chỉ bắt đầu chạy sau khi Request A tải xong, dù Request B không hề cần dữ liệu trả về từ Request A.",
        "Khi trang Dashboard có nhiều khối nội dung độc lập (Thông tin User, Danh sách Đơn hàng, Biểu đồ Doanh thu, Thông báo) nhưng tất cả phải chờ cái chậm nhất xong mới hiện lên cùng lúc.",
        "Khi các Component con tự gọi `useEffect(() => fetch(...))` nối tiếp nhau sau khi Component cha mount xong.",
      ],
      whenNotToApply: [
        "Khi Request B **thực sự phụ thuộc dữ liệu** vào kết quả của Request A (ví dụ: phải tạo xong `orderId` ở bước 1 thì mới gọi được API tạo link thanh toán QR cho `orderId` đó ở bước 2) — trường hợp đó nên gộp thành 1 endpoint tổng hợp ở tầng Backend/BFF hoặc Server Action.",
      ],
      scenarios: [
        {
          domain:
            "SaaS / Trang Dashboard Tổng quan (Executive Analytics Dashboard)",
          title:
            "Trang chủ Admin mất 2.4 giây mới hiện dữ liệu vì 4 câu lệnh `await` viết nối tiếp nhau",
          problem:
            "Trong Server Component hoặc loader, lập trình viên viết tuần tự: `const user = await getUser(); const stats = await getStats(); const orders = await getOrders(); const alerts = await getAlerts()`. Tổng thời gian chờ bị cộng dồn (`400ms + 700ms + 800ms + 500ms = 2400ms`).",
          application:
            "Khởi chạy song song bằng **`Promise.all([getUser(), getStats(), getOrders(), getAlerts()])`** hoặc tách mỗi khối thành một **Streaming `<Suspense>`** riêng biệt để khối nào tải xong trước (như `User` 400ms) sẽ hiển thị lên màn hình ngay lập tức.",
          outcome:
            "Thời gian hiển thị nội dung đầu tiên giảm từ 2,400ms xuống 400ms; tổng thời gian hoàn tất giảm còn 800ms (bằng đúng request dài nhất).",
        },
        {
          domain:
            "E-Commerce / Trang Chi tiết Sản phẩm (Product Detail Page - PDP)",
          title:
            "Phần Đánh giá (Reviews) và Sản phẩm Tương tự chỉ bắt đầu tải sau khi Component chính hydrate xong",
          problem:
            "Component `<ProductPage>` tải thông tin sản phẩm trước, sau khi render xong mới mount `<ProductReviews productId={id} />`, rồi bên trong `<ProductReviews>` lại chạy `useEffect` gọi API lấy danh sách bình luận.",
          application:
            "Đẩy việc khởi tạo truy vấn lên ngay tại cấp Route (`prefetchQuery` hoặc truyền Promise từ Server Component xuống Client Component qua `use(reviewsPromise)`) để tải song song cả Thông tin sản phẩm lẫn Bình luận ngay từ mili-giây số 0.",
          outcome:
            "Xóa bỏ hoàn toàn bậc thang Client-side Fetch Waterfall sau khi tải JS.",
        },
        {
          domain: "Fintech / Mở Hồ sơ Khách hàng 360 (Customer 360 Profile)",
          title:
            "1 API chậm (Lịch sử Tín dụng 3 giây) làm trắng xóa toàn bộ trang thông tin khách hàng",
          problem:
            "Dùng một `Promise.all` duy nhất chặn ở cấp trang (`page.tsx`) cho cả 5 nguồn dữ liệu, trong đó API tra cứu điểm tín dụng bên thứ ba mất tới 3 giây.",
          application:
            "Không `await` API chậm ở cấp trang! Chỉ `await` thông tin cơ bản của khách hàng (150ms) để vẽ khung trang ngay, còn khối Điểm tín dụng bọc trong `<Suspense fallback={<CreditScoreSkeleton />}>` để stream HTML xuống sau khi xong.",
          outcome:
            "Nhân viên ngân hàng đọc và thao tác được với thông tin khách hàng ngay ở 150ms thay vì nhìn màn hình trắng 3 giây.",
        },
        {
          domain:
            "Multi-tenant SaaS / Phụ thuộc Nối tiếp (`user` → `orgId` → `projects`)",
          title:
            "Phải gọi API `/me` lấy `orgId` rồi mới gọi được `/orgs/:orgId/projects`",
          problem:
            "Tạo ra chuỗi thác nước bắt buộc 2 vòng mạng (2 Round-Trips) từ trình duyệt lên Server.",
          application:
            "Lưu `orgId` ngay trong HTTP-only Cookie / JWT Claims hoặc gộp việc resolve `user -> org -> projects` ngay bên trong Server Component / API Route (mạng nội bộ datacenter mất < 2ms thay vì 300ms mạng 4G của khách).",
          outcome:
            "Cắt giảm 1 vòng khứ hồi mạng (RTT) đầy tốn kém trên thiết bị di động.",
        },
      ],
    },
    en: {
      whenToApply: [
        "When the Chrome DevTools **Network** tab shows a staircase waterfall where Request B only starts after Request A finishes, even though Request B does not depend on Request A's output.",
        "When an entire dashboard waits on the slowest API endpoint before rendering any widget.",
        "When nested child components trigger `useEffect(() => fetch(...))` sequentially after parent components mount.",
      ],
      whenNotToApply: [
        "When Request B genuinely requires a dynamic token or ID created by Request A (e.g., creating an `orderId` before generating a payment intent) — in that case, collapse the two steps inside a single Backend/Server Action call.",
      ],
      scenarios: [
        {
          domain: "SaaS / Executive Analytics Dashboard",
          title:
            "Admin dashboard takes 2.4 seconds to load due to 4 sequential `await` calls",
          problem:
            "Writing `const user = await getUser(); const stats = await getStats(); const orders = await getOrders(); const alerts = await getAlerts()` sums every latency (`400 + 700 + 800 + 500 = 2400ms`).",
          application:
            "Fire independent queries concurrently via **`Promise.all([...])`** or wrap each widget in its own **Streaming `<Suspense>`** boundary so fast widgets (400ms) paint immediately.",
          outcome:
            "First content paints at 400ms instead of 2,400ms, and total load time drops to `max(t_i) = 800ms`.",
        },
        {
          domain: "E-Commerce / Product Detail Page (PDP)",
          title:
            "Customer reviews and related items only start fetching after client hydration completes",
          problem:
            "`<ProductPage>` fetches product details first, renders, mounts `<ProductReviews />`, which then runs a client `useEffect` fetch — creating a multi-hop waterfall.",
          application:
            "Initiate both product details and reviews fetches in parallel at the route entry (`useSuspenseQueries` or streaming a Server Promise into `use(promise)`).",
          outcome:
            "Eliminates post-hydration client fetch waterfalls completely.",
        },
        {
          domain: "Fintech / Customer 360 Profile View",
          title:
            "One slow 3rd-party credit bureau API (3s) blocks the entire customer profile screen",
          problem:
            "Awaiting all 5 data sources at the top of `page.tsx` before returning any JSX.",
          application:
            "Await only the fast core profile (150ms) at the page level and wrap the slow credit bureau component inside `<Suspense fallback={<CreditSkeleton />}>`.",
          outcome:
            "Agents see and interact with customer details in 150ms while the credit report streams in progressively.",
        },
        {
          domain:
            "Multi-Tenant SaaS / Dependent Chain (`/me` → `orgId` → `/projects`)",
          title:
            "Client fetches `/api/me` to get `orgId` before fetching `/api/orgs/:id/projects`",
          problem:
            "Forces two sequential browser-to-server network round trips over high-latency mobile connections.",
          application:
            "Encode `activeOrgId` in the session cookie/URL or resolve the chain server-side inside a single RSC/route handler where database hops take < 2ms.",
          outcome:
            "Eliminates an entire client-server round trip on initial load.",
        },
      ],
    },
  },

  "cls-layout-shifts": {
    vi: {
      whenToApply: [
        "Khi người dùng đang định bấm vào một nút (như 'Quay lại' hoặc 'Xác nhận'), đúng lúc đó một tấm ảnh hoặc Banner Khuyến mãi tải xong chèn vào phía trên làm **đẩy tụt nút xuống dưới**, khiến người dùng bấm nhầm vào quảng cáo hoặc nút 'Mua ngay'.",
        "Khi điểm **CLS (Cumulative Layout Shift)** trên PageSpeed Insights / Lighthouse lớn hơn **0.1**.",
        "Khi font chữ tùy chỉnh tải xong làm đoạn văn bản bị giật đổi độ cao dòng, hoặc khi danh sách bình luận/sản phẩm biến từ khung nhỏ thành khung lớn mà không giữ chỗ trước.",
      ],
      whenNotToApply: [
        "Sự thay đổi bố cục diễn ra **trong vòng 500ms ngay sau khi người dùng chủ động click** (ví dụ bấm nút 'Xem thêm chi tiết' làm mở rộng Accordion) — trình duyệt không tính đó là lỗi CLS không mong muốn.",
      ],
      scenarios: [
        {
          domain: "E-Commerce / Trang Danh sách & Chi tiết Sản phẩm",
          title:
            "Ảnh sản phẩm và Banner Flash Sale tải chậm đẩy toàn bộ nút 'Thêm vào giỏ' tụt xuống 250px",
          problem:
            "Thẻ `<img>` không khai báo `width`/`height` hoặc `aspect-ratio`, và vùng Banner khuyến mãi phía trên khởi tạo với chiều cao `0px` trước khi API trả kết quả về.",
          application:
            "Luôn đặt cứng tỷ lệ khung hình `aspect-4/3` hoặc `width`/`height` cho mọi thẻ `<Image />`, và cấp phát trước khung giữ chỗ có chiều cao tối thiểu (`min-h-[72px]`) hoặc `<Skeleton />` khớp đúng kích thước thật cho vùng Banner.",
          outcome:
            "Điểm số `CLS` giảm từ 0.34 xuống **0.000 tuyệt đối**; chấm dứt hoàn toàn tình trạng khách bấm nhầm nút.",
        },
        {
          domain:
            "Tin tức / Blog / Hệ thống Quảng cáo & Nhúng Iframe (Ads / YouTube / Tweet Embeds)",
          title:
            "Đang đọc bài viết đến đoạn giữa thì khung quảng cáo phía trên bung ra làm mất dấu dòng đang đọc",
          problem:
            "Các khung quảng cáo động (Dynamic Ad Slots) hoặc iframe nhúng từ bên thứ ba tải bất đồng bộ sau khi người dùng đã cuộn xuống đọc bài.",
          application:
            "Bọc mọi vùng chứa quảng cáo/iframe trong một khung giữ chỗ cố định kích thước lớn nhất có thể xảy ra (`min-h-[250px] aspect-video`) kết hợp thuộc tính CSS `overflow-anchor: auto`.",
          outcome:
            "Văn bản bên dưới đứng yên tuyệt đối kể cả khi iframe bên trên tải trễ 2 giây.",
        },
        {
          domain: "SaaS / Bảng Dữ liệu & Danh sách Card khi Chuyển trang / Lọc",
          title:
            "Mỗi lần lọc dữ liệu, chiều cao trang co rút về 0px rồi bung ra lại làm thanh cuộn nhảy lên đầu trang",
          problem:
            "Khi `isLoading === true`, thay thế toàn bộ bảng 10 dòng (cao 520px) bằng một vòng xoay `<Spinner />` nhỏ xíu (cao 32px).",
          application:
            "Render đúng 10 dòng `<TableRowSkeleton className='h-[52px]' />` có chiều cao bằng hệt dòng dữ liệu thật, hoặc giữ nguyên dữ liệu cũ làm mờ (`placeholderData: keepPreviousData` trong TanStack Query).",
          outcome:
            "Khung bảng giữ nguyên kích thước 520px, vị trí thanh cuộn không bị giật ngược lên trên.",
        },
        {
          domain:
            "Editorial / Thương hiệu / Nháy & Nhảy Chữ khi Tải Web Font (`FOUT`)",
          title:
            "Tiêu đề bài viết nhảy từ 2 dòng thành 3 dòng ngay khi font chữ thương hiệu tải xong",
          problem:
            "Font mặc định của hệ thống (`Arial`) có độ rộng chữ cái và chiều cao dòng khác biệt lớn so với Web Font tùy chỉnh.",
          application:
            "Sử dụng `next/font/google` với `display: 'swap'` và tự động sinh CSS `size-adjust`, `ascent-override`, `descent-override` cho fallback font để khớp kích thước từng ký tự với font chính.",
          outcome:
            "Khi Web Font tải xong và thay thế font hệ thống, bố cục dòng và chiều cao đoạn văn không lệch dù chỉ 1 pixel.",
        },
      ],
    },
    en: {
      whenToApply: [
        "When late-loading images, promo banners, or dynamic widgets push existing buttons downward right as the user is about to tap them.",
        "When **CLS (Cumulative Layout Shift)** exceeds **0.1** in Lighthouse or Core Web Vitals field telemetry.",
        "When web font swaps (`FOUT`) or skeleton-to-content transitions alter container heights after initial paint.",
      ],
      whenNotToApply: [
        "Layout changes triggered directly within **500ms of an explicit user interaction** (such as clicking an Accordion toggle or 'Show More' button) — these are expected layout transitions, not unexpected CLS.",
      ],
      scenarios: [
        {
          domain: "E-Commerce / Product Detail & Flash Sale Banners",
          title:
            "Late-loading promo banner pushes the 'Add to Cart' button down by 250px mid-click",
          problem:
            "Rendering `<img>` tags without intrinsic dimensions and injecting a top promo bar that starts at `0px` height until an API call resolves.",
          application:
            "Enforce explicit `width`/`height` or CSS `aspect-ratio` (`aspect-4/3`) on every image container, and reserve exact `min-h-[72px]` skeleton geometry for top banners.",
          outcome:
            "Reduces `CLS` from 0.34 to **0.000**, completely preventing accidental mis-clicks.",
        },
        {
          domain: "Publishing / Media / Dynamic Ad Slots & Third-Party Embeds",
          title:
            "Readers lose their reading position when an above-the-fold ad slot expands asynchronously",
          problem:
            "Unreserved third-party iframes or ad containers inject 250px of vertical height after the user has already scrolled down the article.",
          application:
            "Wrap every external embed or ad slot in a pre-sized container (`min-h-[250px]`) with `overflow-anchor: auto`.",
          outcome:
            "Article text remains rock-steady even when third-party embeds finish loading seconds later.",
        },
        {
          domain: "SaaS / Data Tables During Pagination & Filtering",
          title:
            "Filtering a table collapses its height from 520px to a 32px spinner, jumping the scroll position",
          problem:
            "Replacing 10 data rows with a tiny `<Spinner />` whenever `isLoading` is true.",
          application:
            "Render geometry-matched `<Skeleton className='h-[52px]' />` rows or preserve existing rows with `placeholderData: keepPreviousData` in TanStack Query.",
          outcome:
            "Zero vertical container collapse and stable scroll anchoring across filter changes.",
        },
        {
          domain: "Editorial / Typography / Web Font Swap Reflows (`FOUT`)",
          title:
            "Hero headlines reflow from 2 lines to 3 lines when the custom web font finishes loading",
          problem:
            "Fallback system fonts have different glyph widths and x-heights than the custom brand typeface.",
          application:
            "Use `next/font` with automatic metric overrides (`size-adjust`, `ascent-override`, `descent-override`) so the fallback font occupies identical bounding boxes.",
          outcome:
            "Seamless font swap with zero line-wrap changes or vertical shift.",
        },
      ],
    },
  },

  "dedup-optimistic-ui": {
    vi: {
      whenToApply: [
        "Khi nhiều component nằm ở các nhánh khác nhau trên cùng 1 màn hình (Navbar, Sidebar, Trang chính, Footer) đều cần cùng một dữ liệu từ API (như `/api/me`, `/api/cart`, `/api/notifications`, `/api/permissions`).",
        "Khi các thao tác tương tác thường xuyên của người dùng (Thả tim / Like, Đánh dấu sao, Đổi trạng thái công việc Todo/Done, Thêm vào giỏ hàng, Xóa mục) có tỷ lệ thành công > 99% nhưng người dùng lại phải nhìn vòng xoay loading 400ms mỗi lần bấm.",
      ],
      whenNotToApply: [
        "**KHÔNG dùng Optimistic UI** cho các giao dịch tài chính, thanh toán ngân hàng, đặt vé máy bay/phòng khách sạn còn ít chỗ, hoặc thao tác xóa vĩnh viễn không thể khôi phục — những tác vụ này bắt buộc phải chờ Server xác nhận thành công (`200 OK`) mới được báo hoàn tất.",
      ],
      scenarios: [
        {
          domain:
            "SaaS / E-Commerce / 6 Component Cùng Lấy Thông tin User & Giỏ hàng Lúc Mở Trang",
          title:
            "Mở trang chủ thấy tab Network bắn 6 request trùng hệt nhau tới `/api/cart` và `/api/user/profile`",
          problem:
            "`<HeaderAvatar />`, `<SidebarPlanBadge />`, `<CartDrawer />`, `<ProductCard />` mỗi nơi tự viết một `useEffect(() => fetch('/api/user/profile'))` riêng lẻ.",
          application:
            "Chuyển toàn bộ sang dùng chung một hook `useQuery({ queryKey: ['user', 'profile'], queryFn: fetchProfile, staleTime: 60_000 })` của **TanStack Query**. Khi 6 component mount cùng lúc, TanStack Query tự động **gộp (deduplicate)** thành đúng **1 HTTP request duy nhất** và chia sẻ kết quả cho cả 6 nơi.",
          outcome:
            "Giảm 83% số lượng request thừa lên Server và đồng bộ trạng thái tự động trên toàn màn hình.",
        },
        {
          domain:
            "Mạng xã hội / Cộng đồng / Nút Thả tim (Like), Bookmark & Đổi Trạng thái (Toggle)",
          title:
            "Bấm nút 'Lưu bài viết' phải đợi 500ms mạng 3G mới thấy biểu tượng đổi màu",
          problem:
            "Code gọi `await api.bookmark(postId)` xong xuôi rồi mới gọi `setBookmarked(true)`, làm ứng dụng có cảm giác chậm chạp.",
          application:
            "Trong `onMutate` của `useMutation`: hủy các truy vấn đang chạy (`cancelQueries`), lưu bản chụp `previousData`, rồi dùng `queryClient.setQueryData` cập nhật trạng thái đã lưu ngay ở **0ms**. Nếu API lỗi, khôi phục lại `previousData` trong `onError` và báo Toast.",
          outcome:
            "Phản hồi thị giác tức thì ở 0ms; trải nghiệm mượt như ứng dụng Native trên iOS/Android.",
        },
        {
          domain:
            "Quản lý Dự án / Kéo thả Thẻ Công việc Giữa Các Cột Kanban (Trello / Linear)",
          title:
            "Kéo thẻ từ cột 'In Progress' sang cột 'Done' rồi thả tay ra thì thẻ nhảy ngược về cột cũ 400ms rồi mới nhảy sang cột mới",
          problem:
            "Khi thả chuột (`onDrop`), giao diện vẫn hiển thị theo dữ liệu Server cũ trong lúc chờ API `PATCH /tasks/:id` phản hồi.",
          application:
            "Cập nhật ngay vị trí thẻ mới trong cache TanStack Query ngay tại thời điểm `onDrop` (`onMutate`), gửi request cập nhật ngầm ở nền và chỉ `invalidateQueries` nhẹ nhàng trong `onSettled`.",
          outcome:
            "Thẻ công việc nằm im mượt mà tại vị trí mới ngay khi người dùng thả chuột.",
        },
        {
          domain:
            "Ứng dụng Chat / Gửi Tin nhắn Mới (WhatsApp / Messenger Style)",
          title:
            "Bấm Enter gửi tin nhắn nhưng ô chat trống trơn 1 giây sau mới hiện tin vừa gửi",
          problem:
            "Chờ Server lưu vào Database và trả về `messageId` xong mới thêm tin nhắn vào danh sách hiển thị.",
          application:
            "Chèn ngay tin nhắn vào danh sách với `tempId: crypto.randomUUID()` và trạng thái `status: 'sending'` ở 0ms; khi Server trả về bản ghi thật thì thay thế `tempId` bằng `id` chính thức (hoặc hiện nút 'Thử lại' màu đỏ nếu mất mạng).",
          outcome:
            "Người dùng có thể gõ và bấm gửi liên tiếp 5 tin nhắn nhanh không cần chờ đợi.",
        },
      ],
    },
    en: {
      whenToApply: [
        "When multiple components mounted across the page (Navbar, Sidebar, Main Feed, Footer) independently need the same server resource (`/api/me`, `/api/cart`, `/api/notifications`).",
        "When frequent user mutations (Like/Bookmark toggles, Kanban status updates, Todo checkboxes, Cart quantity tweaks) succeed > 99% of the time and shouldn't force the user to wait 400ms on a loading spinner.",
      ],
      whenNotToApply: [
        "**Never use Optimistic UI** for high-stakes irreversible operations like credit card charges, bank transfers, scarce ticket/inventory reservations, or permanent account deletion — always await server confirmation first.",
      ],
      scenarios: [
        {
          domain:
            "SaaS / E-Commerce / 6 Components Fetching User Session & Cart Simultaneously",
          title:
            "Page load fires 6 identical HTTP requests to `/api/user/profile` and `/api/cart`",
          problem:
            "`<HeaderAvatar />`, `<SidebarBadge />`, `<CartTrigger />`, and `<CheckoutBanner />` each run their own isolated `useEffect(() => fetch('/api/user/profile'))`.",
          application:
            "Replace manual `useEffect` fetches with a shared **TanStack Query** hook `useQuery({ queryKey: ['user', 'profile'], queryFn, staleTime: 60_000 })`, which automatically **deduplicates** concurrent mounts into **1 single network request**.",
          outcome:
            "Cuts redundant network traffic by 83% and keeps all 6 components automatically synchronized.",
        },
        {
          domain: "Social / Content Platform / Like, Upvote & Bookmark Toggles",
          title:
            "Clicking 'Bookmark' waits 500ms on mobile networks before the icon fills in",
          problem:
            "Waiting for `await api.toggleBookmark(id)` to resolve before updating local UI state.",
          application:
            "In `useMutation`'s `onMutate`: call `queryClient.cancelQueries()`, snapshot `previousData`, and immediately update cache via `queryClient.setQueryData()` at **0ms**, rolling back in `onError` if the request fails.",
          outcome:
            "Instant 0ms visual feedback with resilient automatic rollback on network failure.",
        },
        {
          domain:
            "Project Management / Drag-and-Drop Kanban Cards (Linear / Trello)",
          title:
            "Dropping a card into the 'Done' column snaps it back to 'In Progress' for 400ms before moving",
          problem:
            "Rendering strictly from stale server state while `PATCH /tasks/:id` is in flight.",
          application:
            "Optimistically move the card in the query cache inside `onMutate` the instant `onDrop` fires, then reconcile quietly in `onSettled`.",
          outcome: "Zero snap-back flicker; drag-and-drop feels instantaneous.",
        },
        {
          domain: "Messaging / Instant Chat Message Sending",
          title:
            "Pressing Enter to send a message leaves a 1-second delay before the bubble appears",
          problem:
            "Waiting for the database round-trip before appending the user's message to the thread.",
          application:
            "Append an optimistic message bubble immediately with a temporary client `id` and `status: 'sending'`, upgrading it to `'sent'` when the server responds.",
          outcome:
            "Users can fire off rapid consecutive messages with zero perceived latency.",
        },
      ],
    },
  },

  "high-frequency-streams": {
    vi: {
      whenToApply: [
        "Khi ứng dụng nhận dữ liệu đẩy về liên tục qua **WebSocket, Server-Sent Events (SSE), WebRTC DataChannel, hoặc sự kiện chuột/cảm biến** với tần suất lớn hơn tần số quét của màn hình (**> 60 bản tin/giây**).",
        "Khi làm màn hình giao dịch tài chính/chứng khoán/crypto, bảng theo dõi thiết bị IoT, bảng log thời gian thực, hoặc nhận luồng token trả về rất nhanh từ mô hình **AI / LLM Streaming**.",
      ],
      whenNotToApply: [
        "Khi WebSocket chỉ dùng để nhận thông báo thưa thớt (ví dụ: có tin nhắn chat mới từ người dùng khác hoặc thông báo đơn hàng 5-10 giây/lần) — lúc đó gọi `setState` bình thường là hoàn toàn ổn.",
      ],
      scenarios: [
        {
          domain:
            "Fintech / Sàn Giao dịch Chứng khoán & Crypto (Orderbook & Live Ticker)",
          title:
            "WebSocket bắn 300 bản tin khớp lệnh/giây làm trình duyệt đơ cứng, không bấm được nút 'Đặt lệnh Mua/Bán'",
          problem:
            "Trong `ws.onmessage = (e) => setOrderbook(prev => merge(prev, e.data))`, gọi `setState` trực tiếp 300 lần/giây. Trong khi màn hình 60Hz chỉ vẽ được 60 lần/giây, 240 lần render còn lại là hoàn toàn vô ích và làm nghẹt cứng Main Thread.",
          application:
            "Gom toàn bộ các bản tin đến trong cùng 1 khung hình vào một bộ đệm **`Map<symbol, LatestTick>`** trong `useRef` (chi phí O(1), không kích hoạt React), và chỉ gọi `flushBufferToStore()` đúng **1 lần duy nhất mỗi nhịp `requestAnimationFrame` (~16.6ms)**.",
          outcome:
            "Tần suất React re-render được khóa trần ở đúng 60 lần/giây bất kể WebSocket bắn 200 hay 2,000 tin/giây; nút 'Đặt lệnh' phản hồi tức thì.",
        },
        {
          domain:
            "AI / LLM Chat Interface (ChatGPT / Claude Streaming Response)",
          title:
            "Khi AI trả lời nhanh kèm nhiều khối code Markdown, màn hình chat bị giật và quạt tản nhiệt quay vù vù",
          problem:
            "SSE bắn về từng token (80-150 token/giây). Mỗi token nhận được lại gọi `setMessages()` khiến bộ parse Markdown + Shiki Syntax Highlighter phải chạy lại từ đầu 150 lần mỗi giây.",
          application:
            "Cộng dồn các chunk văn bản mới nhận được vào biến `pendingTextRef.current += chunk`, và dùng `requestAnimationFrame` (hoặc throttle 32ms = 30fps) để cập nhật state hiển thị định kỳ theo từng khung hình.",
          outcome:
            "Chữ hiện ra mượt mà như nước chảy, giảm 75% tải CPU khi parse Markdown & highlight code.",
        },
        {
          domain:
            "Cộng tác Thời gian thực / Con trỏ Chuột Nhiều Người dùng (Multiplayer Cursors như Figma / Miro)",
          title:
            "20 người cùng di chuột trong 1 phòng làm bảng vẽ tụt FPS thê thảm",
          problem:
            "20 người × 60 sự kiện di chuột/giây = 1,200 gói tin tọa độ mỗi giây; nếu lưu mảng tọa độ vào React State sẽ kích hoạt 1,200 lần render/giây.",
          application:
            "Lưu tọa độ mới nhất của từng `userId` vào `cursorsRef.current.set(userId, { x, y })` và cập nhật vị trí thẻ DOM con trỏ trực tiếp trong vòng lặp `requestAnimationFrame` bằng `el.style.transform = translate3d(x, y, 0)`.",
          outcome:
            "20 con trỏ di chuyển mượt 60-120 FPS với 0 lần React re-render.",
        },
        {
          domain:
            "IoT / Fleet Management / Bản đồ Theo dõi 500 Xe Giao hàng Thời gian thực",
          title:
            "Cập nhật tọa độ GPS của 500 xe mỗi giây làm treo trình duyệt điều phối",
          problem:
            "Mỗi gói tin MQTT báo tọa độ 1 xe lại tạo mảng `vehicles` mới và vẽ lại toàn bộ 500 điểm đánh dấu (markers).",
          application:
            "Đệm các thay đổi tọa độ trong 1 chu kỳ khung hình và đẩy hàng loạt (batch update) xuống tầng GeoJSON / WebGL của bản đồ mỗi 100ms-200ms.",
          outcome: "Bản đồ điều phối mượt mà, zoom/pan không bị khựng.",
        },
      ],
    },
    en: {
      whenToApply: [
        "When ingesting continuous data streams via **WebSockets, Server-Sent Events (SSE), WebRTC DataChannels, or high-frequency pointer/sensor events** arriving faster than the display refresh rate (**> 60 messages/sec**).",
        "When building financial orderbooks, live IoT telemetry dashboards, real-time log tailers, or high-speed **LLM / AI token streaming** interfaces.",
      ],
      whenNotToApply: [
        "Low-frequency WebSocket events (e.g., occasional chat messages or notification toasts arriving every few seconds) where standard `setState` calls are completely fine.",
      ],
      scenarios: [
        {
          domain: "Fintech / Crypto & Stock Exchange Orderbook Terminal",
          title:
            "300 WebSocket ticks/sec freeze the trading terminal and block the 'Place Order' button",
          problem:
            "Calling `setState` directly inside `ws.onmessage` triggers 300 React reconciliations per second even though a 60Hz monitor can only display 60 frames/sec — wasting 80% of work in intermediate renders.",
          application:
            "Buffer incoming ticks inside a mutable **`useRef<Map<symbol, Tick>>`** (O(1) overwrite) and coalesce updates into **1 single state commit per `requestAnimationFrame` (~16.6ms)**.",
          outcome:
            "Caps React commits at exactly 60/sec regardless of whether the socket pushes 200 or 2,000 messages/sec.",
        },
        {
          domain: "AI / LLM Streaming Chat UI (ChatGPT / Claude Style)",
          title:
            "Fast token streaming with Markdown & code blocks spikes CPU to 100% and stutters scrolling",
          problem:
            "SSE emits 80-150 tokens/sec; calling `setMessages` on every token chunk forces full Markdown AST parsing and syntax highlighting 150 times per second.",
          application:
            "Accumulate incoming token chunks in `streamBufferRef.current += delta` and flush to React state once per `requestAnimationFrame` (or every 32ms).",
          outcome:
            "Silky-smooth streaming text rendering with a 75% reduction in main-thread CPU usage.",
        },
        {
          domain:
            "Multiplayer Collaboration / Live Presence Cursors (Figma / Miro)",
          title:
            "20 collaborators moving their cursors simultaneously generates 1,200 events/sec",
          problem:
            "Updating React state on every incoming WebRTC cursor packet triggers over a thousand component renders per second.",
          application:
            "Store latest coordinates per `userId` in a mutable ref map and apply `transform: translate3d(x, y, 0)` in a single `requestAnimationFrame` loop.",
          outcome:
            "20+ live cursors glide at 60-120 FPS with zero React reconciliation overhead.",
        },
        {
          domain:
            "IoT / Logistics / Live Fleet Map Tracking 500 Delivery Vehicles",
          title:
            "Individual GPS MQTT packets re-render all 500 vehicle markers continuously",
          problem:
            "Cloning the 500-item `vehicles` array on every individual telemetry packet.",
          application:
            "Coalesce dirty vehicle coordinates in a frame buffer and batch-commit to the map layer once per frame or tick interval.",
          outcome: "Smooth map panning and zooming under heavy telemetry load.",
        },
      ],
    },
  },

  "heavy-data-grid": {
    vi: {
      whenToApply: [
        "Khi xây dựng các màn hình quản trị dữ liệu lớn (ERP, Kế toán, CRM, Quản lý Kho, Bảng đối soát giao dịch) có từ **5,000 đến 100,000+ dòng** và nhiều cột cần lọc, sắp xếp (Sort), nhóm (Group) và tính tổng tức thì.",
        "Khi thao tác bấm vào tiêu đề cột để Sort hoặc gõ vào ô Filter trên bảng dữ liệu làm đơ giao diện hơn 200ms.",
      ],
      whenNotToApply: [
        "Bảng dữ liệu nhỏ (20-100 dòng mỗi trang) đã được Server phân trang sẵn — dùng bảng `<Table>` chuẩn của shadcn là đủ, không cần phức tạp hóa.",
      ],
      scenarios: [
        {
          domain:
            "ERP / Kế toán / Bảng Sổ cái & Đối soát 50,000 Giao dịch Ngân hàng",
          title:
            "Kế toán viên vừa gõ lọc theo mã hóa đơn vừa bấm sắp xếp cột 'Số tiền' làm trình duyệt treo cứng 2 giây",
          problem:
            "Mỗi lần render đều chạy lại `rows.filter(...).sort(...)` trên 50,000 dòng dữ liệu và vẽ hàng nghìn thẻ `<tr><td>` ra DOM, đồng thời tính lại tổng tiền (Sum/Average) từ đầu.",
          application:
            "Kết hợp bộ 3 kỹ thuật: (1) **Memoized Pipeline** (`useMemo` tách riêng bước Filter và bước Sort), (2) **`useDeferredValue`** cho từ khóa lọc để không chặn phím gõ, và (3) **Row Virtualization (`@tanstack/react-virtual`)** để chỉ vẽ ~25 dòng nằm trong khung nhìn.",
          outcome:
            "Lọc và sắp xếp 50,000 dòng phản hồi mượt mà; DOM luôn giữ dưới 300 nodes và cuộn đạt chuẩn 60 FPS.",
        },
        {
          domain:
            "E-Commerce / Quản lý Tồn kho Đa Chi nhánh (Multi-warehouse Inventory Grid)",
          title:
            "Sửa trực tiếp số lượng tồn kho (Inline Cell Editing) ở 1 ô làm cả bảng 5,000 dòng render lại",
          problem:
            "Khi nhân viên kho gõ sửa số lượng ở dòng thứ 12, cột 4, state mảng `rows` ở cấp bảng bị thay thế khiến toàn bộ các dòng và các ô đang hiển thị đều bị re-render.",
          application:
            "Bọc `React.memo` cho từng `<VirtualRow />` và quản lý giá trị đang gõ cục bộ tại đúng ô `<EditableCell />`, chỉ commit lên store chuẩn hóa theo `rowId` khi `onBlur` hoặc bấm `Enter`.",
          outcome:
            "Gõ sửa số liệu trực tiếp trong ô bảng nhanh tức thì như trên phần mềm Microsoft Excel.",
        },
        {
          domain:
            "SaaS Marketing / Bảng Phân tích Chiến dịch Quảng cáo (50 Cột Chỉ số: CPC, CTR, ROAS...)",
          title:
            "Bảng có 50 cột ngang × 10,000 dòng dọc khiến cả cuộn dọc lẫn cuộn ngang đều giật lag",
          problem:
            "Chỉ ảo hóa chiều dọc (Row Virtualization) nhưng mỗi dòng vẫn phải render đủ 50 thẻ `<td>` kèm định dạng tiền tệ và badge phần trăm.",
          application:
            "Kết hợp cả **Row Virtualization** lẫn **Column Virtualization** (2 chiều 2D Virtualizer của `@tanstack/react-virtual`) để chỉ render ~20 dòng × ~8 cột đang nằm trong màn hình.",
          outcome:
            "Giảm số lượng ô `<td>` từ 500,000 ô xuống chỉ còn ~160 ô thực tế trong DOM.",
        },
        {
          domain:
            "FinOps / Cloud Billing / Bảng Chi phí AWS/GCP Có Dòng Tổng hợp (Pinned Summary Footer)",
          title:
            "Tính lại tổng chi phí, P95 latency và thuế trên 50,000 bản ghi mỗi khi người dùng di chuột qua dòng",
          problem:
            "Đặt hàm `calculateAggregates(filteredRows)` chạy trực tiếp trong thân hàm render của Component bảng mà không bọc `useMemo`, khiến mỗi lần đổi state `hoveredRowId` lại phải cộng tổng lại 50,000 dòng.",
          application:
            "Tính toán các chỉ số tổng hợp (`totalRevenue`, `avgLatency`) trong một `useMemo` chỉ phụ thuộc vào `[filteredRows]`, tách biệt hoàn toàn khỏi state UI (`hoveredRowId`, `selectedRowIds`).",
          outcome: "Di chuột và chọn dòng tốn 0ms tính toán lại.",
        },
      ],
    },
    en: {
      whenToApply: [
        "When building enterprise data views (ERP ledgers, CRM contact lists, inventory matrices, transaction logs) containing **5,000 to 100,000+ rows** with client-side filtering, sorting, and live aggregations.",
        "When clicking a column header to sort or typing into a table filter freezes the UI for > 200ms.",
      ],
      whenNotToApply: [
        "Small server-paginated tables (20-100 rows per page) where a standard semantic `<Table>` is simpler and fast enough.",
      ],
      scenarios: [
        {
          domain: "ERP / Accounting / 50,000-Row Bank Reconciliation Ledger",
          title:
            "Filtering by invoice ID and sorting by 'Amount' freezes the browser for 2 seconds",
          problem:
            "Re-running `rows.filter(...).sort(...)` across 50,000 items on every render while mounting thousands of `<tr><td>` nodes into the DOM.",
          application:
            "Combine a **3-stage architecture**: (1) **Memoized Filter/Sort Pipeline** (`useMemo`), (2) **`useDeferredValue`** on the filter input so typing never blocks, and (3) **Row Virtualization (`@tanstack/react-virtual`)** so only ~25 rows exist in the DOM.",
          outcome:
            "50,000-row filtering and sorting stays responsive with < 300 DOM nodes and 60 FPS scrolling.",
        },
        {
          domain:
            "E-Commerce / Multi-Warehouse Inventory Grid with Inline Cell Editing",
          title:
            "Editing a single stock quantity cell re-renders the entire 5,000-row grid",
          problem:
            "Typing a digit inside row 12, column 4 mutates the top-level `rows` array on every keystroke, forcing every visible row and cell to re-render.",
          application:
            "Colocate transient input state inside the active `<EditableCell />`, wrap `<VirtualRow />` in `React.memo`, and commit normalized updates by `rowId` on `onBlur` or `Enter`.",
          outcome: "Spreadsheet-like 0ms inline editing responsiveness.",
        },
        {
          domain:
            "AdTech / Marketing Analytics Grid (50 Columns × 10,000 Campaigns)",
          title:
            "Wide tables with 50 metric columns (CPC, CTR, ROAS) lag during both horizontal and vertical scrolling",
          problem:
            "Virtualizing rows alone still mounts 50 complex formatted cells per row.",
          application:
            "Combine **2D Row + Column Virtualization** (`useVirtualizer` for both vertical rows and horizontal columns) so only ~20 rows × ~8 visible columns are mounted.",
          outcome:
            "Reduces active cell count from 500,000 down to ~160 DOM cells.",
        },
        {
          domain:
            "FinOps / Cloud Billing Table with Live Pinned Summary Footer",
          title:
            "Hovering over table rows recalculates 50,000-row sum and P95 aggregates",
          problem:
            "Running `computeTotals(filteredRows)` directly in the component render body without memoization, causing hover state updates (`hoveredRowId`) to re-sum 50,000 records.",
          application:
            "Isolate summary aggregations inside `useMemo(() => computeTotals(filteredRows), [filteredRows])` decoupled from hover or selection state.",
          outcome: "0ms aggregation overhead during row hover and selection.",
        },
      ],
    },
  },

  "input-responsiveness": {
    vi: {
      whenToApply: [
        "Khi làm ô **Tìm kiếm tức thì (Instant Search / Autocomplete)**, bộ lọc danh mục kết hợp gọi API, hoặc tự động lưu bản nháp (`Auto-save`) khi người dùng đang gõ.",
        "Khi người dùng gõ nhanh một từ khóa (ví dụ `'react'`) rồi xóa đi gõ từ khác, nhưng **kết quả của từ khóa cũ trả về muộn hơn lại đè lên kết quả của từ khóa mới nhất** (lỗi kinh điển **Out-of-Order Race Condition**).",
      ],
      whenNotToApply: [
        "Các form chỉ gửi dữ liệu khi người dùng chủ động bấm nút `Submit` / `Tìm kiếm`.",
      ],
      scenarios: [
        {
          domain:
            "E-Commerce / Thanh Tìm kiếm Sản phẩm Gợi ý Tức thì (Header Search Autocomplete)",
          title:
            "Khách gõ `'iphone'` nhưng danh sách gợi ý bên dưới lại hiện kết quả của chữ `'ip'`",
          problem:
            "Khách gõ `'ip'` (Request #1 tốn 600ms do Server phải quét rộng) rồi gõ tiếp `'iphone'` (Request #2 chỉ tốn 150ms do phạm vi hẹp). Request #2 trả về trước hiển thị kết quả đúng của `'iphone'`, nhưng 450ms sau Request #1 mới về tới và gọi `setResults(res1)` **ghi đè kết quả cũ lên màn hình!**",
          application:
            "Gắn **`AbortController`** vào mỗi lần gọi `fetch(url, { signal })` (hoặc dùng `queryFn: ({ signal }) => ...` của TanStack Query) để **hủy ngay lập tức (`abort()`)** Request #1 ngay khoảnh khắc khách gõ thêm ký tự tiếp theo.",
          outcome:
            "Triệt tiêu 100% lỗi hiển thị sai kết quả do mạng trả về lệch thứ tự (Stale Response Race Condition) và tiết kiệm băng thông.",
        },
        {
          domain: "SaaS / Bộ lọc Chuyển đổi Nhanh Giữa Các Danh mục / Trang",
          title:
            "Bấm nhanh từ Tab 'Đơn hàng Hôm nay' sang Tab 'Đơn hàng Đã hủy' nhưng màn hình lại hiện dữ liệu của Tab đầu tiên",
          problem:
            "API của Tab 'Đơn hàng Hôm nay' nặng hơn nên trả về sau API của Tab 'Đơn hàng Đã hủy'. Vì không hủy request cũ khi chuyển tab, dữ liệu trả về muộn ghi đè lên state.",
          application:
            "Dùng `AbortController` trong cleanup của `useEffect` (hoặc dùng `queryKey: ['orders', activeTab]` trong TanStack Query) để bỏ qua hoặc hủy mọi phản hồi của tab đã bị người dùng rời đi.",
          outcome:
            "Dữ liệu hiển thị trên màn hình luôn khớp 100% với Tab đang được chọn.",
        },
        {
          domain:
            "Travel / Booking / Tìm Chuyến bay & Khách sạn Kết hợp Kiểm tra Giá Thời gian thực",
          title:
            "Mỗi lần người dùng bấm tăng số lượng hành khách hoặc đổi ngày đi là bắn hàng chục request kiểm tra giá",
          problem:
            "Người dùng bấm nút `+` 4 lần liên tiếp để chọn 4 hành khách, kích hoạt 4 API tính giá nặng trên Server cùng lúc.",
          application:
            "Kết hợp **Debounce (200ms)** cho hành động gọi API mạng + **Urgent Local State** cho con số hiển thị trên nút `+` (lên số 4 ngay lập tức) + **`AbortController`** hủy request tính giá cũ nếu khách bấm tiếp.",
          outcome:
            "Giao diện nhảy số tức thì ở 0ms nhưng chỉ gửi đúng 1 request tính giá cuối cùng lên Server.",
        },
        {
          domain:
            "Cloud Docs / Trình soạn thảo Tự động Lưu (Real-time Auto-Save)",
          title:
            "Đang gõ văn bản liên tục mà hàm Auto-save gửi từng chữ một lên Server gây nghẽn mạng và xung đột phiên bản",
          problem:
            "Gọi API `PUT /documents/:id` ngay trong `onChange` hoặc không hủy request lưu trước đó khi có bản sửa mới hơn.",
          application:
            "Tách trạng thái gõ chữ cục bộ khỏi bộ lập lịch Auto-save (Debounce 800ms kèm `AbortController` cho các request đang bay).",
          outcome:
            "Soạn thảo mượt mà, không bao giờ bị ghi đè bản lưu mới bằng bản lưu cũ.",
        },
      ],
    },
    en: {
      whenToApply: [
        "When building **Instant Search / Autocomplete** inputs, live API-backed filters, or real-time document **Auto-save** workflows.",
        "When typing quickly or switching filters causes an **older, slower network response to resolve after a newer, faster response and overwrite the UI with stale data** (Out-of-Order Race Condition).",
      ],
      whenNotToApply: [
        "Forms that only trigger a network request on explicit button `Submit`.",
      ],
      scenarios: [
        {
          domain: "E-Commerce / Header Search Autocomplete Dropdown",
          title:
            "User types `'iphone'` quickly, but the dropdown flashes and settles on stale results for `'ip'`",
          problem:
            "Query `'ip'` (Request #1, broad match taking 600ms) is followed by `'iphone'` (Request #2, narrow match taking 150ms). Request #2 resolves first, then Request #1 finishes 450ms later and overwrites the UI with stale `'ip'` results.",
          application:
            "Pass an **`AbortController` signal** to `fetch(url, { signal })` (or use TanStack Query's built-in `{ signal }` in `queryFn`) coupled with a ~180ms debounce so superseded in-flight requests are aborted immediately.",
          outcome:
            "100% elimination of out-of-order race conditions and wasted network requests.",
        },
        {
          domain: "SaaS / Rapid Category or Date-Range Filter Switching",
          title:
            "Clicking 'Today' then quickly clicking 'Cancelled' displays 'Today's' orders under the 'Cancelled' tab",
          problem:
            "The heavier 'Today' endpoint resolves after the fast 'Cancelled' endpoint and mutates shared state without checking if the filter is still active.",
          application:
            "Abort the previous fetch inside `useEffect` cleanup (`controller.abort()`) or key queries by `['orders', activeTab]` in TanStack Query.",
          outcome:
            "Displayed data is guaranteed to match the active filter tab.",
        },
        {
          domain: "Travel & Hospitality / Live Flight & Hotel Fare Calculator",
          title:
            "Clicking the passenger `+` stepper 4 times fires 4 expensive pricing API calls concurrently",
          problem:
            "Triggering unthrottled pricing queries on every stepper click overloads backend pricing engines.",
          application:
            "Update the passenger counter UI synchronously at 0ms, debounce the API call by 200ms, and abort any in-flight fare calculation if the user clicks again.",
          outcome:
            "Instant UI counter feedback while sending only 1 final pricing request.",
        },
        {
          domain: "Collaborative Docs / Cloud Document Auto-Save",
          title:
            "Continuous typing triggers overlapping `PUT /doc` requests that overwrite newer edits",
          problem:
            "Firing uncoordinated save requests without cancelling in-flight saves when new keystrokes occur.",
          application:
            "Decouple local editor state from a debounced, abort-aware background save pipeline.",
          outcome:
            "Zero version conflicts or lost characters during rapid typing.",
        },
      ],
    },
  },

  "code-splitting-prefetch": {
    vi: {
      whenToApply: [
        "Khi trang web có những tính năng rất nặng (Trình soạn thảo Rich-Text, Bộ vẽ Biểu đồ 3D/Canvas, Trình xem PDF, Hộp thoại Cài đặt nâng cao, Modal Xuất Báo cáo) **không hiển thị ngay khi vừa mở trang** mà chỉ xuất hiện khi người dùng bấm nút mở.",
        "Khi dung lượng gói JS ban đầu (**Initial Entry JS Bundle**) quá lớn (> 200KB gzipped) làm chậm thời gian **LCP / TTI** và tăng **TBT** trên thiết bị di động.",
      ],
      whenNotToApply: [
        "**KHÔNG dùng `next/dynamic({ ssr: false })` cho phần tử chính tạo nên LCP nằm ngay đầu trang (Above-the-Fold)** như Hero Banner, Tiêu đề chính hay Danh sách sản phẩm đầu trang — vì làm vậy sẽ bắt trình duyệt tải xong JS rồi mới tải tiếp chunk con, làm LCP chậm đi rất nhiều!",
      ],
      scenarios: [
        {
          domain:
            "SaaS / Workspace / Hộp thoại Trình soạn thảo Nặng (Rich-Text / Code / Конструктор Modal)",
          title:
            "90% người vào trang chỉ để đọc bài viết, nhưng 100% người dùng đều phải tải thêm 380KB bộ thư viện Rich-Text Editor dùng cho nút 'Chỉnh sửa'",
          problem:
            "Import tĩnh `import { HeavyEditorModal } from './heavy-editor'` ở đầu file khiến trình duyệt phải tải, giải nén và biên dịch thêm 380KB JavaScript ngay lúc mở trang.",
          application:
            "Tách bằng **`next/dynamic(() => import('./heavy-editor'), { ssr: false })`**, VÀ gắn sự kiện **`onMouseEnter` / `onFocus`** lên nút 'Chỉnh sửa' để gọi trước `import('./heavy-editor')` ngay khi người dùng vừa rê chuột tới gần nút (trước khi bấm khoảng 150-250ms).",
          outcome:
            "Trang chính nhẹ đi 380KB lúc mới mở, nhưng khi người dùng bấm vào nút 'Chỉnh sửa', Modal vẫn bật lên tức thì ở **0ms độ trễ mạng** vì chunk đã được tải sẵn trong lúc rê chuột!",
        },
        {
          domain:
            "E-Commerce / Tính năng Xem Trước PDF Hóa đơn & Thử Đồ 3D / AR",
          title:
            "Nút 'Xem Hóa đơn PDF' (`pdfjs-dist` 450KB) hoặc 'Xem ảnh 360 độ' (`three.js` 600KB) làm nặng toàn bộ trang Thanh toán",
          problem:
            "Đóng gói chung thư viện `pdfjs` hoặc `three.js` vào bundle chính của trang đơn hàng.",
          application:
            "Cô lập hoàn toàn trình xem PDF / 3D vào một dynamic chunk riêng biệt và chỉ preload khi người dùng cuộn tới vùng chứa nút bấm hoặc rê chuột vào nút.",
          outcome:
            "Tốc độ tải trang Thanh toán nhanh gấp đôi trên mạng 4G di động.",
        },
        {
          domain:
            "B2B Dashboard / Hệ thống Много-Tab (Tab 'Cấu hình Webhook', Tab 'Nhật ký Audit')",
          title:
            "Trang Cài đặt có 8 Tab nhưng người dùng thường chỉ vào Tab 1, trong khi code của cả 8 Tab đều bị tải ngay từ đầu",
          problem:
            "Import trực tiếp cả 8 component Tab lớn vào cùng một file `SettingsPage.tsx`.",
          application:
            "Dùng Dynamic Import cho 7 Tab phụ, kết hợp **Prefetch on Hover** khi người dùng di chuột lên thanh tiêu đề của từng Tab.",
          outcome:
            "Giảm 70% lượng JavaScript phải thực thi lúc mở trang Cài đặt mà việc chuyển Tab vẫn mượt tức thì.",
        },
        {
          domain:
            "Admin / Tính năng Xuất File Excel (`xlsx` / `exceljs`) khi Bấm Nút",
          title:
            "Thư viện `xlsx` nặng 300KB chỉ dùng đúng lúc bấm nút 'Download Excel' nhưng lại được import ở đầu file",
          problem:
            "`import * as XLSX from 'xlsx'` ở đầu file component bắt mọi lượt tải trang đều phải gánh 300KB.",
          application:
            "Xóa import ở đầu file! Gọi trực tiếp **`const XLSX = await import('xlsx')` ngay bên trong hàm xử lý sự kiện `onClick`** của nút Download.",
          outcome:
            "Loại bỏ 100% thư viện `xlsx` khỏi bundle khởi tạo mà không cần tạo thêm component phức tạp.",
        },
      ],
    },
    en: {
      whenToApply: [
        "When a route includes heavy interactive features (Rich-Text Editors, 3D/WebGL viewers, PDF renderers, complex Chart Studios, Export Modals) that are **hidden behind a button click, modal, or secondary tab**.",
        "When the **Initial Entry JS Bundle** exceeds ~200KB gzipped and inflates **TBT / TTI** on mobile devices.",
      ],
      whenNotToApply: [
        "**Never lazy-load above-the-fold LCP content** (Hero banners, primary headings, initial product grids) with `ssr: false` — doing so creates a sequential JS-to-Chunk waterfall that severely degrades LCP.",
      ],
      scenarios: [
        {
          domain: "SaaS / Knowledge Base / Heavy Rich-Text Editor Modal",
          title:
            "90% of visitors only read articles, yet 100% download a 380KB Rich-Text Editor bundle used only by the 'Edit' modal",
          problem:
            "Top-level static `import { HeavyEditorModal } from './heavy-editor'` bundles 380KB of editor code into the initial page entry.",
          application:
            "Split the modal via **`next/dynamic(() => import('./heavy-editor'), { ssr: false })`**, and attach an **`onMouseEnter` / `onFocus`** handler on the 'Edit' button to warm the `import()` chunk 150-250ms before the click happens.",
          outcome:
            "Saves 380KB on initial page load while delivering a **0ms perceived modal open** on click.",
        },
        {
          domain:
            "E-Commerce / PDF Invoice Viewer (`pdfjs`) & 3D Product Preview (`three.js`)",
          title:
            "Bundling `pdfjs-dist` (450KB) or `three.js` (600KB) into the main Order Details page",
          problem:
            "Every customer checking their order status pays the parse and compile cost of a 3D/PDF engine they rarely open.",
          application:
            "Isolate the viewer in an async chunk and preload on button hover or viewport intersection.",
          outcome:
            "Cuts initial JavaScript parse/compile time in half on mobile devices.",
        },
        {
          domain: "B2B Admin / Multi-Tab Settings & Audit Log Views",
          title:
            "A settings page with 8 complex tabs eagerly bundles all 8 tabs on initial load",
          problem:
            "Static imports for all 8 tabs inflate the route bundle even though users typically interact with only 1 tab.",
          application:
            "Code-split secondary tabs with `next/dynamic` and trigger `preload()` when the pointer hovers over a tab trigger.",
          outcome:
            "Reduces initial route JS by 70% with instant tab transitions.",
        },
        {
          domain:
            "Enterprise Reporting / On-Demand Excel Export (`xlsx` / `exceljs`)",
          title:
            "Importing a 300KB `xlsx` library at the top of a file just for a 'Download Excel' button",
          problem:
            "Top-level `import * as XLSX from 'xlsx'` bloats the main bundle for an action triggered only on click.",
          application:
            "Remove the top-level import and dynamically load the library inside the click handler: **`const XLSX = await import('xlsx')`**.",
          outcome:
            "Completely removes the 300KB library from the initial bundle.",
        },
      ],
    },
  },

  "barrel-files-treeshaking": {
    vi: {
      whenToApply: [
        "Khi dự án có thói quen tạo các file **`index.ts` (Barrel Files)** gom hàng chục/hàng trăm component, icon, helper (`export * from './...'`) vào một chỗ để import cho gọn.",
        "Khi bạn chỉ import 1 hàm nhỏ hoặc 1 chiếc nút `<Button />` từ `@/components` nhưng khi chạy `@next/bundle-analyzer` lại thấy cả thư viện biểu đồ `recharts`, `date-fns`, hoặc hàng trăm icon không dùng bị kéo theo vào bundle.",
        "Khi tốc độ khởi động `next dev` hoặc chạy test Vitest/Jest ngày càng chậm chạp khi dự án lớn lên.",
      ],
      whenNotToApply: [
        'Điểm neo public API của một thư viện nhỏ được xuất bản lên npm đã được cấu hình chuẩn `"sideEffects": false` trong `package.json` và không có bất kỳ đoạn code khởi tạo top-level nào.',
      ],
      scenarios: [
        {
          domain: "Monorepo / Design System Nội bộ (`@/components/index.ts`)",
          title:
            "Trang Đăng nhập siêu nhẹ chỉ dùng đúng `<Button>` và `<Input>` nhưng lại tải kèm 400KB thư viện Biểu đồ và Trình soạn thảo",
          problem:
            "Lập trình viên viết `import { Button, Input } from '@/components'`. File `@/components/index.ts` lại re-export cả `RichTextEditor`, `ChartDashboard`, `MapPicker`. Một vài file trong đó có biến khởi tạo ở cấp module (Top-level side effect), khiến Bundler không dám cắt bỏ (Tree-shake) mà phải đóng gói tất cả vào trang Đăng nhập!",
          application:
            "Xóa bỏ Barrel File cấp cao nhất và **import trực tiếp từ đường dẫn gốc (Direct Path Import)**: `import { Button } from '@/components/ui/button'` kết hợp khai báo `\"sideEffects\": false` trong `package.json`.",
          outcome:
            "Dung lượng JS của trang Đăng nhập giảm ngay từ 420KB xuống chỉ còn 12KB.",
        },
        {
          domain:
            "Bộ Icon & Tiện ích Đa năng (`lucide-react`, `@mui/icons-material`, `lodash`)",
          title:
            "Import `import _ from 'lodash'` hoặc tạo file `utils/index.ts` gom cả `formatDate`, `exportPdf`, `cryptoHash`",
          problem:
            "Khi một Server Action hoặc Client Component chỉ cần gọi hàm `formatCurrency()`, việc đi qua `utils/index.ts` vô tình nạp luôn cả module `exportPdf` nặng nề vào đồ thị phụ thuộc (Module Graph).",
          application:
            "Chia nhỏ các file tiện ích theo từng miền độc lập (`@/lib/format-currency`, `@/lib/export-pdf`) và cấu hình `experimental.optimizePackageImports` trong `next.config.ts` cho các thư viện UI/Icon bên thứ ba.",
          outcome:
            "Giảm 90% số lượng module phải phân tích trong Module Graph.",
        },
        {
          domain:
            "Developer Experience / Tăng tốc Độ Khởi động `next dev` & Chạy Unit Test (Vitest / Jest)",
          title:
            "Chạy 1 file test đơn giản cho component `<Badge />` nhưng mất tới 8 giây mới chạy xong",
          problem:
            "File test import từ `@/features`, kéo theo việc Node.js phải đọc và biên dịch dây chuyền 600 file TypeScript khác nằm trong chuỗi `export * from` của các file `index.ts`.",
          application:
            "Loại bỏ các chuỗi Barrel Files lồng nhau (`features/index.ts` → `orders/index.ts` → `components/index.ts`) và trỏ import trực tiếp tới file cần dùng.",
          outcome:
            "Thời gian chạy Unit Test giảm từ 8 giây xuống 0.4 giây; tốc độ Hot Reload (HMR) nhanh tức thì.",
        },
        {
          domain:
            "Fullstack Next.js / Vô tình Kéo Code Server hoặc Secret vào Client Bundle qua Barrel File",
          title:
            "Client Component chỉ import 1 hằng số `ORDER_STATUS` từ `orders/index.ts` nhưng làm lỗi build vì dính `db.ts`",
          problem:
            "File `orders/index.ts` vừa export hằng số dùng chung, vừa `export * from './order-repository'` (nơi có import `pg` / `prisma` chỉ chạy trên Server).",
          application:
            "Tách biệt tuyệt đối file hằng số/types (`orders/constants.ts`) khỏi file xử lý Server (`orders/repository.server.ts`) và không gộp chung qua `index.ts`.",
          outcome:
            "Ngăn chặn triệt để lỗi rò rỉ module Server sang Client Bundle.",
        },
      ],
    },
    en: {
      whenToApply: [
        "When your codebase uses **`index.ts` Barrel Files** (`export * from './...'`) that aggregate dozens of components, hooks, or utilities into a single entry point.",
        "When importing a single `<Button />` from `@/components` unexpectedly pulls `recharts`, `pdfjs`, or hundreds of unused modules into your route bundle in `@next/bundle-analyzer`.",
        "When local dev server cold-starts (`next dev`) or Vitest/Jest unit tests become sluggish as the repo grows.",
      ],
      whenNotToApply: [
        'Small, published leaf packages with strict `"sideEffects": false` in `package.json` and zero top-level module initialization.',
      ],
      scenarios: [
        {
          domain: "Monorepo / Internal Design System (`@/components/index.ts`)",
          title:
            "A simple Login page importing `{ Button, Input } from '@/components'` downloads 400KB of chart and editor code",
          problem:
            "`@/components/index.ts` re-exports 150 components including `ChartStudio` and `RichTextEditor`. Any top-level side effect inside those modules prevents tree-shaking and forces the bundler to include them in the Login route.",
          application:
            "Replace barrel imports with **Direct Path Imports** (`import { Button } from '@/components/ui/button'`) and declare `\"sideEffects\": false` in `package.json`.",
          outcome: "Login route JS bundle drops from 420KB down to 12KB.",
        },
        {
          domain:
            "Shared Utilities & Icon Libraries (`utils/index.ts`, `lodash`)",
          title:
            "Calling `formatCurrency()` via `@/utils` drags `pdfGenerator` and `xlsxParser` into the bundle",
          problem:
            "A central `utils/index.ts` barrel couples lightweight string formatters with heavy document generation modules in the module graph.",
          application:
            "Import leaf modules directly (`@/lib/format-currency`) and configure `experimental.optimizePackageImports` in `next.config.ts` for large third-party icon/component packages.",
          outcome: "Eliminates 90% of unnecessary module graph traversal.",
        },
        {
          domain: "Developer Experience / Slow Vitest / Jest Test Runs & HMR",
          title:
            "Running a single unit test for `<Badge />` takes 8 seconds to boot",
          problem:
            "Importing through nested `index.ts` barrels forces the test runner to parse and evaluate 600 transitive TypeScript files.",
          application:
            "Remove nested barrel chains and use direct file imports across features.",
          outcome:
            "Unit test execution drops from 8s to 0.4s with near-instant HMR.",
        },
        {
          domain:
            "Next.js App Router / Accidental Server-Module Leakage into Client Components",
          title:
            "A Client Component importing `ORDER_STATUS` from `orders/index.ts` crashes the build due to `prisma` imports",
          problem:
            "The barrel file re-exports both client-safe constants and server-only database repositories.",
          application:
            "Split constants into `orders/constants.ts` and server logic into `orders/repository.server.ts` without a shared barrel.",
          outcome: "Cleanly enforces client/server module boundaries.",
        },
      ],
    },
  },

  "third-party-isolation": {
    vi: {
      whenToApply: [
        "Khi trang web phải nhúng nhiều công cụ của bên thứ ba: **Live Chat Widget (Intercom, Zendesk, Crisp, Messenger), Google Tag Manager (GTM), Meta Pixel, TikTok Pixel, Hotjar/Clarity (Session Replay), Bản đồ Google Maps, hoặc Khung bình luận/YouTube**.",
        "Khi code ứng dụng của bạn đã được tối ưu rất kỹ nhưng điểm PageSpeed Insights trên Mobile vẫn thấp (chỉ 45-65 điểm) do **Total Blocking Time (TBT)** bị các script bên thứ ba chiếm tới 600ms-1,500ms.",
      ],
      whenNotToApply: [
        "Các script bắt buộc phải chạy trước khi trang hiển thị để đảm bảo bảo mật hoặc chống nháy giao diện (ví dụ: Script kiểm tra Cookie Consent pháp lý bắt buộc hoặc Script đồng bộ Dark/Light Theme vài dòng).",
      ],
      scenarios: [
        {
          domain:
            "E-Commerce / SaaS / Khung Chat Hỗ trợ Khách hàng (Intercom / Zendesk / Crisp / Facebook Customer Chat)",
          title:
            "Nhúng widget Live Chat làm trang chủ chậm đi 1.2 giây dù 98% người truy cập không bấm mở hộp chat",
          problem:
            "Nhúng trực tiếp thẻ `<script src='...'>` của Live Chat vào `<head>`. Ngay khi mở trang, widget này tải thêm 450KB JS, tạo iframe ẩn, kết nối WebSocket và làm nghẽn Main Thread đúng lúc trình duyệt đang cố vẽ nội dung chính.",
          application:
            "Áp dụng mẫu **Static Lightweight Facade (Vỏ bọc Tĩnh)**: Ban đầu chỉ vẽ một nút `<button>` HTML/CSS thuần túy (nặng < 1KB) giống hệt biểu tượng chat ở góc dưới. Chỉ khi người dùng **rê chuột (`onMouseEnter`) hoặc bấm (`onClick`)** vào nút đó thì mới nạp SDK thật của Intercom/Zendesk!",
          outcome:
            "Tiết kiệm 100% chi phí tải và thực thi 450KB script của Live Chat lúc mở trang; điểm PageSpeed Mobile tăng vọt +25 điểm.",
        },
        {
          domain:
            "Marketing / Landing Page / Nhúng Video YouTube / Vimeo hoặc Bản đồ Google Maps",
          title:
            "Trang giới thiệu sản phẩm có 3 video YouTube nhúng bằng `<iframe>` làm tải thêm 2.5MB JS ngay khi mở trang",
          problem:
            "Mỗi thẻ `<iframe src='https://www.youtube.com/embed/...'>` tự động tải toàn bộ trình phát YouTube Player cùng hệ thống theo dõi quảng cáo ngay cả khi người dùng chưa hề bấm Play.",
          application:
            "Sử dụng **YouTube / Map Facade** (`@next/third-parties/google` `<YouTubeEmbed>` hoặc hiển thị ảnh bìa `<Image>` + nút Play SVG; chỉ thay thế bằng `<iframe>` có `autoplay=1` sau khi người dùng bấm Play).",
          outcome:
            "Giảm 2.5MB dung lượng tải ban đầu và loại bỏ hoàn toàn các Long Task của trình phát video bên thứ ba.",
        },
        {
          domain:
            "Growth / Analytics / Google Tag Manager, Meta Pixel, TikTok Pixel & Hotjar",
          title:
            "5 bộ script Tracking của đội Marketing tranh giành CPU với React Hydration làm đơ cú cuộn trang đầu tiên",
          problem:
            "Các script tracking chạy đồng bộ ngay trong giai đoạn tải trang ban đầu, quét toàn bộ DOM và gắn hàng loạt listener.",
          application:
            "Sử dụng `<Script strategy='lazyOnload' />` của Next.js (trì hoãn tới lúc trình duyệt rảnh rỗi `requestIdleCallback` sau khi trang đã tải xong hoàn toàn) hoặc đẩy sang chạy trên **Web Worker qua Partytown (`strategy='worker'`)**.",
          outcome:
            "Giảm `TBT` (Total Blocking Time) từ > 600ms xuống < 50ms mà vẫn giữ nguyên 100% dữ liệu đo lường cho đội Marketing.",
        },
        {
          domain:
            "FinTech / E-Commerce / Cổng Thanh toán & Xác thực Captcha (Stripe / PayPal / Turnstile)",
          title:
            "Nạp SDK thanh toán trên mọi trang dù khách hàng đang ở trang đọc Blog hoặc xem Danh mục",
          problem:
            "Đặt `<Script src='https://js.stripe.com/v3/' />` ở `app/layout.tsx` cấp gốc khiến mọi trang đều phải tải SDK thanh toán.",
          application:
            "Chỉ nạp SDK tại đúng layout của trang `/checkout`, hoặc preload khi người dùng bấm vào nút 'Xem Giỏ hàng'.",
          outcome:
            "Giữ cho toàn bộ các trang khám phá sản phẩm và nội dung sạch bóng script bên thứ ba không cần thiết.",
        },
      ],
    },
    en: {
      whenToApply: [
        "When embedding third-party scripts and widgets: **Live Chat SDKs (Intercom, Zendesk, Crisp), Google Tag Manager (GTM), Meta/TikTok Pixels, Session Replay tools (Hotjar, Clarity, FullStory), Google Maps, or YouTube embeds**.",
        "When your first-party React code is fast, yet Lighthouse Mobile scores remain low (45-65) because third-party scripts add 600ms-1,500ms of **Total Blocking Time (TBT)**.",
      ],
      whenNotToApply: [
        "Strictly synchronous security or compliance scripts that must execute before first paint (e.g., mandatory region-blocking consent gates).",
      ],
      scenarios: [
        {
          domain:
            "SaaS / E-Commerce / Customer Support Live Chat Widget (Intercom / Zendesk / Crisp)",
          title:
            "Loading the Live Chat SDK upfront adds 1.2s of blocking time even though 98% of visitors never open the chat",
          problem:
            "Injecting the third-party chat `<script>` in `<head>` downloads 450KB of JS, boots hidden iframes, and opens WebSockets right during critical page hydration.",
          application:
            "Replace the eager SDK with a **Static Lightweight Facade**: render a < 1KB first-party HTML/CSS launcher button, and dynamically inject the real Intercom/Zendesk SDK only on **`onMouseEnter` (hover intent) or `onClick`**.",
          outcome:
            "Eliminates 100% of the 450KB chat SDK cost during initial page load, boosting Mobile Lighthouse scores by +20-25 points.",
        },
        {
          domain:
            "Marketing / Landing Page / Embedded YouTube Videos & Interactive Google Maps",
          title:
            "Three embedded YouTube `<iframe>` players download 2.5MB of JavaScript before the user even scrolls",
          problem:
            "Standard `<iframe>` embeds eagerly initialize full media player runtimes and ad trackers on initial page load.",
          application:
            "Use a **Click-to-Load Facade** (such as `@next/third-parties/google` `<YouTubeEmbed>` or a lightweight thumbnail `<Image>` + SVG play button that mounts the real `<iframe>` with `autoplay=1` on click).",
          outcome:
            "Saves 2.5MB of initial network payload and zeroes out third-party iframe Long Tasks.",
        },
        {
          domain:
            "Growth / Marketing / Google Tag Manager, Meta Pixel & Session Replay (Hotjar / Clarity)",
          title:
            "5 marketing analytics scripts compete with React hydration and freeze the first scroll",
          problem:
            "Eagerly loaded tracking scripts scan the DOM and run heavy serialization on the Main Thread during startup.",
          application:
            "Defer non-critical trackers with Next.js `<Script strategy='lazyOnload' />` (scheduled during browser idle time) or offload them to a Web Worker via **Partytown (`strategy='worker'`)**.",
          outcome:
            "Drops Total Blocking Time (`TBT`) from > 600ms to < 50ms without losing analytics events.",
        },
        {
          domain:
            "E-Commerce / Payment & Fraud SDKs (Stripe / PayPal / Captcha)",
          title:
            "Loading heavy checkout payment SDKs globally in `app/layout.tsx` across every blog and catalog page",
          problem:
            "Placing payment `<Script>` tags in the root layout forces every visitor to download and parse checkout scripts on every route.",
          application:
            "Scope third-party payment SDKs strictly to the `/checkout` layout or preload them on Cart drawer open.",
          outcome:
            "Keeps catalog and content pages completely free of checkout SDK overhead.",
        },
      ],
    },
  },
}
