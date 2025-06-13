"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Clock, Plus, Edit, Trash2, Star, ArrowRight, Shield } from "lucide-react"
import type { Shift, ShiftType, User } from "@/types/database"
import { cn } from "@/lib/utils"
import { AddShiftDialog } from "./add-shift-dialog"
import { EditShiftDialog } from "./edit-shift-dialog"
import { useIsMobile } from "@/hooks/use-mobile"

interface WeeklyShiftsCalendarProps {
  shifts: Shift[]
  shiftTypes: ShiftType[]
  users: User[]
  currentUser?: { id: string; role: string; name: string }
  isLoggedIn?: boolean
  onAddShift?: (
    userId: string,
    shiftTypeId: string,
    date: string,
    startTime: string,
    endTime: string,
    notes: string,
  ) => Promise<boolean>
  onEditShift?: (
    shiftId: string,
    userId: string,
    shiftTypeId: string,
    startTime: string,
    endTime: string,
    notes: string,
  ) => Promise<boolean>
  onDeleteShift?: (shiftId: string) => Promise<boolean>
}

interface GroupedShift {
  id: string
  user_id: string
  user_name: string
  shifts: Shift[]
  totalHours: number
  displayOrder: number
  hasIRCAC: boolean
  hasSecondShift: boolean
}

