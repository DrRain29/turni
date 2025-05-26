"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Users,
  Star,
  ArrowRight,
} from "lucide-react"
import type { Shift, ShiftType, User } from "@/types/database"
import { cn } from "@/lib/utils"
import { AddShiftDialog } from "./add-shift-dialog"
import { EditShiftDialog } from "./edit-shift-dialog"

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

interface EmployeeReport {
  user_id: string
  name: string
  email: string
  totalHours: number
  shiftCount: number
  shiftsByType: Record<string, { count: number; hours: number }>
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
  const [draggedItem, setDraggedItem] = useState<{ groupId: string; date: string } | null>(null)
  const [shiftOrders, setShiftOrders] = useState<Record<string, number>>({})

  const dayNames = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"]

  // Calcola l'inizio della settimana (lunedì)
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  // Verifica se è la settimana corrente
  const isCurrentWeek = () => {
    const today = new Date()
    const currentWeekStart = getWeekStart(today)
    const viewingWeekStart = getWeekStart(currentWeek)
    return currentWeekStart.getTime() === viewingWeekStart.getTime()
  }

  const weekStart = getWeekStart(currentWeek)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + i)
    return day
  })

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]
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

  // Funzione per ottenere i turni aeroporto per giorno
  const getAirportShiftsForDay = (date: Date): Shift[] => {
    const dateString = formatDate(date)
    return shifts.filter((shift) => {
      const shiftType = shiftTypes.find((st) => st.id === shift.shift_type_id)
      return shift.date === dateString && shiftType?.name === "Aeroporto"
    })
  }

  // Raggruppa i turni per utente e giorno, escludendo Aeroporto
  const getGroupedShiftsForDay = (date: Date): GroupedShift[] => {
    const dateString = formatDate(date)
    const dayShifts = shifts.filter((shift) => {
      const shiftType = shiftTypes.find((st) => st.id === shift.shift_type_id)
      return shift.date === dateString && shiftType?.name !== "Aeroporto"
    })

    // Prima raggruppa per tipo di turno per l'ordinamento generale
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

    // Ordina i tipi di turno: Apertura, 2° Turno, IRCAC, Chiusura
    const typeOrder = ["Apertura", "2° Turno", "IRCAC", "Chiusura"]
    const orderedShifts: Shift[] = []

    typeOrder.forEach((typeName) => {
      if (shiftsByType[typeName]) {
        orderedShifts.push(...shiftsByType[typeName])
      }
    })

    // Aggiungi eventuali altri tipi non previsti
    Object.keys(shiftsByType).forEach((typeName) => {
      if (!typeOrder.includes(typeName)) {
        orderedShifts.push(...shiftsByType[typeName])
      }
    })

    // Ora raggruppa per utente mantenendo l'ordine
    const userGroups: Record<string, { user_id: string; user_name: string; shifts: Shift[] }> = {}
    const userOrder: string[] = []

    orderedShifts.forEach((shift) => {
      const userId = shift.user_id
      if (!userGroups[userId]) {
        userGroups[userId] = {
          user_id: userId,
          user_name: shift.users?.name || "Sconosciuto",
          shifts: [],
        }
        userOrder.push(userId)
      }
      userGroups[userId].shifts.push(shift)
    })

    // Converte in array mantenendo l'ordine
    const groupedShifts: GroupedShift[] = userOrder.map((userId, index) => {
      const group = userGroups[userId]
      const totalHours = group.shifts.reduce((total, shift) => {
        return total + calculateShiftHours(shift.start_time, shift.end_time)
      }, 0)

      // Verifica se ha IRCAC e altri turni
      const hasIRCAC = group.shifts.some((shift) => {
        const shiftType = shiftTypes.find((st) => st.id === shift.shift_type_id)
        return shiftType?.name === "IRCAC"
      })

      const hasSecondShift = group.shifts.length > 1

      // Ordina i turni dell'utente: IRCAC prima degli altri turni dello stesso utente
      const sortedShifts = group.shifts.sort((a, b) => {
        const aType = shiftTypes.find((st) => st.id === a.shift_type_id)
        const bType = shiftTypes.find((st) => st.id === b.shift_type_id)

        const getShiftPriority = (shiftType: ShiftType | undefined) => {
          if (!shiftType) return 999
          switch (shiftType.name) {
            case "IRCAC":
              return 0 // IRCAC sempre per primo nell'utente
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
      const displayOrder = shiftOrders[shiftKey] ?? index

      return {
        id: shiftKey,
        user_id: group.user_id,
        user_name: group.user_name,
        shifts: sortedShifts,
        totalHours,
        displayOrder,
        hasIRCAC,
        hasSecondShift,
      }
    })

    return groupedShifts
  }

  // Genera report dipendenti (solo per settimana corrente)
  const generateEmployeeReport = (): EmployeeReport[] => {
    if (!isCurrentWeek()) return []

    const userReports: Record<string, EmployeeReport> = {}

    // Inizializza tutti gli utenti
    users.forEach((user) => {
      userReports[user.id] = {
        user_id: user.id,
        name: user.name,
        email: user.email,
        totalHours: 0,
        shiftCount: 0,
        shiftsByType: {},
      }
    })

    // Calcola statistiche dai turni
    shifts.forEach((shift) => {
      const userId = shift.user_id
      if (!userReports[userId]) return

      const hours = calculateShiftHours(shift.start_time, shift.end_time)
      const shiftType = shiftTypes.find((st) => st.id === shift.shift_type_id)

      userReports[userId].totalHours += hours
      userReports[userId].shiftCount += 1

      if (shiftType) {
        if (!userReports[userId].shiftsByType[shiftType.name]) {
          userReports[userId].shiftsByType[shiftType.name] = { count: 0, hours: 0 }
        }
        userReports[userId].shiftsByType[shiftType.name].count += 1
        userReports[userId].shiftsByType[shiftType.name].hours += hours
      }
    })

    return Object.values(userReports).sort((a, b) => b.totalHours - a.totalHours)
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
    today.setHours(0, 0, 0, 0)
    return date < today
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
    return currentUser.role === "admin" || shift.user_id === currentUser.id
  }

  const canDeleteShift = (shift: Shift) => {
    if (!currentUser) return false
    return currentUser.role === "admin" || shift.user_id === currentUser.id
  }

  // Drag & Drop handlers corretti
  const handleDragStart = (e: React.DragEvent, groupId: string, date: string) => {
    e.stopPropagation()
    setDraggedItem({ groupId, date })
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", groupId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetGroupId: string, targetDate: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedItem || draggedItem.groupId === targetGroupId || draggedItem.date !== targetDate) {
      setDraggedItem(null)
      return
    }

    const dayGroups = getGroupedShiftsForDay(new Date(targetDate))
    const draggedIndex = dayGroups.findIndex((g) => g.id === draggedItem.groupId)
    const targetIndex = dayGroups.findIndex((g) => g.id === targetGroupId)

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newOrders = { ...shiftOrders }

      // Scambia gli ordini
      newOrders[draggedItem.groupId] = targetIndex
      newOrders[targetGroupId] = draggedIndex

      // Aggiorna tutti gli altri ordini nel mezzo
      dayGroups.forEach((group, index) => {
        if (group.id !== draggedItem.groupId && group.id !== targetGroupId) {
          if (index >= Math.min(draggedIndex, targetIndex) && index <= Math.max(draggedIndex, targetIndex)) {
            if (draggedIndex < targetIndex) {
              newOrders[group.id] = index - 1
            } else {
              newOrders[group.id] = index + 1
            }
          } else {
            newOrders[group.id] = index
          }
        }
      })

      setShiftOrders(newOrders)
    }

    setDraggedItem(null)
  }

  const renderShiftGroup = (group: GroupedShift, date: Date) => {
    const isPastDay = isPast(date)
    const canInteract = isLoggedIn && currentUser && !isPastDay
    const dateString = formatDate(date)
    const isDragging = draggedItem?.groupId === group.id

    return (
      <div
        key={group.id}
        draggable={canInteract}
        onDragStart={(e) => handleDragStart(e, group.id, dateString)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, group.id, dateString)}
        className={cn("p-3 rounded-lg border transition-all duration-200 bg-white shadow-sm", "hover:shadow-md", {
          "opacity-50 scale-95": isDragging,
          "border-blue-300 bg-blue-50":
            draggedItem && draggedItem.groupId !== group.id && draggedItem.date === dateString,
          "cursor-move": canInteract,
          "border-gray-200": !isDragging && (!draggedItem || draggedItem.date !== dateString),
        })}
      >
        <div className="space-y-2">
          {/* Header del gruppo con nome utente e ore totali */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {canInteract && <GripVertical className="h-3 w-3 text-gray-400 cursor-grab" />}
              <span className="font-semibold text-xs text-gray-900">{group.user_name}</span>
              <Badge variant="outline" className="text-xs font-medium px-1 py-0">
                {group.totalHours.toFixed(1)}h
              </Badge>
            </div>
          </div>

          {/* Turni del gruppo con indicatore rientro ufficio */}
          <div className="space-y-1">
            {group.shifts.map((shift, shiftIndex) => {
              const shiftType = shiftTypes.find((st) => st.id === shift.shift_type_id)
              if (!shiftType) return null

              const isApertura = shiftType.name === "Apertura"
              const isIRCAC = shiftType.name === "IRCAC"

              // Mostra il badge rientro ufficio dopo IRCAC se c'è un turno successivo
              const showRientroUfficio = isIRCAC && group.hasSecondShift && shiftIndex < group.shifts.length - 1

              return (
                <div key={shift.id}>
                  <div
                    className="flex items-center justify-between p-2 rounded text-xs border-l-3"
                    style={{
                      backgroundColor: `${shiftType.color}08`,
                      borderLeftColor: shiftType.color,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        {isApertura && <Star className="h-3 w-3 text-yellow-500" />}
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

                    {/* Pulsanti azione compatti */}
                    {(canEditShift(shift) || canDeleteShift(shift)) && (
                      <div className="flex flex-col gap-0.5 ml-2">
                        {canEditShift(shift) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditShift(shift)
                            }}
                            className="text-blue-500 hover:text-blue-700 p-0.5 rounded hover:bg-blue-100 transition-colors"
                            title="Modifica turno"
                          >
                            <Edit className="h-3 w-3" />
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
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Badge rientro ufficio dopo IRCAC */}
                  {showRientroUfficio && (
                    <div className="flex items-center justify-center py-0.5">
                      <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        <ArrowRight className="h-2.5 w-2.5" />
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

  const employeeReport = generateEmployeeReport()

  return (
    <div className="w-full space-y-6">
      {/* Calendario principale */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Turni Settimanali
              {!isCurrentWeek() && (
                <Badge variant="outline" className="ml-2">
                  Settimana Passata/Futura
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={previousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[200px] text-center">{getWeekRange()}</span>
              <Button variant="outline" size="sm" onClick={nextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Legenda tipi di turno */}
          <div className="flex flex-wrap gap-2 pt-2">
            {shiftTypes
              .filter((type) => type.name !== "Aeroporto") // Escludi Aeroporto dalla legenda principale
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
                  {type.name === "Apertura" && <Star className="h-3 w-3 mr-1" />}
                  {type.name}
                </Badge>
              ))}
          </div>

          {/* Istruzioni */}
          {isLoggedIn && currentUser && (
            <div className="text-xs text-gray-500 pt-2 bg-blue-50 p-2 rounded">
              💡 <strong>Suggerimento:</strong> Trascina i gruppi di turni per riordinarli nel giorno
              <br />
              <ArrowRight className="h-3 w-3 inline mr-1" />
              <strong>Rientro Ufficio:</strong> Appare automaticamente tra IRCAC e turno successivo dello stesso utente
              <br />
              ✈️ <strong>Aeroporto:</strong> I turni aeroporto sono mostrati nella sezione separata sotto
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Griglia calendario più larga */}
          <div className="grid grid-cols-7 gap-2 w-full">
            {weekDays.map((day, index) => {
              const groupedShifts = getGroupedShiftsForDay(day)
              const isCurrentDay = isToday(day)
              const isPastDay = isPast(day)

              return (
                <div
                  key={index}
                  className={cn("min-h-[350px] border-2 rounded-lg p-2", {
                    "bg-blue-50 border-blue-200": isCurrentDay,
                    "bg-gray-50 border-gray-200": isPastDay,
                    "border-gray-200 hover:border-gray-300": !isCurrentDay && !isPastDay,
                  })}
                >
                  {/* Header del giorno */}
                  <div className="text-center mb-3 pb-2 border-b border-gray-200">
                    <div className="font-medium text-xs text-gray-600">{dayNames[index]}</div>
                    <div
                      className={cn("text-lg font-bold", {
                        "text-blue-600": isCurrentDay,
                        "text-gray-400": isPastDay,
                        "text-gray-900": !isCurrentDay && !isPastDay,
                      })}
                    >
                      {formatDisplayDate(day)}
                    </div>
                  </div>

                  {/* Gruppi di turni */}
                  <div className="space-y-2">
                    {groupedShifts.map((group) => renderShiftGroup(group, day))}

                    {/* Pulsante aggiungi turno */}
                    {isLoggedIn && currentUser && !isPastDay && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8 border-dashed border-2 hover:border-blue-300 hover:bg-blue-50"
                        onClick={() => handleAddShift(formatDate(day))}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {currentUser.role === "admin" ? "Aggiungi" : "Mio Turno"}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sezione Aeroporto separata */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            Turni Aeroporto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 w-full">
            {weekDays.map((day, index) => {
              const airportShifts = getAirportShiftsForDay(day)
              const isCurrentDay = isToday(day)
              const isPastDay = isPast(day)

              return (
                <div
                  key={`airport-${index}`}
                  className={cn("min-h-[80px] border rounded-lg p-2", {
                    "bg-blue-50 border-blue-200": isCurrentDay,
                    "bg-gray-50 border-gray-200": isPastDay,
                    "border-gray-200": !isCurrentDay && !isPastDay,
                  })}
                >
                  {/* Header del giorno */}
                  <div className="text-center mb-2 pb-1 border-b border-gray-200">
                    <div className="font-medium text-xs text-gray-600">{dayNames[index]}</div>
                    <div className="text-sm font-bold text-gray-500">{formatDisplayDate(day)}</div>
                  </div>

                  {/* Turni aeroporto */}
                  <div className="space-y-1">
                    {airportShifts.map((shift) => {
                      const shiftType = shiftTypes.find((st) => st.id === shift.shift_type_id)
                      if (!shiftType) return null

                      return (
                        <div
                          key={shift.id}
                          className="flex items-center justify-between p-1.5 rounded text-xs border-l-3"
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

                          {/* Pulsanti azione */}
                          {(canEditShift(shift) || canDeleteShift(shift)) && (
                            <div className="flex flex-col gap-0.5 ml-2">
                              {canEditShift(shift) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditShift(shift)
                                  }}
                                  className="text-blue-500 hover:text-blue-700 p-0.5 rounded hover:bg-blue-100 transition-colors"
                                  title="Modifica turno"
                                >
                                  <Edit className="h-3 w-3" />
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
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* Pulsante aggiungi turno aeroporto */}
                    {isLoggedIn && currentUser && !isPastDay && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-6 border-dashed border-2 hover:border-orange-300 hover:bg-orange-50"
                        onClick={() => handleAddShift(formatDate(day))}
                      >
                        <Plus className="h-2.5 w-2.5 mr-1" />
                        Aeroporto
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Report dipendenti (solo per settimana corrente) */}
      {isCurrentWeek() && employeeReport.length > 0 && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Report Dipendenti - Settimana Corrente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employeeReport.map((employee, index) => (
                <div
                  key={employee.user_id}
                  className={cn("p-4 rounded-lg border", {
                    "bg-yellow-50 border-yellow-200": index === 0 && employee.totalHours > 0,
                    "bg-gray-50 border-gray-200": employee.totalHours === 0,
                    "bg-white border-gray-200": employee.totalHours > 0 && index !== 0,
                  })}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {index === 0 && employee.totalHours > 0 && <Star className="h-4 w-4 text-yellow-500" />}
                        <span className="font-semibold text-lg">{employee.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">{employee.email}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{employee.totalHours.toFixed(1)}h</div>
                      <div className="text-sm text-gray-500">{employee.shiftCount} turni</div>
                    </div>
                  </div>

                  {/* Dettaglio turni per tipo */}
                  {Object.keys(employee.shiftsByType).length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {Object.entries(employee.shiftsByType).map(([shiftTypeName, data]) => {
                        const shiftType = shiftTypes.find((st) => st.name === shiftTypeName)
                        return (
                          <div key={shiftTypeName} className="text-center p-2 bg-white rounded border">
                            <div className="font-medium text-sm" style={{ color: shiftType?.color || "#666" }}>
                              {shiftTypeName}
                            </div>
                            <div className="text-xs text-gray-600">
                              {data.count} turni • {data.hours.toFixed(1)}h
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {employee.totalHours === 0 && (
                    <div className="text-center text-gray-500 italic">Nessun turno assegnato questa settimana</div>
                  )}
                </div>
              ))}
            </div>

            {/* Riepilogo totale */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Riepilogo Settimana Corrente</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Ore Totali:</span>
                  <div className="text-xl font-bold text-blue-900">
                    {employeeReport.reduce((total, emp) => total + emp.totalHours, 0).toFixed(1)}h
                  </div>
                </div>
                <div>
                  <span className="text-blue-600">Turni Totali:</span>
                  <div className="text-xl font-bold text-blue-900">
                    {employeeReport.reduce((total, emp) => total + emp.shiftCount, 0)}
                  </div>
                </div>
                <div>
                  <span className="text-blue-600">Dipendenti Attivi:</span>
                  <div className="text-xl font-bold text-blue-900">
                    {employeeReport.filter((emp) => emp.totalHours > 0).length}
                  </div>
                </div>
                <div>
                  <span className="text-blue-600">Media Ore/Dipendente:</span>
                  <div className="text-xl font-bold text-blue-900">
                    {employeeReport.filter((emp) => emp.totalHours > 0).length > 0
                      ? (
                          employeeReport.reduce((total, emp) => total + emp.totalHours, 0) /
                          employeeReport.filter((emp) => emp.totalHours > 0).length
                        ).toFixed(1)
                      : "0.0"}
                    h
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
