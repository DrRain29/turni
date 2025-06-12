"use client"

import { useState, useEffect } from "react"
import { VacationCalendar } from "@/components/vacation-calendar"
import { LoginForm } from "@/components/login-form"
import { VacationBooking } from "@/components/vacation-booking"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import type { VacationBooking as VacationBookingType } from "@/types/database"
import { AdminPanel } from "@/components/admin-panel"

export default function FeriePage() {
  const [vacations, setVacations] = useState<VacationBookingType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const { user, isLoading: authLoading } = useAuth()
  const [showBookingForm, setShowBookingForm] = useState(false)

  const fetchVacations = async () => {
    try {
      const response = await fetch("/api/vacations")
      if (response.ok) {
        const data = await response.json()
        setVacations(data)
      }
    } catch (error) {
      console.error("Error fetching vacations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchVacations()
  }, [])

  const handleCalendarBooking = async (
    startDate: string,
    endDate: string,
    description: string,
    targetUserId?: string,
  ): Promise<boolean> => {
    if (!user) return false

    try {
      const response = await fetch("/api/vacations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          start_date: startDate,
          end_date: endDate,
          notes: description,
          target_user_id: targetUserId, // Nuovo parametro per admin
        }),
      })

      if (response.ok) {
        fetchVacations()
        return true
      } else {
        const data = await response.json()
        alert(data.error || "Errore nella prenotazione")
        return false
      }
    } catch (error) {
      alert("Errore di connessione")
      return false
    }
  }

  const handleEditVacation = async (
    vacationId: string,
    startDate: string,
    endDate: string,
    notes: string,
  ): Promise<boolean> => {
    if (!user) return false

    try {
      const response = await fetch(`/api/vacations/${vacationId}/edit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          notes,
          user_id: user.id,
          user_role: user.role,
        }),
      })

      if (response.ok) {
        fetchVacations()
        return true
      } else {
        const data = await response.json()
        alert(data.error || "Errore nella modifica")
        return false
      }
    } catch (error) {
      alert("Errore di connessione")
      return false
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <div className="space-y-6 md:space-y-8">
        {/* Pannello Amministratore - SPOSTATO IN ALTO */}
        {user && user.role === "admin" && (
          <AdminPanel vacations={vacations} onVacationDeleted={fetchVacations} onVacationEdited={handleEditVacation} />
        )}

        {/* Calendario pubblico */}
        <VacationCalendar
          vacations={vacations}
          isAdmin={user?.role === "admin"}
          currentUser={user}
          isLoggedIn={!!user}
          onBookVacation={handleCalendarBooking}
          onEditVacation={handleEditVacation}
          onDeleteVacation={async (vacationId: string) => {
            if (user && confirm("Sei sicuro di voler eliminare questa prenotazione?")) {
              try {
                const response = await fetch(`/api/vacations/${vacationId}?user_id=${user.id}&user_role=${user.role}`, {
                  method: "DELETE",
                })
                if (response.ok) {
                  fetchVacations()
                }
              } catch (error) {
                console.error("Error deleting vacation:", error)
              }
            }
          }}
        />

        {/* Area login/prenotazione */}
        {!user && showLogin && (
          <div className="flex justify-center">
            <LoginForm />
          </div>
        )}

        {user && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setShowBookingForm(!showBookingForm)} className="mb-4">
                {showBookingForm ? "Nascondi Form Tradizionale" : "Mostra Form Tradizionale"}
              </Button>
            </div>
            <VacationBooking onBookingSuccess={fetchVacations} isVisible={showBookingForm} />
          </div>
        )}

        {/* Lista ferie */}
        {vacations.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4">Ferie Prenotate</h2>
            <div className="space-y-3">
              {vacations.map((vacation) => (
                <div key={vacation.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{vacation.users?.name}</span>
                    <span className="text-gray-600 ml-2">
                      {new Date(vacation.start_date).toLocaleDateString("it-IT")} -{" "}
                      {new Date(vacation.end_date).toLocaleDateString("it-IT")}
                    </span>
                    {vacation.notes && <span className="text-gray-500 ml-2">({vacation.notes})</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
