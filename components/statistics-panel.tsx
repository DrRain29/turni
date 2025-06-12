"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, Users, Clock, TrendingUp, Star, Calendar, RefreshCw, Coffee } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface UserStats {
  user_id: string
  name: string
  email: string
  totalHours: number
  totalShifts: number
  shiftsByType: Record<string, { count: number; hours: number; color: string }>
  shiftsByDay: Record<string, { count: number; hours: number; shifts: any[] }>
  isExempt?: boolean
}

interface WeekDay {
  date: string
  dayName: string
  dayShort: string
  dayNumber: number
  formatted: string
}

interface WeekInfo {
  start: string
  end: string
  startFormatted: string
  endFormatted: string
  isCurrentWeek: boolean
}

interface StatsSummary {
  totalHours: number
  totalShifts: number
  activeUsers: number
  totalUsers: number
  averageHoursPerUser: number
}

interface StatisticsData {
  userStats: UserStats[]
  weekDays: WeekDay[]
  weekInfo: WeekInfo
  summary: StatsSummary
}

export function StatisticsPanel() {
  const [data, setData] = useState<StatisticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetchStatistics()

    // Aggiorna automaticamente ogni 5 minuti
    const interval = setInterval(fetchStatistics, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const fetchStatistics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/statistics")
      if (response.ok) {
        const statsData = await response.json()
        setData(statsData)
        setLastUpdated(new Date())
        setError("")
      } else {
        setError("Errore nel caricamento delle statistiche")
      }
    } catch (error) {
      setError("Errore di connessione")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchStatistics()
  }

  if (isLoading && !data) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Caricamento statistiche...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <p>{error || "Errore nel caricamento"}</p>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Riprova
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header con info settimana - Mobile Responsive */}
      <Card className="w-full">
        <CardHeader className="pb-3 md:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                Settimana Corrente
              </CardTitle>
              <p className="text-xs md:text-sm text-gray-600 mt-1">
                Dal {data.weekInfo.startFormatted} al {data.weekInfo.endFormatted}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              {lastUpdated && (
                <span className="text-xs text-gray-500">Aggiornato: {lastUpdated.toLocaleTimeString("it-IT")}</span>
              )}
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                <RefreshCw className={`h-3 w-3 md:h-4 md:w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Aggiorna
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Riepilogo generale - Mobile Responsive */}
      <Card className="w-full">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
            Riepilogo Settimana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center p-3 md:p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center">
                      <Clock className="h-5 w-5 md:h-6 md:w-6 text-blue-600 mx-auto mb-2" />
                      <Coffee className="h-3 w-3 md:h-4 md:w-4 text-amber-600 ml-1 mb-2" />
                    </div>
                    <div className="text-xl md:text-2xl font-bold text-blue-900">{data.summary.totalHours}h</div>
                    <div className="text-xs md:text-sm text-blue-600">Ore Totali</div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ore totali (già esclusa 1h di pausa nei giorni feriali per turni non Ircac)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="text-center p-3 md:p-4 bg-green-50 rounded-lg">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-600 mx-auto mb-2" />
              <div className="text-xl md:text-2xl font-bold text-green-900">{data.summary.totalShifts}</div>
              <div className="text-xs md:text-sm text-green-600">Turni Totali</div>
            </div>
            <div className="text-center p-3 md:p-4 bg-purple-50 rounded-lg">
              <Users className="h-5 w-5 md:h-6 md:w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-xl md:text-2xl font-bold text-purple-900">{data.summary.activeUsers}</div>
              <div className="text-xs md:text-sm text-purple-600">Dipendenti Attivi</div>
            </div>
            <div className="text-center p-3 md:p-4 bg-orange-50 rounded-lg">
              <Users className="h-5 w-5 md:h-6 md:w-6 text-orange-600 mx-auto mb-2" />
              <div className="text-xl md:text-2xl font-bold text-orange-900">{data.summary.totalUsers}</div>
              <div className="text-xs md:text-sm text-orange-600">Totale Dipendenti</div>
            </div>
            <div className="col-span-2 lg:col-span-1 text-center p-3 md:p-4 bg-yellow-50 rounded-lg">
              <Star className="h-5 w-5 md:h-6 md:w-6 text-yellow-600 mx-auto mb-2" />
              <div className="text-xl md:text-2xl font-bold text-yellow-900">{data.summary.averageHoursPerUser}h</div>
              <div className="text-xs md:text-sm text-yellow-600">Media Ore/Dipendente</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report dipendenti - Mobile Responsive */}
      <Card className="w-full">
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Users className="h-4 w-4 md:h-5 md:w-5" />
            Report Dipendenti - Settimana Corrente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            {data.userStats.map((employee, index) => (
              <div
                key={employee.user_id}
                className={`p-3 md:p-4 rounded-lg border transition-all ${
                  index === 0 && employee.totalHours > 0
                    ? "bg-yellow-50 border-yellow-200 shadow-md"
                    : employee.totalHours === 0
                      ? "bg-gray-50 border-gray-200"
                      : "bg-white border-gray-200 hover:shadow-sm"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="flex items-center gap-2">
                      {index === 0 && employee.totalHours > 0 && (
                        <Star className="h-3 w-3 md:h-4 md:w-4 text-yellow-500" />
                      )}
                      <span className="font-semibold text-base md:text-lg">{employee.name}</span>
                      {employee.isExempt && (
                        <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                          Esente pausa
                        </Badge>
                      )}
                      {index < 3 && employee.totalHours > 0 && (
                        <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                          #{index + 1}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1">
                            <div className="text-xl md:text-2xl font-bold text-blue-600">{employee.totalHours}h</div>
                            {!employee.isExempt && <Coffee className="h-3 w-3 md:h-4 md:w-4 text-amber-600" />}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {employee.isExempt ? (
                            <p>Ore totali (esente dalla pausa pranzo)</p>
                          ) : (
                            <p>Ore totali (già esclusa 1h di pausa nei giorni feriali per turni non Ircac)</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="text-xs md:text-sm text-gray-500">{employee.totalShifts} turni</div>
                  </div>
                </div>

                {/* Barra di progresso visuale */}
                {employee.totalHours > 0 && data.summary.totalHours > 0 && (
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((employee.totalHours / data.summary.totalHours) * 100 * 5, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {((employee.totalHours / data.summary.totalHours) * 100).toFixed(1)}% del totale settimanale
                    </div>
                  </div>
                )}

                {/* Dettaglio turni per tipo */}
                {Object.keys(employee.shiftsByType).length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(employee.shiftsByType).map(([typeName, typeData]) => (
                        <div key={typeName} className="text-center p-2 bg-white rounded border text-xs">
                          <div className="font-medium" style={{ color: typeData.color }}>
                            {typeName}
                          </div>
                          <div className="text-gray-600">
                            {typeData.count} • {typeData.hours.toFixed(1)}h
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Distribuzione per giorno con mappa visuale */}
                    <div>
                      <div className="text-xs md:text-sm font-medium text-gray-700 mb-2">
                        Distribuzione settimanale:
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {data.weekDays.map((day) => {
                          const dayData = employee.shiftsByDay[day.date]
                          const hasShifts = dayData && dayData.hours > 0
                          const isWeekday = new Date(day.date).getDay() >= 1 && new Date(day.date).getDay() <= 5

                          // Verifica se ci sono turni Ircac in questo giorno
                          const hasIrcacShift = hasShifts && dayData.shifts.some((shift) => shift.isIrcac)

                          return (
                            <div
                              key={day.date}
                              className={`text-center p-1 md:p-2 rounded text-xs ${
                                hasShifts ? "bg-blue-50 border border-blue-200" : "bg-gray-50"
                              }`}
                            >
                              <div className="font-medium text-gray-600 capitalize">{day.dayShort}</div>
                              <div className="text-gray-800 font-bold text-xs md:text-sm">
                                {hasShifts ? `${dayData.hours.toFixed(1)}h` : "-"}
                              </div>
                              {hasShifts && (
                                <div className="flex items-center justify-center gap-1">
                                  <div className="text-gray-500 text-xs">{dayData.count}</div>
                                  {isWeekday && !hasIrcacShift && !employee.isExempt && (
                                    <Coffee className="h-3 w-3 text-amber-600" />
                                  )}
                                  {hasIrcacShift && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="text-xs text-amber-600">IR</span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Turno Ircac: pausa 13-14 già inclusa nell'orario</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 italic text-xs md:text-sm">
                    Nessun turno questa settimana
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Nota informativa - Mobile Responsive */}
      <Card className="w-full">
        <CardContent className="p-3 md:p-4">
          <div className="text-xs md:text-sm text-gray-600 text-center">
            <p>
              📊 <strong>Nota:</strong> Le statistiche si aggiornano automaticamente ogni 5 minuti e mostrano solo i
              dati della settimana corrente.
            </p>
            <p className="mt-1">🔄 I dati si resettano automaticamente all'inizio di ogni nuova settimana (lunedì).</p>
            <p className="mt-1">
              <Coffee className="h-3 w-3 inline-block text-amber-600 mr-1" />
              <strong>Pausa pranzo:</strong> 1 ora di pausa è automaticamente esclusa dal conteggio nei giorni feriali
              per turni di almeno 5 ore (eccetto turni Ircac e utenti esenti).
            </p>
            <p className="mt-1">
              <span className="text-amber-600 font-bold mr-1">IR</span>
              <strong>Turni Ircac:</strong> Per i turni Ircac la pausa è già considerata nell'orario 13-14.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
