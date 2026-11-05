export interface EventLoopStep {
  stepNumber: number
  phase:
    | "Sync / Call Stack"
    | "Microtask Queue"
    | "rAF / Render Pipeline"
    | "Macrotask Queue"
  callStack: string[]
  microtasks: string[]
  rafQueue: string[]
  macrotasks: string[]
  consoleOutput: string[]
  explanation: {
    vi: string
    en: string
  }
}

export interface EventLoopScenario {
  id: string
  title: {
    vi: string
    en: string
  }
  subtitle: {
    vi: string
    en: string
  }
  code: string
  steps: EventLoopStep[]
}

export const EVENT_LOOP_SCENARIOS: EventLoopScenario[] = [
  {
    id: "standard-order",
    title: {
      vi: "1. Thứ tự chuẩn: Sync vs. Microtask vs. rAF vs. Macrotask",
      en: "1. Standard Tick Order: Sync vs. Microtask vs. rAF vs. Macrotask",
    },
    subtitle: {
      vi: "Tại sao Promise.then luôn chạy trước requestAnimationFrame và setTimeout(..., 0)?",
      en: "Why does Promise.then always execute before requestAnimationFrame and setTimeout(..., 0)?",
    },
    code: `console.log("1. Sync Start");

setTimeout(() => {
  console.log("5. Macrotask (setTimeout 0ms)");
}, 0);

requestAnimationFrame(() => {
  console.log("4. Render Phase (rAF before Paint)");
});

Promise.resolve().then(() => {
  console.log("3. Microtask #1 (Promise.then)");
  queueMicrotask(() => {
    console.log("3b. Microtask #2 (Nested queueMicrotask)");
  });
});

console.log("2. Sync End");`,
    steps: [
      {
        stepNumber: 1,
        phase: "Sync / Call Stack",
        callStack: ["<script> (Main)", 'console.log("1. Sync Start")'],
        microtasks: [],
        rafQueue: [],
        macrotasks: [],
        consoleOutput: ["1. Sync Start"],
        explanation: {
          vi: "Trình duyệt bắt đầu thực thi script chính (được coi là Macrotask đầu tiên) trên **Call Stack**. Dòng `1. Sync Start` được in ra ngay lập tức.",
          en: "The browser begins executing the main script (treated as the initial Macrotask) on the **Call Stack**. `1. Sync Start` logs synchronously.",
        },
      },
      {
        stepNumber: 2,
        phase: "Sync / Call Stack",
        callStack: ["<script> (Main)", 'console.log("2. Sync End")'],
        microtasks: ["Promise.then callback"],
        rafQueue: ["rAF callback"],
        macrotasks: ["setTimeout callback (0ms)"],
        consoleOutput: ["1. Sync Start", "2. Sync End"],
        explanation: {
          vi: "Trong khi chạy đồng bộ, `setTimeout` đẩy callback vào **Macrotask Queue**, `requestAnimationFrame` đăng ký callback vào **rAF Queue** (chờ nhịp VSync), và `Promise.resolve().then` đẩy job vào **Microtask Queue**. Cuối cùng in ra `2. Sync End` và Call Stack rỗng.",
          en: "During synchronous execution, `setTimeout` enqueues a **Macrotask**, `requestAnimationFrame` registers a **rAF callback**, and `Promise.then` enqueues a **Microtask**. Finally, `2. Sync End` logs and the Call Stack becomes empty.",
        },
      },
      {
        stepNumber: 3,
        phase: "Microtask Queue",
        callStack: ["Promise.then callback", "queueMicrotask(...)"],
        microtasks: ["Nested queueMicrotask callback"],
        rafQueue: ["rAF callback"],
        macrotasks: ["setTimeout callback (0ms)"],
        consoleOutput: [
          "1. Sync Start",
          "2. Sync End",
          "3. Microtask #1 (Promise.then)",
        ],
        explanation: {
          vi: "**Quy tắc vàng #1**: Ngay khi Call Stack trống, Event Loop lập tức kiểm tra **Microtask Queue** trước tiên. Callback `Promise.then` chạy, in ra `3. Microtask #1` và đẻ thêm 1 microtask con bằng `queueMicrotask`.",
          en: "**Golden Rule #1**: As soon as the Call Stack is empty, the Event Loop immediately drains the **Microtask Queue**. `Promise.then` runs, logs `3. Microtask #1`, and enqueues a nested `queueMicrotask`.",
        },
      },
      {
        stepNumber: 4,
        phase: "Microtask Queue",
        callStack: ["Nested queueMicrotask callback"],
        microtasks: [],
        rafQueue: ["rAF callback"],
        macrotasks: ["setTimeout callback (0ms)"],
        consoleOutput: [
          "1. Sync Start",
          "2. Sync End",
          "3. Microtask #1 (Promise.then)",
          "3b. Microtask #2 (Nested queueMicrotask)",
        ],
        explanation: {
          vi: "**Quy tắc vàng #2 (Drain Exhaustively)**: Event Loop **không chuyển bước** cho tới khi Microtask Queue rỗng hoàn toàn (`length === 0`). Do đó `3b. Microtask #2` vừa mới sinh ra cũng được thực thi ngay trong cùng tick này!",
          en: "**Golden Rule #2 (Exhaustive Drain)**: The Event Loop **will not advance** until the Microtask Queue is completely empty (`length === 0`). The newly enqueued `3b. Microtask #2` executes immediately in the same tick.",
        },
      },
      {
        stepNumber: 5,
        phase: "rAF / Render Pipeline",
        callStack: ["rAF callback", "[Browser Style -> Layout -> Paint]"],
        microtasks: [],
        rafQueue: [],
        macrotasks: ["setTimeout callback (0ms)"],
        consoleOutput: [
          "1. Sync Start",
          "2. Sync End",
          "3. Microtask #1 (Promise.then)",
          "3b. Microtask #2 (Nested queueMicrotask)",
          "4. Render Phase (rAF before Paint)",
        ],
        explanation: {
          vi: "Sau khi Microtask Queue đã cạn và đến nhịp **VSync (16.67ms ở màn hình 60Hz)**, trình duyệt bước vào **Render Opportunity**: chạy toàn bộ `requestAnimationFrame` callbacks (`4. Render Phase`), sau đó tính toán **Style → Layout → Paint → Composite** để vẽ khung hình mới lên màn hình.",
          en: "Once the Microtask Queue is empty and the **VSync boundary (16.67ms @ 60Hz)** arrives, the browser enters the **Render Opportunity**: running `requestAnimationFrame` callbacks (`4. Render Phase`) followed by **Style → Layout → Paint → Composite**.",
        },
      },
      {
        stepNumber: 6,
        phase: "Macrotask Queue",
        callStack: ["setTimeout callback (0ms)"],
        microtasks: [],
        rafQueue: [],
        macrotasks: [],
        consoleOutput: [
          "1. Sync Start",
          "2. Sync End",
          "3. Microtask #1 (Promise.then)",
          "3b. Microtask #2 (Nested queueMicrotask)",
          "4. Render Phase (rAF before Paint)",
          "5. Macrotask (setTimeout 0ms)",
        ],
        explanation: {
          vi: "Bắt đầu vòng lặp Event Loop tiếp theo: Event Loop lấy **đúng 1 Macrotask** từ đầu hàng đợi (`setTimeout`) đưa lên Call Stack và in ra `5. Macrotask`.",
          en: "The next Event Loop iteration begins: the loop pops **exactly 1 Macrotask** (`setTimeout`) onto the Call Stack and logs `5. Macrotask`.",
        },
      },
    ],
  },
  {
    id: "microtask-starvation",
    title: {
      vi: "2. Bẫy Microtask Starvation vs. Cooperative Macrotask Yielding",
      en: "2. Microtask Starvation Trap vs. Cooperative Macrotask Yielding",
    },
    subtitle: {
      vi: "Tại sao chia nhỏ vòng lặp bằng Promise.resolve() vẫn làm đơ cứng trình duyệt không khác gì vòng lặp đồng bộ?",
      en: "Why splitting a heavy loop with Promise.resolve() still freezes the browser just like a synchronous loop",
    },
    code: `// ANTI-PATTERN: Microtask Starvation (Blocks Paint & Input!)
function processWithMicrotasks(items: number[]) {
  let i = 0;
  function nextMicrotask() {
    if (i >= items.length) return;
    heavyWork(items[i++]);
    // Enqueues back into Microtask Queue -> Render step NEVER reached!
    queueMicrotask(nextMicrotask);
  }
  nextMicrotask();
}

// PRODUCTION PATTERN: Yield to Main Thread (Allows Input & Paint!)
async function processWithYield(items: number[]) {
  let sliceStart = performance.now();
  for (const item of items) {
    heavyWork(item);
    if (performance.now() - sliceStart >= 5) {
      // Yields past Microtask Queue -> Browser can handle Input & Paint!
      await scheduler.yield();
      sliceStart = performance.now();
    }
  }
}`,
    steps: [
      {
        stepNumber: 1,
        phase: "Microtask Queue",
        callStack: ["nextMicrotask (i = 0)"],
        microtasks: ["nextMicrotask (i = 1)"],
        rafQueue: ["Pending UI Paint (BLOCKED)"],
        macrotasks: ["User Click Event (BLOCKED)"],
        consoleOutput: ["[Microtask #1] Running heavyWork(0)..."],
        explanation: {
          vi: "Khi `nextMicrotask` gọi đệ quy `queueMicrotask(nextMicrotask)`, nó liên tục nhét thêm việc mới vào chính **Microtask Queue** đang được rút cạn.",
          en: "When `nextMicrotask` recursively calls `queueMicrotask(nextMicrotask)`, it keeps refilling the very **Microtask Queue** currently being drained.",
        },
      },
      {
        stepNumber: 2,
        phase: "Microtask Queue",
        callStack: ["nextMicrotask (i = 999)"],
        microtasks: ["nextMicrotask (i = 1000)"],
        rafQueue: ["Pending UI Paint (STARVED 500ms!)"],
        macrotasks: ["User Click Event (STARVED 500ms!)"],
        consoleOutput: [
          "[Microtask #1] Running heavyWork(0)...",
          "[Microtask #1000] Still draining microtasks... UI is frozen!",
        ],
        explanation: {
          vi: "**Hiện tượng Microtask Starvation (Đói luồng)**: Vì Event Loop bắt buộc phải rút cạn 100% Microtask Queue trước khi sang bước Render hoặc Macrotask, cả **Browser Paint** lẫn **User Click Event** đều bị bỏ đói suốt 500ms!",
          en: "**Microtask Starvation**: Because the Event Loop must drain 100% of the Microtask Queue before moving to Render or Macrotasks, both **Browser Paint** and **User Click Events** are starved for 500ms!",
        },
      },
      {
        stepNumber: 3,
        phase: "rAF / Render Pipeline",
        callStack: ["await scheduler.yield()", "[Browser Paint + Input]"],
        microtasks: [],
        rafQueue: [],
        macrotasks: ["Resume processWithYield continuation"],
        consoleOutput: [
          "--- Switched to scheduler.yield() ---",
          "[5ms budget reached] Yielding to Browser...",
          "[Browser] Processed User Click & Painted 60 FPS Frame!",
        ],
        explanation: {
          vi: "Ngược lại, khi dùng `await scheduler.yield()` (hoặc `MessageChannel` / `setTimeout`), phần việc tiếp theo được xếp vào **hàng đợi sau khi Render**, cho phép Microtask Queue rỗng để trình duyệt xử lý ngay cú Click của người dùng và vẽ khung hình 60 FPS!",
          en: "By contrast, `await scheduler.yield()` (or `MessageChannel`) schedules the continuation **after the Render opportunity**, allowing the Microtask Queue to empty so the browser immediately processes user input and paints a 60 FPS frame.",
        },
      },
    ],
  },
  {
    id: "react-19-frame-lifecycle",
    title: {
      vi: "3. Vòng đời 1 Khung hình trong React 19: Fiber, useLayoutEffect & useEffect",
      en: "3. React 19 Frame Lifecycle: Fiber, useLayoutEffect & useEffect",
    },
    subtitle: {
      vi: "Chính xác thì useLayoutEffect và useEffect nằm ở đâu so với bước Browser Paint?",
      en: "Where exactly do useLayoutEffect and useEffect run relative to Browser Paint?",
    },
    code: `function TooltipBox() {
  const boxRef = useRef<HTMLDivElement>(null);

  // 1. Runs SYNCHRONOUSLY after DOM mutation, BEFORE Browser Paint!
  useLayoutEffect(() => {
    const rect = boxRef.current!.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      boxRef.current!.style.transform = "translateX(-100%)";
    }
  }, []);

  // 2. Runs ASYNCHRONOUSLY AFTER Browser Paint has completed!
  useEffect(() => {
    sendAnalyticsPing("tooltip_opened");
  }, []);

  return <div ref={boxRef}>Tooltip Content</div>;
}`,
    steps: [
      {
        stepNumber: 1,
        phase: "Sync / Call Stack",
        callStack: [
          "React Render Phase (beginWork / completeWork)",
          "React Commit Phase (appendChild / DOM mutation)",
        ],
        microtasks: [],
        rafQueue: [],
        macrotasks: ["Schedule Passive useEffect"],
        consoleOutput: [
          "1. React updates DOM nodes in memory (Not painted on screen yet)",
        ],
        explanation: {
          vi: "Khi state thay đổi, React chạy **Render Phase** (tính toán Fiber Tree) rồi bước vào **Commit Phase**: cập nhật các thuộc tính và node thật trên cây DOM. Lưu ý: lúc này màn hình **chưa hề vẽ (Paint)** những thay đổi đó!",
          en: "When state updates, React runs the **Render Phase** (reconciling the Fiber tree) and enters the **Commit Phase**: mutating actual DOM nodes. Critically, the screen **has not painted** these DOM changes yet!",
        },
      },
      {
        stepNumber: 2,
        phase: "Sync / Call Stack",
        callStack: ["React CommitLayoutEffects", "useLayoutEffect callback"],
        microtasks: [],
        rafQueue: [],
        macrotasks: ["Schedule Passive useEffect"],
        consoleOutput: [
          "1. React updates DOM nodes in memory (Not painted on screen yet)",
          "2. useLayoutEffect measures rect & adjusts transform BEFORE Paint",
        ],
        explanation: {
          vi: "Ngay lập tức và **đồng bộ trước khi trình duyệt kịp Paint**, React gọi toàn bộ **`useLayoutEffect`**. Nếu bạn đo `getBoundingClientRect()` và chỉnh lại tọa độ Tooltip ở đây, người dùng sẽ nhìn thấy Tooltip xuất hiện ngay ở vị trí đúng mà **không bao giờ bị nháy (flicker) 1 frame ở vị trí sai**!",
          en: "Synchronously **before the browser can Paint**, React executes all **`useLayoutEffect`** hooks. Measuring `getBoundingClientRect()` and adjusting coordinates here guarantees the user never sees a 1-frame visual flicker!",
        },
      },
      {
        stepNumber: 3,
        phase: "rAF / Render Pipeline",
        callStack: ["[Browser Style -> Layout -> Paint -> Composite]"],
        microtasks: [],
        rafQueue: [],
        macrotasks: ["Flush Passive useEffect"],
        consoleOutput: [
          "1. React updates DOM nodes in memory (Not painted on screen yet)",
          "2. useLayoutEffect measures rect & adjusts transform BEFORE Paint",
          "3. [BROWSER PAINT] Pixels are rasterized and displayed on monitor!",
        ],
        explanation: {
          vi: "React giải phóng Call Stack. Trình duyệt thực hiện **Style → Layout → Paint → Composite** để đẩy điểm ảnh ra màn hình. Đó là lý do nếu bạn viết code nặng trong `useLayoutEffect`, bạn sẽ **chặn đứng bước Paint này**!",
          en: "React releases the Call Stack. The browser runs **Style → Layout → Paint → Composite** and presents the pixels to the screen. This is why heavy work inside `useLayoutEffect` blocks visual paint!",
        },
      },
      {
        stepNumber: 4,
        phase: "Macrotask Queue",
        callStack: ["flushPassiveEffects", "useEffect callback"],
        microtasks: [],
        rafQueue: [],
        macrotasks: [],
        consoleOutput: [
          "1. React updates DOM nodes in memory (Not painted on screen yet)",
          "2. useLayoutEffect measures rect & adjusts transform BEFORE Paint",
          "3. [BROWSER PAINT] Pixels are rasterized and displayed on monitor!",
          "4. useEffect runs AFTER Paint (sends analytics / fetches data)",
        ],
        explanation: {
          vi: "**Sau khi người dùng đã nhìn thấy khung hình mới trên màn hình**, React mới chạy các **`useEffect` (Passive Effects)** để gọi API, gắn log analytics hoặc đăng ký subscription mà không làm chậm tốc độ hiển thị giao diện.",
          en: "**After the new frame is already visible on the user's screen**, React flushes **`useEffect` (Passive Effects)** so logging, analytics, and subscriptions never delay visual paint.",
        },
      },
    ],
  },
]

