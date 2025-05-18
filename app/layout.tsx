import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { DateRangeProvider } from "@/contexts/date-range-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Budget Tracker",
  description: "Track your income and expenses with ease.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <DateRangeProvider>{children}</DateRangeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
