import type { Metadata } from "next"
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { TopNavbar } from "@/components/layout/top-navbar"
import { WorkbenchSidebar } from "@/components/layout/workbench-sidebar"
import { cn } from "@/lib/utils"

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-next",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono-next",
  display: "swap",
})

export const metadata: Metadata = {
  title: "PerfLab — Interactive Frontend Performance Workbook & Diagnostic Lab",
  description:
    "Interactive Performance Engineering Workbook covering Browser Foundations, 6 Pillars, and 18 Production Frontend Performance Bottlenecks in Next.js 16, React 19, TanStack, and Zustand.",
}

const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("perf-lab-theme-v2");var d=s==="dark"||(s==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);var m=document.querySelector('meta[name="color-scheme"]');if(m)m.setAttribute("content",d?"dark":"light");}catch(e){}})();`

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
      className={cn(
        "antialiased",
        ibmPlexSans.variable,
        jetbrainsMono.variable
      )}
    >
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-svh bg-background font-sans text-foreground selection:bg-primary selection:text-primary-foreground">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <QueryProvider>
              <TooltipProvider>
                <div className="flex min-h-svh flex-col">
                  <TopNavbar />
                  <div className="flex min-h-[calc(100svh-3.375rem)] flex-1">
                    <WorkbenchSidebar />
                    <main className="min-w-0 flex-1">{children}</main>
                  </div>
                </div>
              </TooltipProvider>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
