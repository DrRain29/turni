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
import { Clock, Plus, X, AlertTriangle, Lock, Star } from "lucide-react"
import type { ShiftType, User } from "@/types/database"
import { FIXED_TIME_SHIFTS } from "@/types/database"

interface AddShiftDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (
    userId: string,
    shiftTypeId: string,
    date: string,
    startTime: string,
    endTime: string,
    notes: string,
  ) => Promise<boolean>
  date: string
  shiftTypes: ShiftType[]
  users: User[]
  currentUser: { id: string; role: string; name: string }
  isLoading?: boolean
}

export function AddShiftDialog({
  isOpen,
  onClose,
  onSave,
  date,
  shiftTypes,
  users,
  currentUser,
  isLoading = false,
}: AddShiftDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState(currentUser?.id || "")
  const [selectedShiftTypeId, setSelectedShiftTypeId] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [notes, setNotes] = useState("")
  const [calculatedHours, setCalculatedHours] = useState(0)
  const [isFixedTimeShift, setIsFixedTimeShift] = useState(false)

  // Calcola le ore quando cambiano gli orari
  useEffect(() => {
    if (startTime && endTime) {
      const hours = calculateShiftHours(startTime, endTime)
      setCalculatedHours(hours)
    } else {
      setCalculatedHours(0)
    }
  }, [startTime, endTime])

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
      setStartTime("")
      setEndTime("")
    }
  }, [selectedShiftTypeId, shiftTypes])

  // Aggiungi questo controllo di sicurezza
  if (!currentUser) {
    return null
  }

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
    if (!selectedShiftTypeId || !startTime || !endTime) return

    const success = await onSave(selectedUserId, selectedShiftTypeId, date, startTime, endTime, notes.trim())
    if (success) {
      setSelectedShiftTypeId("")
      setStartTime("")
      setEndTime("")
      setNotes("")
      setSelectedUserId(currentUser.id)
      onClose()
    }
  }

  const handleClose = () => {
    setSelectedShiftTypeId("")
    setStartTime("")
    setEndTime("")
    setNotes("")
    setSelectedUserId(currentUser.id)
    onClose()
  }

  const selectedUser = users.find((u) => u.id === selectedUserId)
  const canSplitShifts = selectedUser?.email === "vpedone@entermed.it"

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Aggiungi Turno
          </DialogTitle>
          <DialogDescription>
            Aggiungi un nuovo turno per <strong>{formatDate(date)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selezione utente (solo per admin) */}
          {currentUser.role === "admin" && (
            <div>
              <Label htmlFor="user-select">Dipendente</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona dipendente" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        {user.email === "vpedone@entermed.it" && <Star className="h-3 w-3 text-yellow-500" />}
                        {user.name}
                        {user.email === "vpedone@entermed.it" && (
                          <span className="text-xs text-gray-500">(Turni spezzati)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="start-time">
                Orario Inizio
                {isFixedTimeShift && <Lock className="h-3 w-3 inline ml-1 text-gray-500" />}
              </Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isFixedTimeShift}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end-time">
                Orario Fine
                {isFixedTimeShift && <Lock className="h-3 w-3 inline ml-1 text-gray-500" />}
              </Label>
              <Input
                id="end-time"
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

          {/* Avviso per turni spezzati */}
          {canSplitShifts && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-yellow-800">
                <Star className="h-4 w-4" />
                <span>
                  <strong>Vincenzo - Turni Spezzati:</strong> Puoi creare turni senza limite minimo di ore
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
              {!canSplitShifts && calculatedHours < 3 && (
                <div className="flex items-center gap-2 text-sm mt-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Attenzione: Minimo 3 ore al giorno richieste</span>
                </div>
              )}
              {calculatedHours > 8 && (
                <div className="flex items-center gap-2 text-sm mt-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Attenzione: Massimo 8 ore al giorno consentite</span>
                </div>
              )}
            </div>
          )}

          {/* Note */}
          <div>
            <Label htmlFor="notes">Note (opzionale)</Label>
            <Textarea
              id="notes"
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
            <Clock className="h-4 w-4 mr-2" />
            {isLoading ? "Salvando..." : "Aggiungi Turno"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
