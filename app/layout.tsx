import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "Ferie Calendar Web",
  description: "Sistema di gestione ferie e turni",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <div className="mr-4 hidden md:flex">
                <a className="mr-6 flex items-center space-x-2" href="/">
                  <span className="hidden font-bold sm:inline-block">Ferie Calendar</span>
                </a>
                <nav className="flex items-center space-x-6 text-sm font-medium">
                  <a className="transition-colors hover:text-foreground/80 text-foreground/60" href="/">
                    Dashboard
                  </a>
                  <a className="transition-colors hover:text-foreground/80 text-foreground/60" href="/calendar">
                    Calendario
                  </a>
                  <a className="transition-colors hover:text-foreground/80 text-foreground/60" href="/vacations">
                    Ferie
                  </a>
                  <a className="transition-colors hover:text-foreground/80 text-foreground/60" href="/admin">
                    Admin
                  </a>
                </nav>
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
