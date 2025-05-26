"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { Calendar, Clock, LogOut, Users, Menu, X, Lock, BarChart3 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChangePasswordDialog } from "./change-password-dialog"

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false)
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const navigationItems = [
    {
      name: "Turni",
      href: "/",
      icon: Clock,
      description: "Gestione turni settimanali",
    },
    {
      name: "Ferie",
      href: "/ferie",
      icon: Calendar,
      description: "Calendario ferie",
    },
    {
      name: "Statistiche",
      href: "/statistiche",
      icon: BarChart3,
      description: "Report ore dipendenti",
    },
  ]

  return (
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo e titolo */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Entermed Portal</h1>
              </div>

              {/* Navigation Desktop */}
              <nav className="hidden md:flex items-center gap-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className={cn("flex items-center gap-2", {
                          "bg-blue-600 text-white": isActive,
                        })}
                      >
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </Button>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* User info e menu mobile */}
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 hidden sm:block">
                    Benvenuto, {user.name}
                    {user.role === "admin" && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        Admin
                      </Badge>
                    )}
                  </span>
                  <div className="hidden sm:flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowChangePasswordDialog(true)}
                      className="flex items-center gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      Cambia Password
                    </Button>
                    <Button variant="outline" size="sm" onClick={logout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Esci
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">Accesso richiesto per interagire</div>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t bg-gray-50 py-4">
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className={cn("w-full justify-start gap-2", {
                          "bg-blue-600 text-white": isActive,
                        })}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon className="h-4 w-4" />
                        <div className="text-left">
                          <div>{item.name}</div>
                          <div className="text-xs opacity-70">{item.description}</div>
                        </div>
                      </Button>
                    </Link>
                  )
                })}
              </nav>

              {user && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="text-sm text-gray-600 mb-2">
                    {user.name}
                    {user.role === "admin" && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        Admin
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowChangePasswordDialog(true)
                      setIsMobileMenuOpen(false)
                    }}
                    className="w-full justify-start gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    Cambia Password
                  </Button>
                  <Button variant="outline" size="sm" onClick={logout} className="w-full justify-start gap-2">
                    <LogOut className="h-4 w-4" />
                    Esci
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Dialog per cambiare password */}
      {user && (
        <ChangePasswordDialog
          isOpen={showChangePasswordDialog}
          onClose={() => setShowChangePasswordDialog(false)}
          userId={user.id}
          userName={user.name}
        />
      )}
    </>
  )
}
