import { NextRequest, NextResponse } from "next/server"

let serverHitCount = 0

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const step = searchParams.get("step") ?? "default"
  const q = searchParams.get("q") ?? ""
  const resetCounter = searchParams.get("reset") === "1"
  const rawDelay = Number(searchParams.get("delay") ?? "320")
  const delay = Math.min(
    3000,
    Math.max(0, Number.isNaN(rawDelay) ? 320 : rawDelay)
  )

  if (resetCounter) {
    serverHitCount = 0
  }
  serverHitCount += 1
  const currentHit = serverHitCount

  if (delay > 0) {
    await sleep(delay)
  }

  if (step === "user") {
    return NextResponse.json({
      step: "user",
      hitCount: currentHit,
      latencyMs: delay,
      data: {
        id: "usr_senior_01",
        name: "Nguyễn Minh Quân",
        role: "Principal Frontend Architect",
        orgId: "org_vn_fintech",
      },
    })
  }

  if (step === "team") {
    return NextResponse.json({
      step: "team",
      hitCount: currentHit,
      latencyMs: delay,
      data: {
        teamName: "Core Web Platform & Performance",
        members: 14,
        sloTarget: "P95 INP < 80ms, LCP < 1.8s",
      },
    })
  }

  if (step === "analytics") {
    return NextResponse.json({
      step: "analytics",
      hitCount: currentHit,
      latencyMs: delay,
      data: {
        p75LcpMs: 1420,
        p75InpMs: 48,
        p75Cls: 0.02,
        activeSessions: 128450,
      },
    })
  }

  if (step === "audit") {
    return NextResponse.json({
      step: "audit",
      hitCount: currentHit,
      latencyMs: delay,
      data: {
        recentDeploys: [
          {
            id: "dep_901",
            summary: "Enable React Virtualizer on OrderGrid",
            delta: "-78% DOM",
          },
          {
            id: "dep_902",
            summary: "Offload CSV parser to Web Worker",
            delta: "-410ms TBT",
          },
          {
            id: "dep_903",
            summary: "Replace Barrel imports with direct paths",
            delta: "-142KB Gzip",
          },
        ],
      },
    })
  }

  if (step === "search") {
    const items = [
      "React Fiber Reconciliation & Bailout",
      "Main Thread Long Task & Scheduler.yield()",
      "TanStack Virtual Windowing Architecture",
      "Zustand Atomic Selectors vs Context Bloat",
      "Web Worker & OffscreenCanvas Pipeline",
      "Detached DOM Nodes & Heap Snapshot Profiling",
      "Cumulative Layout Shift (CLS) & Aspect Ratio",
      "Request Deduplication & Optimistic Mutation",
      "Barrel File Tree-Shaking Traps in Webpack/Turbopack",
      "Forced Synchronous Layout (Layout Thrashing)",
    ].filter((item) => item.toLowerCase().includes(q.toLowerCase()))

    return NextResponse.json({
      step: "search",
      query: q,
      hitCount: currentHit,
      latencyMs: delay,
      results: items,
    })
  }

  return NextResponse.json({
    step,
    hitCount: currentHit,
    latencyMs: delay,
    timestamp: new Date().toISOString(),
    metrics: {
      cpuLoad: 24,
      cacheHitRatio: "98.4%",
      edgeRegion: "SGN-01 (Ho Chi Minh)",
    },
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const delay = Math.min(3000, Math.max(50, Number(body.delay ?? 650)))
  const shouldFail = Boolean(body.shouldFail)

  await sleep(delay)

  if (shouldFail) {
    return NextResponse.json(
      {
        ok: false,
        error: "Simulated 503 Server Error — Rollback triggered!",
      },
      { status: 503 }
    )
  }

  return NextResponse.json({
    ok: true,
    updatedAt: new Date().toISOString(),
    payload: body,
  })
}
