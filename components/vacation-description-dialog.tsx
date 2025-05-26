"use client"

import { useState } from "react"
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
import { Calendar, Check, X } from "lucide-react"

interface VacationDescriptionDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (description: string) => void
  selectedDates: string[]
  isLoading?: boolean
}

export function VacationDescriptionDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedDates,
  isLoading = false,
}: VacationDescriptionDialogProps) {
  const [description, setDescription] = useState("")

  const formatDateRange = () => {
    if (selectedDates.length === 0) return ""

    const sortedDates = selectedDates.sort()
    const startDate = new Date(sortedDates[0]).toLocaleDateString("it-IT")
    const endDate = new Date(sortedDates[sortedDates.length - 1]).toLocaleDateString("it-IT")

    if (sortedDates.length === 1) {
      return startDate
    }

    return `${startDate} - ${endDate}`
  }

  const handleConfirm = () => {
    onConfirm(description.trim())
    setDescription("")
  }

  const handleClose = () => {
    setDescription("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Conferma Prenotazione Ferie
          </DialogTitle>
          <DialogDescription>
            Stai prenotando <strong>{selectedDates.length} giorni</strong> di ferie dal{" "}
            <strong>{formatDateRange()}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="description">Descrizione (opzionale)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Es. Vacanza estiva, ferie natalizie, weekend lungo..."
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
          <Button onClick={handleConfirm} disabled={isLoading}>
            <Check className="h-4 w-4 mr-2" />
            {isLoading ? "Prenotando..." : "Conferma Prenotazione"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
