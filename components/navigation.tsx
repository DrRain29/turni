"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { ChangePasswordDialog } from "@/components/change-password-dialog"
import { Menu, LogOut, User, Calendar, Clock, BarChart3, Settings, Shield, UserCog } from "lucide-react"

export function Navigation() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Chiudi il menu mobile quando cambia il percorso
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const isActive = (path: string) => {
    return pathname === path
  }

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: <Calendar className="h-4 w-4" />,
      showTo: ["user", "admin", "moderator"],
    },
    {
      name: "Turni",
      href: "/turni",
      icon: <Clock className="h-4 w-4" />,
      showTo: ["user", "admin", "moderator"],
    },
    {
      name: "Ferie",
      href: "/ferie",
      icon: <Calendar className="h-4 w-4" />,
      showTo: ["user", "admin", "moderator"],
    },
    {
      name: "Statistiche",
      href: "/statistiche",
      icon: <BarChart3 className="h-4 w-4" />,
      showTo: ["user", "admin", "moderator"],
    },
    {
      name: "Amministrazione",
      href: "/admin",
      icon: <Settings className="h-4 w-4" />,
      showTo: ["admin"],
    },
  ]

  const filteredNavItems = navItems.filter((item) => {
    if (!user) return false
    return item.showTo.includes(user.role)
  })

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Image src="/images/entermed-logo.png" alt="Entermed Logo" width={32} height={32} />
              <span className="hidden font-bold sm:inline-block">Entermed</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center transition-colors hover:text-foreground/80 ${
                    isActive(item.href) ? "text-foreground" : "text-foreground/60"
                  }`}
                >
                  {item.icon}
                  <span className="ml-1">{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="mr-2 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <Link href="/" className="flex items-center space-x-2">
                <Image src="/images/entermed-logo.png" alt="Entermed Logo" width={32} height={32} />
                <span className="font-bold">Entermed</span>
              </Link>
              <div className="my-4 h-[1px] bg-border" />
              <nav className="flex flex-col space-y-3">
                {filteredNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center rounded-md px-2 py-1 text-sm ${
                      isActive(item.href) ? "bg-accent text-accent-foreground" : "text-foreground/60"
                    }`}
                  >
                    {item.icon}
                    <span className="ml-2">{item.name}</span>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <Link href="/" className="mr-6 flex items-center space-x-2 md:hidden">
                <Image src="/images/entermed-logo.png" alt="Entermed Logo" width={32} height={32} />
                <span className="font-bold">Entermed</span>
              </Link>
            </div>

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 flex items-center gap-2 rounded-full">
                    <User className="h-5 w-5" />
                    <span className="hidden md:inline-block">{user.name}</span>
                    {user.role === "admin" && (
                      <Badge variant="destructive" className="h-5 flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        <span className="text-xs">Admin</span>
                      </Badge>
                    )}
                    {user.role === "moderator" && (
                      <Badge
                        variant="outline"
                        className="h-5 flex items-center gap-1 bg-sky-100 text-sky-700 border-sky-200"
                      >
                        <UserCog className="h-3 w-3" />
                        <span className="text-xs">Mod</span>
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsChangePasswordOpen(true)}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Cambia Password</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Esci</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <ChangePasswordDialog isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} />
    </>
  )
}