export interface PipelineStageInfo {
  id: string
  step: number
  name: string
  thread: "Main Thread" | "Compositor + GPU Threads"
  costLevel: "High (CPU)" | "Medium (CPU)" | "Ultra-Low (GPU)"
  summary: {
    vi: string
    en: string
  }
  details: {
    vi: string[]
    en: string[]
  }
  relatedLabs: { code: string; slug: string; label: string }[]
}

export const PIXEL_PIPELINE_STAGES: PipelineStageInfo[] = [
  {
    id: "javascript",
    step: 1,
    name: "1. JavaScript Execution",
    thread: "Main Thread",
    costLevel: "High (CPU)",
    summary: {
      vi: "Thực thi Event Handlers, React Reconciliation (Render Phase), xử lý dữ liệu và cập nhật DOM.",
      en: "Executes Event Handlers, React Reconciliation (Render Phase), data processing, and DOM mutations.",
    },
    details: {
      vi: [
        "Mọi sự kiện tương tác (`click`, `keydown`, `input`), timers, hay phản hồi mạng đều bắt đầu bằng việc chạy JavaScript trên **Main Thread**.",
        "Trong React, bước này bao gồm việc gọi lại hàm Component, so sánh cây Virtual DOM (Fiber Diffing) và gọi các lệnh thay đổi DOM (`appendChild`, `setAttribute`).",
        "Nếu bước JavaScript tốn **> 10ms** trong tổng ngân sách **16.67ms (60Hz)**, trình duyệt chỉ còn chưa đầy 6ms cho cả 4 bước tiếp theo (Style, Layout, Paint, Composite) → Rất dễ bị rớt khung hình (Frame Drop / Jank)!",
      ],
      en: [
        "Every interaction (`click`, `keydown`, `input`), timer, or network callback begins by executing JavaScript on the **Main Thread**.",
        "In React, this includes running component functions, reconciling the Fiber tree, and applying DOM mutations (`appendChild`, `setAttribute`).",
        "If JavaScript consumes **> 10ms** of the **16.67ms (60Hz)** frame budget, fewer than 6ms remain for Style, Layout, Paint, and Composite combined — causing dropped frames!",
      ],
    },
    relatedLabs: [
      { code: "1.1", slug: "rerender-storms", label: "Re-render Storms" },
      { code: "1.2", slug: "concurrent-react", label: "Concurrent React" },
      { code: "2.1", slug: "long-tasks-yielding", label: "Long Tasks & Yield" },
      { code: "2.2", slug: "web-workers-offload", label: "Web Workers" },
    ],
  },
  {
    id: "style",
    step: 2,
    name: "2. Style Calculation (Recalculate Style)",
    thread: "Main Thread",
    costLevel: "Medium (CPU)",
    summary: {
      vi: "Khớp các bộ chọn CSS (Selectors) và tính toán bảng Computed Style cuối cùng cho từng phần tử DOM.",
      en: "Matches CSS selectors and computes the final ComputedStyle map for every affected DOM element.",
    },
    details: {
      vi: [
        "**Cơ chế ít người biết**: Trình duyệt đọc và khớp CSS Selector **từ phải sang trái**! Ví dụ với `.sidebar ul li a.active`, trình duyệt phải tìm tất cả thẻ `a.active` trước rồi mới leo ngược lên kiểm tra `li`, `ul`, `.sidebar`.",
        "Chi phí của bước **Recalculate Style** tỷ lệ thuận trực tiếp với **Số lượng phần tử DOM hiện có trên trang**: khoảng 50% thời gian là dùng để khớp selector và 50% là để tạo `ComputedStyle`.",
        "Đó là lý do vì sao khi trang có **10,000 DOM nodes** (chưa ảo hóa), chỉ cần bật/tắt 1 class ở thẻ cha cũng khiến bước Recalculate Style tốn hàng chục mili-giây!",
      ],
      en: [
        "**Browser Engine Fact**: Browsers evaluate CSS selectors **from right to left**! For `.sidebar ul li a.active`, the engine finds every `a.active` first and walks up the ancestor tree.",
        "**Recalculate Style** cost scales linearly with **total live DOM node count**: ~50% of time is spent matching selectors and ~50% constructing `ComputedStyle` representations.",
        "When an unvirtualized page mounts **10,000+ DOM nodes**, toggling a single class on a parent container triggers a massive multi-millisecond Style recalculation pass.",
      ],
    },
    relatedLabs: [
      { code: "1.3", slug: "dom-virtualization", label: "DOM Virtualization" },
      { code: "5.2", slug: "heavy-data-grid", label: "50k Data Grid" },
    ],
  },
  {
    id: "layout",
    step: 3,
    name: "3. Layout (Reflow)",
    thread: "Main Thread",
    costLevel: "High (CPU)",
    summary: {
      vi: "Tính toán tọa độ hình học (x, y) và kích thước chính xác (width, height) của mọi hộp phần tử trên trang.",
      en: "Calculates exact geometric coordinates (x, y) and bounding dimensions (width, height) of every box in the Layout Tree.",
    },
    details: {
      vi: [
        "Sau khi biết một thẻ `<div>` có `width: 50%` và `padding: 16px` ở bước Style, bước **Layout (Reflow)** sẽ quy đổi ra con số pixel tuyệt đối trên màn hình (ví dụ `width = 640px, height = 128px, top = 240px`).",
        "Layout là một phép toán **có tính dây chuyền (Cascading)**: thay đổi chiều cao của 1 phần tử ở đầu trang thường buộc trình duyệt phải tính lại vị trí của toàn bộ các phần tử nằm bên dưới nó.",
        "**Forced Synchronous Layout (Layout Thrashing)**: Bình thường trình duyệt gom các thay đổi và chỉ chạy Layout 1 lần cuối frame. Nhưng nếu code JS của bạn vừa sửa `el.style.width` xong lại đọc ngay `el.offsetWidth`, bạn **ép trình duyệt phải chạy Layout ngay lập tức giữa lúc đang chạy JS**!",
      ],
      en: [
        "Once Style resolves rules like `width: 50%`, **Layout (Reflow)** computes exact pixel geometry (`width = 640px, y = 240px`) across the Layout Tree.",
        "Layout is **cascading**: mutating the height of a box near the top of the document invalidates the positions of almost every element below it.",
        "**Forced Synchronous Layout (Layout Thrashing)**: Normally layout runs once at the end of the frame. Reading `el.offsetWidth` or `getBoundingClientRect()` immediately after mutating `el.style.width` forces the engine to execute Layout synchronously inside your JS loop!",
      ],
    },
    relatedLabs: [
      { code: "2.3", slug: "layout-thrashing", label: "Layout Thrashing" },
      { code: "4.2", slug: "cls-layout-shifts", label: "Zero CLS" },
    ],
  },
  {
    id: "paint",
    step: 4,
    name: "4. Paint (Repaint & Display List)",
    thread: "Main Thread",
    costLevel: "Medium (CPU)",
    summary: {
      vi: "Ghi lại danh sách các lệnh vẽ (vẽ chữ, tô màu nền, vẽ đường viền, đổ bóng box-shadow) cho từng lớp hiển thị.",
      en: "Records paint instructions (draw text, fill background, stroke borders, render box-shadows) into Display Lists.",
    },
    details: {
      vi: [
        "Khi đã có vị trí và kích thước từ bước Layout, bước **Paint** sẽ tạo ra danh sách các lệnh vẽ chi tiết: vẽ hình chữ nhật màu `#0f172a` tại `(0,0)`, vẽ bóng mờ `box-shadow`, vẽ chữ `'Hello'`.",
        "Các thuộc tính như **`box-shadow` lớn, `filter: blur()` không tách layer, hoặc `background-image` gradient phức tạp** là những tác nhân làm bước Paint tốn nhiều thời gian nhất.",
        "Nếu bạn chỉ đổi `background-color` hoặc `color` (không đổi kích thước), trình duyệt sẽ **bỏ qua bước Layout** và đi thẳng từ `Style → Paint → Composite`.",
      ],
      en: [
        "With geometry finalized, **Paint** records ordered drawing calls (`fillRect`, `drawText`, `drawShadow`) into a Display List.",
        "Properties like **large `box-shadow`s, unpromoted `filter: blur()`, and complex gradients** are the most expensive operations during Paint and Rasterization.",
        "Changing only visual properties like `background-color` or `color` (without changing geometry) **skips Layout** and jumps straight from `Style → Paint → Composite`.",
      ],
    },
    relatedLabs: [
      { code: "2.3", slug: "layout-thrashing", label: "Layout vs Composite" },
    ],
  },
  {
    id: "composite",
    step: 5,
    name: "5. Composite & GPU Rasterization",
    thread: "Compositor + GPU Threads",
    costLevel: "Ultra-Low (GPU)",
    summary: {
      vi: "Chia các Compositing Layers thành Tiles, chuyển thành điểm ảnh trên GPU và ghép chồng các lớp để xuất ra màn hình.",
      en: "Splits Compositing Layers into tiles, rasterizes bitmaps on GPU worker threads, and composites layers onto the screen.",
    },
    details: {
      vi: [
        "**Vũ khí bí mật của hiệu năng 120 FPS**: Bước Composite diễn ra trên **Compositor Thread và GPU**, hoàn toàn tách biệt khỏi Main Thread!",
        "Khi bạn tạo hiệu ứng chuyển động chỉ bằng **`transform` (`translate3d`, `scale`, `rotate`) và `opacity`**, trình duyệt **BỎ QUA cả Layout lẫn Paint trên Main Thread** và chỉ nhờ GPU dịch chuyển/pha trộn tấm ảnh Layer có sẵn.",
        "Nhờ đó, ngay cả khi Main Thread đang bận chạy JS, các animation dùng `transform` / `opacity` (hoặc CSS `@keyframes` / Web Animations API chạy trên Compositor) vẫn mượt 60-120 FPS!",
      ],
      en: [
        "**The Secret to 120 FPS Animations**: Compositing runs on the **Compositor Thread and GPU**, completely off the Main Thread!",
        "When you animate exclusively using **`transform` (`translate3d`, `scale`, `rotate`) and `opacity`**, the browser **SKIPS both Layout and Paint on the Main Thread** and simply instructs the GPU to transform existing layer textures.",
        "Even if the Main Thread is busy running JavaScript, compositor-driven `transform` and `opacity` animations continue running smoothly at 60-120 FPS.",
      ],
    },
    relatedLabs: [
      { code: "2.3", slug: "layout-thrashing", label: "GPU Compositor" },
      { code: "5.1", slug: "high-frequency-streams", label: "rAF Batching" },
    ],
  },
]

