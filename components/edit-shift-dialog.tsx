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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Save, X, Lock, AlertTriangle, Clock, Star } from "lucide-react"
import type { Shift, ShiftType, User } from "@/types/database"
import { FIXED_TIME_SHIFTS } from "@/types/database"

interface EditShiftDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (
    shiftId: string,
    userId: string,
    shiftTypeId: string,
    startTime: string,
    endTime: string,
    notes: string,
  ) => Promise<boolean>
  shift: Shift | null
  shiftTypes: ShiftType[]
  users: User[]
  currentUser: { id: string; role: string; name: string }
  isLoading?: boolean
}

export function EditShiftDialog({
  isOpen,
  onClose,
  onSave,
  shift,
  shiftTypes,
  users,
  currentUser,
  isLoading = false,
}: EditShiftDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState("")
  const [selectedShiftTypeId, setSelectedShiftTypeId] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [notes, setNotes] = useState("")
  const [isFixedTimeShift, setIsFixedTimeShift] = useState(false)
  const [calculatedHours, setCalculatedHours] = useState(0)

  useEffect(() => {
    if (!currentUser) {
      return
    }

    if (shift) {
      setSelectedUserId(shift.user_id)
      setSelectedShiftTypeId(shift.shift_type_id)
      setStartTime(shift.start_time?.slice(0, 5) || "")
      setEndTime(shift.end_time?.slice(0, 5) || "")
      setNotes(shift.notes || "")

      // Controlla se è un turno fisso
      const shiftType = shiftTypes.find((st) => st.id === shift.shift_type_id)
      if (shiftType) {
        const isFixed = FIXED_TIME_SHIFTS.includes(shiftType.name)
        setIsFixedTimeShift(isFixed)
      }
    }
  }, [shift, shiftTypes, currentUser])

  // Gestisce la selezione del tipo turno e imposta orari predefiniti/fissi
  useEffect(() => {
    if (selectedShiftTypeId) {
      const selectedShiftType = shiftTypes.find((st) => st.id === selectedShiftTypeId)
      if (selectedShiftType) {
        const isFixed = FIXED_TIME_SHIFTS.includes(selectedShiftType.name)
        setIsFixedTimeShift(isFixed)

        // Imposta sempre gli orari predefiniti quando si seleziona un tipo turno
        setStartTime(selectedShiftType.start_time.slice(0, 5))
        setEndTime(selectedShiftType.end_time.slice(0, 5))
      }
    } else {
      setIsFixedTimeShift(false)
    }
  }, [selectedShiftTypeId, shiftTypes])

  // Calcola le ore quando cambiano gli orari
  useEffect(() => {
    if (startTime && endTime) {
      const hours = calculateShiftHours(startTime, endTime)
      setCalculatedHours(hours)
    } else {
      setCalculatedHours(0)
    }
  }, [startTime, endTime])

  const calculateShiftHours = (start: string, end: string): number => {
    const [startHour, startMinute] = start.split(":").map(Number)
    const [endHour, endMinute] = end.split(":").map(Number)

    const startMinutes = startHour * 60 + startMinute
    let endMinutes = endHour * 60 + endMinute

    // Gestisce turni notturni che attraversano la mezzanotte
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60 // Aggiunge 24 ore
    }

    return (endMinutes - startMinutes) / 60
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleSave = async () => {
    if (!shift || !selectedShiftTypeId || !startTime || !endTime) return

    const success = await onSave(shift.id, selectedUserId, selectedShiftTypeId, startTime, endTime, notes.trim())
    if (success) {
      onClose()
    }
  }

  const handleClose = () => {
    onClose()
  }

  if (!shift) return null

  const canEditUser = currentUser.role === "admin"
  const selectedUser = users.find((u) => u.id === selectedUserId)
  const canFlexibleHours = selectedUser?.email === "vpedone@entermed.it"

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Modifica Turno
          </DialogTitle>
          <DialogDescription>
            Modifica il turno per <strong>{formatDate(shift.date)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selezione utente (solo per admin) */}
          {canEditUser && (
            <div>
              <Label htmlFor="user-select">Dipendente</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona dipendente" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Mostra utente corrente se non admin */}
          {!canEditUser && (
            <div>
              <Label>Dipendente</Label>
              <div className="p-2 bg-gray-50 rounded border">{shift.users?.name}</div>
            </div>
          )}

          {/* Selezione tipo turno */}
          <div>
            <Label htmlFor="shift-type-select">Tipo Turno</Label>
            <Select value={selectedShiftTypeId} onValueChange={setSelectedShiftTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona tipo turno" />
              </SelectTrigger>
              <SelectContent>
                {shiftTypes.map((shiftType) => {
                  const isFixed = FIXED_TIME_SHIFTS.includes(shiftType.name)
                  const isApertura = shiftType.name === "Apertura"
                  return (
                    <SelectItem key={shiftType.id} value={shiftType.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: shiftType.color }}></div>
                        {isApertura && <Star className="h-3 w-3 text-yellow-500" />}
                        <span>{shiftType.name}</span>
                        {isFixed && <Lock className="h-3 w-3 text-gray-500" />}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Selezione orari */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-start-time">
                Orario Inizio
                {isFixedTimeShift && <Lock className="h-3 w-3 inline ml-1 text-gray-500" />}
              </Label>
              <Input
                id="edit-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isFixedTimeShift}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-end-time">
                Orario Fine
                {isFixedTimeShift && <Lock className="h-3 w-3 inline ml-1 text-gray-500" />}
              </Label>
              <Input
                id="edit-end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isFixedTimeShift}
                className="mt-1"
              />
            </div>
          </div>

          {/* Avviso per turni fissi */}
          {isFixedTimeShift && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-amber-800">
                <Lock className="h-4 w-4" />
                <span>
                  <strong>Turno con orario fisso:</strong> Gli orari non possono essere modificati
                </span>
              </div>
            </div>
          )}

          {/* Informazioni ore calcolate */}
          {calculatedHours > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800">
                  <strong>Ore turno:</strong> {calculatedHours.toFixed(1)} ore
                </span>
              </div>
              {!canFlexibleHours && calculatedHours < 2 && (
                <div className="flex items-center gap-2 text-sm mt-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Attenzione: Minimo 2 ore al giorno richieste</span>
                </div>
              )}
              {calculatedHours > 9 && (
                <div className="flex items-center gap-2 text-sm mt-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Attenzione: Massimo 9 ore al giorno consentite</span>
                </div>
              )}
            </div>
          )}

          {/* Note */}
          <div>
            <Label htmlFor="edit-notes">Note</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Es. Sostituzione, straordinario..."
              rows={3}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !selectedShiftTypeId || !startTime || !endTime}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Salvando..." : "Salva Modifiche"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
