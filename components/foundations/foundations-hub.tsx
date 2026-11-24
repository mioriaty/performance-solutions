"use client"

import React from "react"
import Link from "next/link"
import { useLocale } from "next-intl"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Cpu,
  Lightbulb,
  Network,
} from "lucide-react"
import { FOUNDATION_TOPICS } from "@/lib/foundations/catalog"
import type { Locale } from "@/i18n/request"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function FoundationsHub() {
  const locale = useLocale() as Locale
  const isVi = locale === "vi"

  return (
    <div className="mx-auto max-w-[1460px] p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6">
        {/* Header Card */}
        <Card className="bg-stage-grid gap-3 p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="amber">01. Foundations</Badge>
            <Badge variant="sky">
              {FOUNDATION_TOPICS.length} Core Architectural Guides
            </Badge>
          </div>
          <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground sm:text-[32px] sm:leading-[1.15]">
            {isVi
              ? "Kiến Thức Nền Tảng Hệ Thống & Runtime"
              : "Runtime & Network Foundations"}
          </h1>
          <p className="max-w-3xl text-[15px] leading-relaxed text-muted-foreground">
            {isVi
              ? "Nền tảng lý thuyết và mô phỏng trực quan giúp bạn hiểu tận gốc cách trình duyệt điều phối luồng thực thi (Event Loop, Pixel Pipeline 16.67ms) và cách vận hành kết nối thời gian thực (WebSocket, Peak-Time Scaling & Failure Resilience) trước khi bước vào 18 bài Lab."
              : "Core browser runtime and real-time networking mental models—covering the JavaScript Event Loop, 16.67ms Pixel Pipeline, and production WebSocket resilience under peak traffic and network failures."}
          </p>
        </Card>

        {/* 2 Foundation Lesson Cards */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {FOUNDATION_TOPICS.map((topic, index) => {
            const Icon = topic.slug === "event-loop" ? Cpu : Network
            return (
              <Card key={topic.slug} className="justify-between gap-5">
                <CardHeader className="gap-3 pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={index === 0 ? "amber" : "sky"}>
                      <Icon />
                      <span>
                        {topic.code} · {topic.badge}
                      </span>
                    </Badge>
                    <span className="font-mono text-xs text-muted-foreground">
                      Lesson {index + 1} of {FOUNDATION_TOPICS.length}
                    </span>
                  </div>
                  <CardTitle className="text-xl">
                    {topic.title[locale]}
                  </CardTitle>
                  <CardDescription className="text-[14px] leading-relaxed">
                    {topic.summary[locale]}
                  </CardDescription>
                </CardHeader>

                <CardContent className="gap-4">
                  <div className="flex flex-wrap gap-1.5">
                    {topic.metrics.map((m) => (
                      <Badge key={m} variant="secondary">
                        {m}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2 border-t border-border pt-4">
                    <div className="font-mono text-[10.5px] font-bold tracking-wider text-muted-foreground uppercase">
                      {isVi ? "BẠN SẼ NẮM VỮNG:" : "YOU'LL LEARN:"}
                    </div>
                    <ul className="flex flex-col gap-2 text-[13.5px] leading-relaxed text-foreground/90">
                      {topic.highlights[locale].map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-foreground" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter className="border-t border-border pt-4">
                  <Button
                    variant="default"
                    className="w-full justify-between"
                    render={<Link href={topic.href} />}
                    nativeButton={false}
                  >
                    <span className="inline-flex items-center gap-2">
                      <BookOpen className="size-4" />
                      <span>
                        {isVi
                          ? `Mở bài học: ${topic.shortTitle.vi}`
                          : `Open Lesson: ${topic.shortTitle.en}`}
                      </span>
                    </span>
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* Recommended Learning Path Callout */}
        <Alert variant="goodToKnow" className="p-5">
          <Lightbulb />
          <AlertTitle>
            {isVi ? "LỘ TRÌNH KHUYẾN NGHỊ" : "RECOMMENDED LEARNING PATH"}
          </AlertTitle>
          <AlertDescription>
            {isVi
              ? "Hoàn thành F1 (Event Loop & Pixel Pipeline) và F2 (WebSocket Resilience) ở chương 01 trước khi thực hành 18 bài Lab từ chương 02 đến 07 để nắm chắc bản chất bên dưới trình duyệt."
              : "Complete F1 (Event Loop & Pixel Pipeline) and F2 (WebSocket Resilience) in Chapter 01 before diving into Chapters 02–07 to build a rock-solid mental model."}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