export interface CssTriggerCategory {
  tier: string
  badgeColor: "amber" | "blue" | "emerald"
  pipelinePath: string[]
  threadImpact: {
    vi: string
    en: string
  }
  properties: string[]
  recommendation: {
    vi: string
    en: string
  }
}

export const CSS_TRIGGER_CATEGORIES: CssTriggerCategory[] = [
  {
    tier: "Tier 1: Layout + Paint + Composite (Đắt nhất / Most Expensive)",
    badgeColor: "amber",
    pipelinePath: ["Style", "Layout (Reflow)", "Paint", "Composite"],
    threadImpact: {
      vi: "Chạy nặng trên Main Thread + tính lại hình học các phần tử xung quanh",
      en: "Heavy Main-Thread CPU cost + cascades geometry recalculation to neighbors",
    },
    properties: [
      "width / height",
      "top / left / right / bottom",
      "margin / padding",
      "display / position",
      "font-size / line-height",
      "border-width",
      "flex / grid templates",
    ],
    recommendation: {
      vi: "Tuyệt đối KHÔNG dùng trong animation (`requestAnimationFrame` hoặc `@keyframes`) hay sự kiện `scroll`/`mousemove`. Thay `top/left` bằng `transform: translate3d(x, y, 0)` và thay `width/height` bằng `transform: scale()`.",
      en: "Never animate these inside `scroll`/`mousemove` handlers or `@keyframes`. Replace `top/left` with `transform: translate3d(x, y, 0)` and `width/height` animations with `transform: scale()`.",
    },
  },
  {
    tier: "Tier 2: Paint + Composite (Trung bình / Moderate Cost)",
    badgeColor: "blue",
    pipelinePath: ["Style", "Paint (Repaint)", "Composite"],
    threadImpact: {
      vi: "Bỏ qua Layout nhưng vẫn tốn Main Thread tạo Display List & GPU Rasterize",
      en: "Skips Layout, but still runs Main-Thread Display List recording & GPU rasterization",
    },
    properties: [
      "color / background-color",
      "background-image / gradient",
      "border-color / border-radius",
      "box-shadow / text-shadow",
      "outline",
      "visibility",
    ],
    recommendation: {
      vi: "An toàn cho hiệu ứng hover đơn giản (`transition-colors`), nhưng tránh animate `box-shadow` lớn trên hàng chục thẻ cùng lúc (mẹo: tạo một thẻ giả `::after` có sẵn `box-shadow` rồi chỉ animate `opacity` của thẻ `::after` đó!).",
      en: "Safe for simple hover states (`transition-colors`), but avoid animating large `box-shadow` radii across many cards (pro tip: pre-render the shadow on a `::after` pseudo-element and animate its `opacity` instead!).",
    },
  },
  {
    tier: "Tier 3: Composite Only (Rẻ nhất — Chuẩn 60/120 FPS GPU)",
    badgeColor: "emerald",
    pipelinePath: ["Style", "Composite (GPU Thread)"],
    threadImpact: {
      vi: "0ms Layout, 0ms Paint — Thực thi trực tiếp trên Compositor Thread & GPU",
      en: "0ms Layout, 0ms Paint — Offloaded directly to the Compositor Thread & GPU",
    },
    properties: [
      "transform: translate3d(x, y, z)",
      "transform: scale() / rotate()",
      "opacity",
      "filter (khi phần tử đã được tách Compositing Layer riêng)",
    ],
    recommendation: {
      vi: "Luôn ưu tiên số 1 cho mọi chuyển động kéo thả, trượt Drawer/Modal, Parallax, Skeleton Shimmer và Virtual Scroll (`translateY`). Chỉ dùng `will-change: transform` vừa đủ cho phần tử sắp chuyển động để tránh tốn bộ nhớ GPU VRAM.",
      en: "The gold standard for drag-and-drop, drawers/modals, parallax, skeleton shimmers, and virtualized lists (`translateY`). Apply `will-change: transform` sparingly only to actively animating elements to conserve GPU VRAM.",
    },
  },
]
