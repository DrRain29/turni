"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import VacationForm from "@/components/VacationForm"
import VacationList from "@/components/VacationList"

const FeriePage = () => {
  const { data: session } = useSession()
  const user = session?.user
  const [vacations, setVacations] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const isAdmin = user?.email === "admin@example.com" // Esempio di controllo admin

  useEffect(() => {
    fetchVacations()
  }, [])

  const fetchVacations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/vacations")
      if (response.ok) {
        const data = await response.json()
        setVacations(data)
      } else {
        console.error("Failed to fetch vacations")
      }
    } catch (error) {
      console.error("Error fetching vacations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBookVacation = async (startDate: string, endDate: string, description: string, targetUserId?: string) => {
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
        await fetchVacations()
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

  const handleDeleteVacation = async (id: string) => {
    try {
      const response = await fetch(`/api/vacations/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchVacations()
      } else {
        alert("Errore nell'eliminazione della vacanza")
      }
    } catch (error) {
      alert("Errore di connessione")
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Prenota le tue ferie</h1>
      {session && user ? (
        <>
          <VacationForm onBookVacation={handleBookVacation} isAdmin={isAdmin} />
          <VacationList
            vacations={vacations}
            onDeleteVacation={handleDeleteVacation}
            isLoading={isLoading}
            isAdmin={isAdmin}
          />
        </>
      ) : (
        <p>Effettua il login per prenotare le tue ferie.</p>
      )}
    </div>
  )
}

export default FeriePage
