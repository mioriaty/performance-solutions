import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { WorkbenchSidebar } from "@/components/layout/workbench-sidebar"
import { PerformanceHud } from "@/components/hud/performance-hud"
import { cn } from "@/lib/utils"

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans-next",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  variable: "--font-mono-next",
  display: "swap",
})

export const metadata: Metadata = {
  title:
    "Senior FE Performance Lab — Technical Documentation & Interactive Guide",
  description:
    "Interactive Performance Engineering Documentation & Playbook covering 6 Pillars and 18 Production Frontend Performance Bottlenecks in Next.js 16, React 19, TanStack, and Zustand.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn("dark antialiased", inter.variable, jetbrainsMono.variable)}
    >
      <body className="min-h-svh bg-background font-sans text-foreground selection:bg-primary/20 selection:text-primary">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <QueryProvider>
              <div className="flex min-h-svh">
                <WorkbenchSidebar />
                <div className="flex min-w-0 flex-1 flex-col">
                  <PerformanceHud />
                  <main className="flex-1">{children}</main>
                </div>
              </div>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