export function WeeklyShiftsCalendar({
  shifts,
  shiftTypes,
  users,
  currentUser,
  isLoggedIn = false,
  onAddShift,
  onEditShift,
  onDeleteShift,
}: WeeklyShiftsCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const isMobile = useIsMobile()

  const dayNames = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]
  const dayNamesShort = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"]

  // Calcola l'inizio della settimana (lunedì)
  const getWeekStart = (date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d
  }

  const weekStart = getWeekStart(currentWeek)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + i)
    return day
  })

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })
  }

  const calculateShiftHours = (startTime: string, endTime: string): number => {
    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)

    const startMinutes = startHour * 60 + startMinute
    let endMinutes = endHour * 60 + endMinute

    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60
    }

    return (endMinutes - startMinutes) / 60
  }

  const getShiftsForDay = (date: Date): Shift[] => {
    const dateString = formatDate(date)
    return shifts.filter((shift) => shift.date === dateString)
  }

  const previousWeek = () => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() - 7)
    setCurrentWeek(newWeek)
  }

  const nextWeek = () => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() + 7)
    setCurrentWeek(newWeek)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return formatDate(date) === formatDate(today)
  }

  const isPast = (date: Date) => {
    const today = new Date()
    const todayString = formatDate(today)
    const dateString = formatDate(date)
    return dateString < todayString
  }

  // Funzione per verificare se l'utente può interagire con una data
  const canInteractWithDate = (date: Date) => {
    if (!isLoggedIn || !currentUser) return false

    // Gli amministratori e i moderatori possono sempre interagire, anche con i giorni passati
    if (currentUser.role === "admin" || currentUser.role === "moderator") return true

    // Gli utenti normali possono interagire solo con giorni futuri o oggi
    return !isPast(date)
  }

  const getWeekRange = () => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    return `${formatDisplayDate(weekStart)} - ${formatDisplayDate(weekEnd)}`
  }

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [isAddingShift, setIsAddingShift] = useState(false)
  const [isEditingShift, setIsEditingShift] = useState(false)

  const handleAddShift = (date: string) => {
    if (!currentUser) return
    setSelectedDate(date)
    setShowAddDialog(true)
  }

  const handleEditShift = (shift: Shift) => {
    if (!currentUser) return
    setEditingShift(shift)
    setShowEditDialog(true)
  }

  const handleAddShiftSave = async (
    userId: string,
    shiftTypeId: string,
    date: string,
    startTime: string,
    endTime: string,
    notes: string,
  ) => {
    if (!onAddShift) return false
    setIsAddingShift(true)
    const success = await onAddShift(userId, shiftTypeId, date, startTime, endTime, notes)
    setIsAddingShift(false)
    return success
  }

  const handleEditShiftSave = async (
    shiftId: string,
    userId: string,
    shiftTypeId: string,
    startTime: string,
    endTime: string,
    notes: string,
  ) => {
    if (!onEditShift) return false
    setIsEditingShift(true)
    const success = await onEditShift(shiftId, userId, shiftTypeId, startTime, endTime, notes)
    setIsEditingShift(false)
    if (success) {
      setShowEditDialog(false)
      setEditingShift(null)
    }
    return success
  }

  const handleDeleteShift = async (shiftId: string) => {
    if (!onDeleteShift || !confirm("Sei sicuro di voler eliminare questo turno?")) return
    await onDeleteShift(shiftId)
  }

  const canEditShift = (shift: Shift) => {
    if (!currentUser) return false
    // Gli admin e i moderatori possono sempre modificare, gli utenti solo i propri turni
    return currentUser.role === "admin" || currentUser.role === "moderator" || shift.user_id === currentUser.id
  }

  const canDeleteShift = (shift: Shift) => {
    if (!currentUser) return false
    // Gli admin e i moderatori possono sempre eliminare, gli utenti solo i propri turni
    return currentUser.role === "admin" || currentUser.role === "moderator" || shift.user_id === currentUser.id
  }

  // Determina se l'utente ha permessi avanzati (admin o moderatore)
  const hasAdvancedPermissions = currentUser?.role === "admin" || currentUser?.role === "moderator"

  // VISTA MOBILE - Lista giornaliera
  if (isMobile) {
    // Funzione per organizzare i turni del giorno secondo l'ordine richiesto
    // IMPORTANTE: Questo ordinamento si applica a TUTTI i giorni (passati, presenti e futuri)
    const getOrganizedShiftsForDay = (day: Date) => {
      const dayShifts = getShiftsForDay(day)

      // Raggruppa per tipo di turno
      const shiftsByType = dayShifts.reduce(
        (groups, shift) => {
          const shiftType = shiftTypes.find((st) => st.id === shift.shift_type_id)
          const typeName = shiftType?.name || "Altri"
          if (!groups[typeName]) {
            groups[typeName] = []
          }
          groups[typeName].push(shift)
          return groups
        },
        {} as Record<string, Shift[]>,
      )

      // Organizza secondo l'ordine STANDARD per TUTTI i giorni:
      // 1. Apertura, 2. 2° Turno (senza IRCAC), 3. Doppi turni (IRCAC+altro), 4. Chiusura (senza IRCAC), 5. Aeroporto
      const organizedShifts: Array<{
        type: "single" | "double" | "airport"
        shifts: Shift[]
        user_name: string
        user_id: string
        totalHours: number
        hasRientroUfficio: boolean
      }> = []

      // 1. Apertura
      if (shiftsByType["Apertura"]) {
        shiftsByType["Apertura"].forEach((shift) => {
          organizedShifts.push({
            type: "single",
            shifts: [shift],
            user_name: shift.users?.name || "Sconosciuto",
            user_id: shift.user_id,
            totalHours: calculateShiftHours(shift.start_time, shift.end_time),
            hasRientroUfficio: false,
          })
        })
      }

      // 2. 2° Turno (solo quelli che non hanno IRCAC)
      if (shiftsByType["2° Turno"]) {
        shiftsByType["2° Turno"].forEach((shift) => {
          // Verifica se questo utente ha anche IRCAC nello stesso giorno
          const userHasIRCAC = dayShifts.some(
            (s) => s.user_id === shift.user_id && shiftTypes.find((st) => st.id === s.shift_type_id)?.name === "IRCAC",
          )

          if (!userHasIRCAC) {
            organizedShifts.push({
              type: "single",
              shifts: [shift],
              user_name: shift.users?.name || "Sconosciuto",
              user_id: shift.user_id,
              totalHours: calculateShiftHours(shift.start_time, shift.end_time),
              hasRientroUfficio: false,
            })
          }
        })
      }

      // 3. Doppi turni (IRCAC + turno successivo)
      if (shiftsByType["IRCAC"]) {
        shiftsByType["IRCAC"].forEach((ircacShift) => {
          const userOtherShifts = dayShifts.filter((s) => s.user_id === ircacShift.user_id && s.id !== ircacShift.id)

          if (userOtherShifts.length > 0) {
            // Ordina: IRCAC prima, poi gli altri
            const allUserShifts = [ircacShift, ...userOtherShifts].sort((a, b) => {
              const aType = shiftTypes.find((st) => st.id === a.shift_type_id)
              const bType = shiftTypes.find((st) => st.id === b.shift_type_id)

              if (aType?.name === "IRCAC") return -1
              if (bType?.name === "IRCAC") return 1
              return 0
            })

            const totalHours = allUserShifts.reduce(
              (total, shift) => total + calculateShiftHours(shift.start_time, shift.end_time),
              0,
            )

            organizedShifts.push({
              type: "double",
              shifts: allUserShifts,
              user_name: ircacShift.users?.name || "Sconosciuto",
              user_id: ircacShift.user_id,
              totalHours,
              hasRientroUfficio: true,
            })
          } else {
            // IRCAC singolo
            organizedShifts.push({
              type: "single",
              shifts: [ircacShift],
              user_name: ircacShift.users?.name || "Sconosciuto",
              user_id: ircacShift.user_id,
              totalHours: calculateShiftHours(ircacShift.start_time, ircacShift.end_time),
              hasRientroUfficio: false,
            })
          }
        })
      }

      // 4. Chiusura (solo quelli che non hanno IRCAC)
      if (shiftsByType["Chiusura"]) {
        shiftsByType["Chiusura"].forEach((shift) => {
          const userHasIRCAC = dayShifts.some(
            (s) => s.user_id === shift.user_id && shiftTypes.find((st) => st.id === s.shift_type_id)?.name === "IRCAC",
          )

          if (!userHasIRCAC) {
            organizedShifts.push({
              type: "single",
              shifts: [shift],
              user_name: shift.users?.name || "Sconosciuto",
              user_id: shift.user_id,
              totalHours: calculateShiftHours(shift.start_time, shift.end_time),
              hasRientroUfficio: false,
            })
          }
        })
      }

      // 5. Aeroporto (alla fine)
      if (shiftsByType["Aeroporto"]) {
        shiftsByType["Aeroporto"].forEach((shift) => {
          organizedShifts.push({
            type: "airport",
            shifts: [shift],
            user_name: shift.users?.name || "Sconosciuto",
            user_id: shift.user_id,
            totalHours: calculateShiftHours(shift.start_time, shift.end_time),
            hasRientroUfficio: false,
          })
        })
      }

      return organizedShifts
    }

    return (
      <div className="w-full space-y-4">
        <Card className="w-full">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Turni Settimanali
                {hasAdvancedPermissions && (
                  <Badge variant="outline" className="ml-1 bg-blue-50 text-blue-700 border-blue-200">
                    <Shield className="h-3 w-3 mr-1" />
                    {currentUser?.role === "admin" ? "Admin" : "Moderatore"}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={previousWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={nextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-center text-sm text-gray-600">{getWeekRange()}</div>

            {/* Legenda compatta per mobile */}
            <div className="flex flex-wrap gap-2 pt-2">
              {shiftTypes
                .filter((type) => type.name !== "Aeroporto")
                .slice(0, 4)
                .map((type) => (
                  <Badge
                    key={type.id}
                    variant="outline"
                    className="text-xs"
                    style={{ borderColor: type.color, color: type.color }}
                  >
                    {type.name === "Apertura" && <Star className="h-2 w-2 mr-1" />}
                    {type.name}
                  </Badge>
                ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {weekDays.map((day, index) => {
              const organizedShifts = getOrganizedShiftsForDay(day)
              const isCurrentDay = isToday(day)
              const isPastDay = isPast(day)
              const canInteract = canInteractWithDate(day)

              return (
                <div
                  key={index}
                  className={cn("border rounded-lg p-4", {
                    "bg-blue-50 border-blue-200": isCurrentDay,
                    "bg-gray-50 border-gray-200": isPastDay,
                    "border-gray-200": !isCurrentDay && !isPastDay,
                  })}
                >
                  {/* Header del giorno */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold text-lg">
                        {dayNames[index]} {formatDisplayDate(day)}
                        {isPastDay && (
                          <Badge variant="outline" className="ml-2 text-xs text-gray-600 border-gray-300 bg-gray-100">
                            Completato
                          </Badge>
                        )}
                        {isPastDay && hasAdvancedPermissions && (
                          <Badge variant="outline" className="ml-2 text-xs text-gray-600 border-gray-300 bg-gray-100">
                            Modificabile
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{organizedShifts.length} turni</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleAddShift(formatDate(day))} className="h-9">
                      <Plus className="h-4 w-4 mr-1" />
                      {hasAdvancedPermissions ? (
                        isPastDay ? "Aggiungi (Passato)" : "Aggiungi Turno"
                      ) : (
                        "Mio Turno"
                      )}
                    </Button>
                  </div>

                  {/* Turni del giorno organizzati */}
                  {organizedShifts.length === 0 ? (
                    <div className="text-center text-gray-400 py-4 text-sm">Nessun turno programmato</div>
                  ) : (
                    <div className="space-y-3">
                      {organizedShifts.map((shiftGroup, groupIndex) => (
                        <div key={`${shiftGroup.user_id}-${groupIndex}`} className="space-y-2">
                          {/* Header del gruppo utente */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-base">{shiftGroup.user_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {shiftGroup.totalHours.toFixed(1)}h
                              </Badge>
                              {shiftGroup.type === "double" && (
                                <Badge variant="secondary" className="text-xs">
                                  Doppio Turno
                                </Badge>
                              )}
                              {shiftGroup.type === "airport" && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-orange-50 border-orange-200 text-orange-700"
                                >
                                  ✈️ Aeroporto
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Turni del gruppo */}
                          {shiftGroup.shifts.map((shift, shiftIndex) => {
                            const shiftType = shiftTypes.find((st) => st.id === shift.shift_type_id)
                            if (!shiftType) return null

                            const isApertura = shiftType.name === "Apertura"
                            const isIRCAC = shiftType.name === "IRCAC"
                            const showRientroUfficio =
                              shiftGroup.hasRientroUfficio && isIRCAC && shiftIndex < shiftGroup.shifts.length - 1

                            return (
                              <div key={shift.id}>
                                <div
                                  className="border rounded-lg p-3 ml-4"
                                  style={{
                                    backgroundColor: `${shiftType.color}08`,
                                    borderColor: `${shiftType.color}40`,
                                  }}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        {isApertura && <Star className="h-4 w-4 text-yellow-500" />}
                                        <span className="font-semibold" style={{ color: shiftType.color }}>
                                          {shiftType.name}
                                        </span>
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
                                        <span className="ml-2 font-medium">
                                          ({calculateShiftHours(shift.start_time, shift.end_time).toFixed(1)}h)
                                        </span>
                                      </div>
                                      {shift.notes && (
                                        <div className="text-sm text-gray-500 italic mt-2 bg-white p-2 rounded">
                                          {shift.notes}
                                        </div>
                                      )}
                                    </div>

                                    {/* Pulsanti azione */}
                                    {(canEditShift(shift) || canDeleteShift(shift)) && (
                                      <div className="flex flex-col gap-1 ml-2">
                                        {canEditShift(shift) && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditShift(shift)}
                                            className="h-8 w-8 p-0"
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                        )}
                                        {canDeleteShift(shift) && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteShift(shift.id)}
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Badge rientro ufficio dopo IRCAC */}
                                {showRientroUfficio && (
                                  <div className="flex items-center justify-center py-2 ml-4">
                                    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                                      <ArrowRight className="h-3 w-3" />
                                      <span className="font-medium">Rientro Ufficio</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Dialog per aggiungere turno */}
        {currentUser && (
          <AddShiftDialog
            isOpen={showAddDialog}
            onClose={() => setShowAddDialog(false)}
            onSave={handleAddShiftSave}
            date={selectedDate}
            shiftTypes={shiftTypes}
            users={users}
            currentUser={currentUser}
            isLoading={isAddingShift}
          />
        )}

        {/* Dialog per modificare turno */}
        {currentUser && (
          <EditShiftDialog
            isOpen={showEditDialog}
            onClose={() => {
              setShowEditDialog(false)
              setEditingShift(null)
            }}
            onSave={handleEditShiftSave}
            shift={editingShift}
            shiftTypes={shiftTypes}
            users={users}
            currentUser={currentUser}
            isLoading={isEditingShift}
          />
        )}
      </div>
    )
  }

  // VISTA DESKTOP - Griglia originale (mantenuta invariata per desktop)
  const getGroupedShiftsForDay = (date: Date): GroupedShift[] => {
    const dateString = formatDate(date)
    const dayShifts = shifts.filter((shift) => {
      const shiftType = shiftTypes.find((st) => st.id === shift.shift_type_id)
      return shift.date === dateString && shiftType?.name !== "Aeroporto"
    })

    // Raggruppa per utente PRIMA di ordinare per tipo
    const userGroups: Record<string, { user_id: string; user_name: string; shifts: Shift[] }> = {}

    dayShifts.forEach((shift) => {
      const userId = shift.user_id
      if (!userGroups[userId]) {
        userGroups[userId] = {
          user_id: userId,
          user_name: shift.users?.name || "Sconosciuto",
          shifts: [],
        }
      }
      userGroups[userId].shifts.push(shift)
    })

    // Ordina gli utenti secondo la logica: Apertura, 2° Turno (senza IRCAC), Doppi turni (IRCAC+altro), Chiusura (senza IRCAC)
    const orderedUsers: Array<{ user_id: string; user_name: string; shifts: Shift[]; priority: number }> = []

    Object.values(userGroups).forEach((group) => {
      const hasApertura = group.shifts.some((shift) => {
        const shiftType = shiftTypes.find((st) => st.id === shift.shift_type_id)
        return shiftType?.name === "Apertura"
      })

      const hasIRCAC = group.shifts.some((shift) => {
        const shiftType = shiftTypes.find((st) => st.id === shift.shift_type_id)
        return shiftType?.name === "IRCAC"
      })

      const hasSecondoTurno = group.shifts.some((shift) => {
        const shiftType = shiftTypes.find((st) => st.id === shift.shift_type_id)
        return shiftType?.name === "2° Turno"
      })

      const hasChiusura = group.shifts.some((shift) => {
        const shiftType = shiftTypes.find((st) => st.id === shift.shift_type_id)
        return shiftType?.name === "Chiusura"
      })

      let priority = 999

      if (hasApertura) {
        priority = 1 // Apertura sempre prima
      } else if (hasSecondoTurno && !hasIRCAC) {
        priority = 2 // 2° Turno senza IRCAC
      } else if (hasIRCAC) {
        priority = 3 // Doppi turni (IRCAC + altro)
      } else if (hasChiusura && !hasIRCAC) {
        priority = 4 // Chiusura senza IRCAC
      }

      orderedUsers.push({
        ...group,
        priority,
      })
    })

    // Ordina per priorità
    orderedUsers.sort((a, b) => a.priority - b.priority)

    const groupedShifts: GroupedShift[] = orderedUsers.map((group, index) => {
      const totalHours = group.shifts.reduce((total, shift) => {
        return total + calculateShiftHours(shift.start_time, shift.end_time)
      }, 0)

      const hasIRCAC = group.shifts.some((shift) => {
        const shiftType = shiftTypes.find((st) => st.id === shift.shift_type_id)
        return shiftType?.name === "IRCAC"
      })

      const hasSecondShift = group.shifts.length > 1

      const sortedShifts = group.shifts.sort((a, b) => {
        const aType = shiftTypes.find((st) => st.id === a.shift_type_id)
        const bType = shiftTypes.find((st) => st.id === b.shift_type_id)

        const getShiftPriority = (shiftType: ShiftType | undefined) => {
          if (!shiftType) return 999
          switch (shiftType.name) {
            case "IRCAC":
              return 0
            case "2° Turno":
              return 1
            case "Chiusura":
              return 2
            default:
              return 3
          }
        }

        return getShiftPriority(aType) - getShiftPriority(bType)
      })

      const shiftKey = `${dateString}-${group.user_id}`

      return {
        id: shiftKey,
        user_id: group.user_id,
        user_name: group.user_name,
        shifts: sortedShifts,
        totalHours,
        displayOrder: index,
        hasIRCAC,
        hasSecondShift,
      }
    })

    return groupedShifts
  }

  const getAirportShiftsForDay = (date: Date): Shift[] => {
    const dateString = formatDate(date)
    // Turni Aeroporto: sempre alla fine, per TUTTI i giorni
    return shifts.filter((shift) => {
      const shiftType = shiftTypes.find((st) => st.id === shift.shift_type_id)
      return shift.date === dateString && shiftType?.name === "Aeroporto"
    })
  }

  const renderShiftGroup = (group: GroupedShift, date: Date) => {
    const isPastDay = isPast(date)

    return (
      <div
        key={group.id}
        className="p-2 md:p-3 rounded-lg border transition-all duration-200 bg-white shadow-sm hover:shadow-md border-gray-200"
      >
        <div className="space-y-1 md:space-y-2">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <div className="flex items-center gap-1 md:gap-2">
              <span className="font-semibold text-xs text-gray-900">{group.user_name}</span>
              <Badge variant="outline" className="text-xs font-medium px-1 py-0">
                {group.totalHours.toFixed(1)}h
              </Badge>
            </div>
          </div>

          <div className="space-y-1">
            {group.shifts.map((shift, shiftIndex) => {
              const shiftType = shiftTypes.find((st) => st.id === shift.shift_type_id)
              if (!shiftType) return null

              const isApertura = shiftType.name === "Apertura"
              const isIRCAC = shiftType.name === "IRCAC"
              const showRientroUfficio = isIRCAC && group.hasSecondShift && shiftIndex < group.shifts.length - 1

              return (
                <div key={shift.id}>
                  <div
                    className="flex items-center justify-between p-1 md:p-2 rounded text-xs border-l-3"
                    style={{
                      backgroundColor: `${shiftType.color}08`,
                      borderLeftColor: shiftType.color,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        {isApertura && <Star className="h-2 w-2 md:h-3 md:w-3 text-yellow-500" />}
                        <span className="font-medium text-xs truncate" style={{ color: shiftType.color }}>
                          {shiftType.name}
                        </span>
                      </div>
                      <div className="text-gray-600 text-xs">
                        {shift.start_time?.slice(0, 5)}-{shift.end_time?.slice(0, 5)}
                        <span className="ml-1 text-gray-500">
                          ({calculateShiftHours(shift.start_time, shift.end_time).toFixed(1)}h)
                        </span>
                      </div>
                      {shift.notes && (
                        <div className="text-gray-500 italic text-xs mt-1 bg-gray-50 px-1 py-0.5 rounded truncate">
                          {shift.notes}
                        </div>
                      )}
                    </div>

                    {(canEditShift(shift) || canDeleteShift(shift)) && (
                      <div className="flex flex-col gap-0.5 ml-1 md:ml-2">
                        {canEditShift(shift) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditShift(shift)
                            }}
                            className="text-blue-500 hover:text-blue-700 p-0.5 rounded hover:bg-blue-100 transition-colors"
                            title="Modifica turno"
                          >
                            <Edit className="h-2 w-2 md:h-3 md:w-3" />
                          </button>
                        )}
                        {canDeleteShift(shift) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteShift(shift.id)
                            }}
                            className="text-red-500 hover:text-red-700 p-0.5 rounded hover:bg-red-100 transition-colors"
                            title="Elimina turno"
                          >
                            <Trash2 className="h-2 w-2 md:h-3 md:w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {showRientroUfficio && (
                    <div className="flex items-center justify-center py-0.5">
                      <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-1 md:px-1.5 py-0.5 rounded border border-blue-200">
                        <ArrowRight className="h-2 w-2 md:h-2.5 md:w-2.5" />
                        <span className="text-xs font-medium">Rientro Ufficio</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 md:space-y-6">
      <Card className="w-full">
        <CardHeader className="pb-3 md:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Clock className="h-4 w-4 md:h-5 md:w-5" />
              Turni Settimanali
              {hasAdvancedPermissions && (
                <Badge variant="outline" className="ml-1 bg-blue-50 text-blue-700 border-blue-200">
                  <Shield className="h-3 w-3 mr-1" />
                  {currentUser?.role === "admin" ? "Admin" : "Moderatore"}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={previousWeek}>
                <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              <span className="font-medium text-sm md:text-base min-w-[150px] md:min-w-[200px] text-center">
                {getWeekRange()}
              </span>
              <Button variant="outline" size="sm" onClick={nextWeek}>
                <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 md:gap-2 pt-2">
            {shiftTypes
              .filter((type) => type.name !== "Aeroporto")
              .sort((a, b) => {
                const order = ["Apertura", "2° Turno", "IRCAC", "Chiusura"]
                return order.indexOf(a.name) - order.indexOf(b.name)
              })
              .map((type) => (
                <Badge
                  key={type.id}
                  variant="outline"
                  className="text-xs font-medium"
                  style={{ borderColor: type.color, color: type.color }}
                >
                  {type.name === "Apertura" && <Star className="h-2 w-2 md:h-3 md:w-3 mr-1" />}
                  {type.name}
                </Badge>
              ))}
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-7 gap-1 md:gap-2 w-full">
            {weekDays.map((day, index) => {
              const groupedShifts = getGroupedShiftsForDay(day)
              const isCurrentDay = isToday(day)
              const isPastDay = isPast(day)
              const canInteract = canInteractWithDate(day)

              return (
                <div
                  key={index}
                  className={cn("min-h-[200px] md:min-h-[350px] border-2 rounded-lg p-1 md:p-2", {
                    "bg-blue-50 border-blue-200": isCurrentDay,
                    "bg-gray-50 border-gray-200": isPastDay,
                    "border-gray-200 hover:border-gray-300": !isCurrentDay && !isPastDay,
                  })}
                >
                  <div className="text-center mb-2 md:mb-3 pb-1 md:pb-2 border-b border-gray-200">
                    <div className="font-medium text-xs text-gray-600">{dayNamesShort[index]}</div>
                    <div
                      className={cn("text-sm md:text-lg font-bold", {
                        "text-blue-600": isCurrentDay,
                        "text-gray-400": isPastDay,
                        "text-gray-900": !isCurrentDay && !isPastDay,
                      })}
                    >
                      {formatDisplayDate(day)}
                    </div>
                    {isPastDay && hasAdvancedPermissions && (
                      <Badge variant="outline" className="text-xs text-gray-600 mt-1 border-gray-300 bg-gray-100">
                        Passato
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    {groupedShifts.map((group) => renderShiftGroup(group, day))}

                    {canInteract && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-6 md:h-8 border-dashed border-2 hover:border-blue-300 hover:bg-blue-50"
                        onClick={() => handleAddShift(formatDate(day))}
                      >
                        <Plus className="h-2 w-2 md:h-3 md:w-3 mr-1" />
                        <span className="hidden md:inline">
                          {hasAdvancedPermissions ? "Aggiungi Turno" : "Mio Turno"}
                        </span>
                        <span className="md:hidden">+</span>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-orange-500"></div>
            Turni Aeroporto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 md:gap-2 w-full">
            {weekDays.map((day, index) => {
              const airportShifts = getAirportShiftsForDay(day)
              const isCurrentDay = isToday(day)
              const isPastDay = isPast(day)
              const canInteract = canInteractWithDate(day)

              return (
                <div
                  key={`airport-${index}`}
                  className={cn("min-h-[60px] md:min-h-[80px] border rounded-lg p-1 md:p-2", {
                    "bg-blue-50 border-blue-200": isCurrentDay,
                    "bg-gray-50 border-gray-200": isPastDay,
                    "border-gray-200": !isCurrentDay && !isPastDay,
                  })}
                >
                  <div className="text-center mb-1 md:mb-2 pb-1 border-b border-gray-200">
                    <div className="font-medium text-xs text-gray-600">{dayNamesShort[index]}</div>
                    <div className="text-xs md:text-sm font-bold text-gray-500">{formatDisplayDate(day)}</div>
                    {isPastDay && hasAdvancedPermissions && (
                      <Badge variant="outline" className="text-xs text-gray-600 mt-1 border-gray-300 bg-gray-100">
                        Passato
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    {airportShifts.map((shift) => {
                      const shiftType = shiftTypes.find((st) => st.id === shift.shift_type_id)
                      if (!shiftType) return null

                      return (
                        <div
                          key={shift.id}
                          className="flex items-center justify-between p-1 md:p-1.5 rounded text-xs border-l-3"
                          style={{
                            backgroundColor: `${shiftType.color}08`,
                            borderLeftColor: shiftType.color,
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs truncate" style={{ color: shiftType.color }}>
                              {shift.users?.name}
                            </div>
                            <div className="text-gray-600 text-xs">
                              {shift.start_time?.slice(0, 5)}-{shift.end_time?.slice(0, 5)}
                              <span className="ml-1 text-gray-500">
                                ({calculateShiftHours(shift.start_time, shift.end_time).toFixed(1)}h)
                              </span>
                            </div>
                            {shift.notes && (
                              <div className="text-gray-500 italic text-xs mt-1 bg-gray-50 px-1 py-0.5 rounded truncate">
                                {shift.notes}
                              </div>
                            )}
                          </div>

                          {(canEditShift(shift) || canDeleteShift(shift)) && (
                            <div className="flex flex-col gap-0.5 ml-1 md:ml-2">
                              {canEditShift(shift) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditShift(shift)
                                  }}
                                  className="text-blue-500 hover:text-blue-700 p-0.5 rounded hover:bg-blue-100 transition-colors"
                                  title="Modifica turno"\
                                >ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)ift(shift)
