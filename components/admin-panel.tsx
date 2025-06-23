"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import type { VacationBooking } from "@/types/database"
import { Shield, Trash2, Calendar, User, Edit } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { EditVacationDialog } from "./edit-vacation-dialog"

interface AdminPanelProps {
  vacations: VacationBooking[]
  onVacationDeleted: () => void
  onVacationEdited?: (vacationId: string, startDate: string, endDate: string, notes: string) => Promise<boolean>
}

export function AdminPanel({ vacations, onVacationDeleted, onVacationEdited }: AdminPanelProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingVacation, setEditingVacation] = useState<VacationBooking | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const { user } = useAuth()

  if (!user || user.role !== "admin") {
    return null
  }

  const handleDeleteVacation = async (vacationId: string) => {
    setDeletingId(vacationId)

    try {
      const response = await fetch(`/api/vacations/${vacationId}?user_id=${user.id}&user_role=${user.role}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onVacationDeleted()
      } else {
        const data = await response.json()
        alert(data.error || "Errore nell'eliminazione")
      }
    } catch (error) {
      alert("Errore di connessione")
    } finally {
      setDeletingId(null)
    }
  }

  const handleEditVacation = (vacation: VacationBooking) => {
    setEditingVacation(vacation)
    setShowEditDialog(true)
  }

  const handleEditConfirm = async (vacationId: string, startDate: string, endDate: string, notes: string) => {
    if (!onVacationEdited) return false

    setIsEditing(true)
    const success = await onVacationEdited(vacationId, startDate, endDate, notes)
    setIsEditing(false)

    if (success) {
      setShowEditDialog(false)
      setEditingVacation(null)
    }

    return success
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT")
  }

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-4 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Shield className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
            Pannello Amministratore
          </CardTitle>
          <p className="text-sm md:text-base text-gray-600">
            Come amministratore puoi gestire tutte le prenotazioni ferie
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            {vacations.length === 0 ? (
              <p className="text-gray-500 text-center py-6 md:py-8 text-sm md:text-base">
                Nessuna prenotazione presente
              </p>
            ) : (
              vacations.map((vacation) => (
                <div
                  key={vacation.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 border rounded-lg bg-gray-50 gap-3 md:gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="font-medium text-sm md:text-base">{vacation.users?.name}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {vacation.users?.email}
                        </Badge>
                        {vacation.user_id === user.id && (
                          <Badge variant="secondary" className="text-xs">
                            Le tue ferie
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span className="text-sm md:text-base">
                          {formatDate(vacation.start_date)} - {formatDate(vacation.end_date)}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs w-fit">
                        {calculateDays(vacation.start_date, vacation.end_date)} giorni
                      </Badge>
                    </div>
                    {vacation.notes && (
                      <p className="text-sm text-gray-600 italic bg-white p-2 rounded border">
                        <strong>Descrizione:</strong> "{vacation.notes}"
                      </p>
                    )}
                  </div>

                  {/* Pulsanti di azione - Mobile Responsive */}
                  <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                    {/* Pulsante Modifica */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditVacation(vacation)}
                      disabled={isEditing}
                      className="flex-1 md:flex-none text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm md:text-base h-9 md:h-8"
                    >
                      <Edit className="h-4 w-4 mr-1 md:mr-2" />
                      Modifica
                    </Button>

                    {/* Pulsante Elimina */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deletingId === vacation.id}
                          className="flex-1 md:flex-none text-sm md:text-base h-9 md:h-8"
                        >
                          {deletingId === vacation.id ? (
                            "Eliminando..."
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-1 md:mr-2" />
                              Elimina
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-md mx-4 md:max-w-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-base md:text-lg">Conferma eliminazione</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm md:text-base">
                            Sei sicuro di voler eliminare le ferie di <strong>{vacation.users?.name}</strong> dal{" "}
                            <strong>{formatDate(vacation.start_date)}</strong> al{" "}
                            <strong>{formatDate(vacation.end_date)}</strong>?
                            {vacation.notes && (
                              <>
                                <br />
                                <br />
                                <strong>Descrizione:</strong> "{vacation.notes}"
                              </>
                            )}
                            <br />
                            <br />
                            Questa azione non può essere annullata.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto">Annulla</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteVacation(vacation.id)}
                            className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                          >
                            Elimina
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Statistiche rapide - Mobile Responsive */}
          {vacations.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-3 text-base md:text-lg">Statistiche Rapide</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 text-sm">
                <div className="text-center">
                  <span className="text-blue-600 font-medium block text-xs md:text-sm">Totale Prenotazioni:</span>
                  <div className="text-lg md:text-xl font-bold text-blue-900">{vacations.length}</div>
                </div>
                <div className="text-center">
                  <span className="text-blue-600 font-medium block text-xs md:text-sm">Giorni Totali:</span>
                  <div className="text-lg md:text-xl font-bold text-blue-900">
                    {vacations.reduce((total, vacation) => {
                      return total + calculateDays(vacation.start_date, vacation.end_date)
                    }, 0)}
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-blue-600 font-medium block text-xs md:text-sm">Con Descrizione:</span>
                  <div className="text-lg md:text-xl font-bold text-blue-900">
                    {vacations.filter((v) => v.notes && v.notes.trim()).length}
                  </div>
                </div>
                <div className="text-center">
                  <span className="text-blue-600 font-medium block text-xs md:text-sm">Dipendenti Coinvolti:</span>
                  <div className="text-lg md:text-xl font-bold text-blue-900">
                    {new Set(vacations.map((v) => v.user_id)).size}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog per modificare le ferie */}
      <EditVacationDialog
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false)
          setEditingVacation(null)
        }}
        onSave={handleEditConfirm}
        vacation={editingVacation}
        isLoading={isEditing}
      />
    </>
  )
}
