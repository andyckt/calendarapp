import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/lib/auth-context"
import { CalendarProvider } from "@/lib/calendar-context"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Calendar App",
  description: "Modern calendar application with real-time scheduling",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <CalendarProvider>
            {children}
            <Toaster position="top-right" />
          </CalendarProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
