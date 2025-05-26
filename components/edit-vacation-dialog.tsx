"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Edit, Save, X, Calendar, User } from "lucide-react"
import type { VacationBooking } from "@/types/database"

interface EditVacationDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (vacationId: string, startDate: string, endDate: string, notes: string) => Promise<boolean>
  vacation: VacationBooking | null
  isLoading?: boolean
}

export function EditVacationDialog({ isOpen, onClose, onSave, vacation, isLoading = false }: EditVacationDialogProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (vacation) {
      setStartDate(vacation.start_date)
      setEndDate(vacation.end_date)
      setNotes(vacation.notes || "")
    }
  }, [vacation])

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const handleSave = async () => {
    if (!vacation) return

    const success = await onSave(vacation.id, startDate, endDate, notes.trim())
    if (success) {
      onClose()
    }
  }

  const handleClose = () => {
    onClose()
  }

  if (!vacation) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Modifica Ferie
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>
                Modifica le ferie di <strong>{vacation.users?.name}</strong>
              </span>
              <Badge variant="outline" className="text-xs">
                {vacation.users?.email}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>
                Periodo originale: {new Date(vacation.start_date).toLocaleDateString("it-IT")} -{" "}
                {new Date(vacation.end_date).toLocaleDateString("it-IT")}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-start-date">Data Inizio</Label>
              <Input
                id="edit-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-end-date">Data Fine</Label>
              <Input
                id="edit-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="mt-1"
              />
            </div>
          </div>

          {/* Mostra il conteggio giorni aggiornato */}
          {startDate && endDate && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800">
                  <strong>Nuovo periodo:</strong> {calculateDays(startDate, endDate)} giorni
                  {calculateDays(startDate, endDate) !== calculateDays(vacation.start_date, vacation.end_date) && (
                    <span className="ml-2 text-blue-600">
                      (
                      {calculateDays(startDate, endDate) > calculateDays(vacation.start_date, vacation.end_date)
                        ? "+"
                        : ""}
                      {calculateDays(startDate, endDate) - calculateDays(vacation.start_date, vacation.end_date)}{" "}
                      giorni)
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="edit-notes">Descrizione</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Es. Vacanza estiva, ferie natalizie, weekend lungo..."
              rows={3}
              className="mt-1"
            />
            <div className="text-xs text-gray-500 mt-1">
              {notes.trim() ? `${notes.trim().length} caratteri` : "Nessuna descrizione"}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !startDate || !endDate}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Salvando..." : "Salva Modifiche"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
