"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { UserManagement } from "@/components/admin/user-management"
import { Shield, AlertTriangle } from "lucide-react"

export default function AdminPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // Verifica se l'utente è admin
    if (!isLoading) {
      if (!user) {
        router.push("/")
      } else if (user.role !== "admin") {
        setIsAuthorized(false)
      } else {
        setIsAuthorized(true)
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">Accesso Negato</h2>
            <p className="text-gray-600 text-center">
              Non hai i permessi necessari per accedere a questa pagina. Questa sezione è riservata agli amministratori.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-red-600" />
            Pannello Amministratore
          </h1>
          <p className="text-gray-600 mt-2">Gestione completa degli utenti e dei permessi</p>
        </div>

        <UserManagement />
      </div>
    </main>
  )
}
