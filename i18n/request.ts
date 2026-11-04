import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"

export type Locale = "vi" | "en"
export const LOCALE_COOKIE = "PERF_LAB_LOCALE"

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const rawLocale = cookieStore.get(LOCALE_COOKIE)?.value
  const locale: Locale = rawLocale === "en" ? "en" : "vi"

  const messages = (await import(`./messages/${locale}.json`)).default

  return {
    locale,
    messages,
  }
})
