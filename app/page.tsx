"use client"

import { useState, useEffect } from "react"
import { WeeklyShiftsCalendar } from "@/components/weekly-shifts-calendar"
import { useAuth } from "@/contexts/auth-context"
import type { Shift, ShiftType, User } from "@/types/database"

export default function HomePage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, isLoading: authLoading } = useAuth()

  const fetchShifts = async () => {
    try {
      const response = await fetch("/api/shifts")
      if (response.ok) {
        const data = await response.json()
        setShifts(data)
      }
    } catch (error) {
      console.error("Error fetching shifts:", error)
    }
  }

  const fetchShiftTypes = async () => {
    try {
      const response = await fetch("/api/shift-types")
      if (response.ok) {
        const data = await response.json()
        setShiftTypes(data)
      }
    } catch (error) {
      console.error("Error fetching shift types:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchShifts(), fetchShiftTypes(), fetchUsers()])
      setIsLoading(false)
    }
    loadData()
  }, [])

  const handleAddShift = async (
    userId: string,
    shiftTypeId: string,
    date: string,
    startTime: string,
    endTime: string,
    notes: string,
  ): Promise<boolean> => {
    if (!user) return false

    try {
      const response = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          shift_type_id: shiftTypeId,
          date,
          start_time: startTime,
          end_time: endTime,
          notes,
          created_by: user.id,
        }),
      })

      if (response.ok) {
        fetchShifts()
        return true
      } else {
        const data = await response.json()
        alert(data.error || "Errore nella creazione del turno")
        return false
      }
    } catch (error) {
      alert("Errore di connessione")
      return false
    }
  }

  const handleEditShift = async (
    shiftId: string,
    userId: string,
    shiftTypeId: string,
    startTime: string,
    endTime: string,
    notes: string,
  ): Promise<boolean> => {
    if (!user) return false

    try {
      const response = await fetch(`/api/shifts/${shiftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          shift_type_id: shiftTypeId,
          start_time: startTime,
          end_time: endTime,
          notes,
          current_user_id: user.id,
          current_user_role: user.role,
        }),
      })

      if (response.ok) {
        fetchShifts()
        return true
      } else {
        const data = await response.json()
        alert(data.error || "Errore nella modifica del turno")
        return false
      }
    } catch (error) {
      alert("Errore di connessione")
      return false
    }
  }

  const handleDeleteShift = async (shiftId: string): Promise<boolean> => {
    if (!user) return false

    try {
      const response = await fetch(`/api/shifts/${shiftId}?current_user_id=${user.id}&current_user_role=${user.role}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchShifts()
        return true
      } else {
        const data = await response.json()
        alert(data.error || "Errore nell'eliminazione del turno")
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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Calendario turni settimanale */}
        <WeeklyShiftsCalendar
          shifts={shifts}
          shiftTypes={shiftTypes}
          users={users}
          currentUser={user}
          isLoggedIn={!!user}
          onAddShift={handleAddShift}
          onEditShift={handleEditShift}
          onDeleteShift={handleDeleteShift}
        />

        {/* Informazioni per utenti non admin */}
        {user && user.role !== "admin" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900">Informazioni</h3>
            <p className="text-blue-800 text-sm mt-1">
              Puoi gestire i tuoi turni. Solo gli amministratori possono modificare i turni di altri colleghi.
            </p>
          </div>
        )}

        {/* Informazioni per admin */}
        {user && user.role === "admin" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900">Pannello Amministratore</h3>
            <p className="text-green-800 text-sm mt-1">
              Come amministratore puoi gestire i turni di tutti i dipendenti, aggiungere, modificare ed eliminare
              qualsiasi turno.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
