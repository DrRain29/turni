"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Users, Clock, TrendingUp, Star } from "lucide-react"

interface UserStats {
  user_id: string
  name: string
  email: string
  totalHours: number
  totalShifts: number
  shiftsByType: Record<string, { count: number; hours: number; color: string }>
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
  summary: StatsSummary
}

export function StatisticsPanel() {
  const [data, setData] = useState<StatisticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    try {
      const response = await fetch("/api/statistics")
      if (response.ok) {
        const statsData = await response.json()
        setData(statsData)
      } else {
        setError("Errore nel caricamento delle statistiche")
      }
    } catch (error) {
      setError("Errore di connessione")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
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
          <div className="text-center text-red-600">
            <p>{error || "Errore nel caricamento"}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Riepilogo generale */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statistiche Generali
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">{data.summary.totalHours}h</div>
              <div className="text-sm text-blue-600">Ore Totali</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">{data.summary.totalShifts}</div>
              <div className="text-sm text-green-600">Turni Totali</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900">{data.summary.activeUsers}</div>
              <div className="text-sm text-purple-600">Dipendenti Attivi</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Users className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-900">{data.summary.totalUsers}</div>
              <div className="text-sm text-orange-600">Totale Dipendenti</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-900">{data.summary.averageHoursPerUser}h</div>
              <div className="text-sm text-yellow-600">Media Ore/Dipendente</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiche per dipendente */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ore per Dipendente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.userStats.map((user, index) => (
              <div
                key={user.user_id}
                className={`p-4 rounded-lg border transition-all ${
                  index === 0 && user.totalHours > 0
                    ? "bg-yellow-50 border-yellow-200 shadow-md"
                    : user.totalHours === 0
                      ? "bg-gray-50 border-gray-200"
                      : "bg-white border-gray-200 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {index === 0 && user.totalHours > 0 && <Star className="h-4 w-4 text-yellow-500" />}
                      <span className="font-semibold text-lg">{user.name}</span>
                      {index < 3 && user.totalHours > 0 && (
                        <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                          #{index + 1}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{user.totalHours}h</div>
                    <div className="text-sm text-gray-500">{user.totalShifts} turni</div>
                  </div>
                </div>

                {/* Barra di progresso visuale */}
                {user.totalHours > 0 && (
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((user.totalHours / data.summary.totalHours) * 100 * 5, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {((user.totalHours / data.summary.totalHours) * 100).toFixed(1)}% del totale
                    </div>
                  </div>
                )}

                {/* Dettaglio turni per tipo */}
                {Object.keys(user.shiftsByType).length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(user.shiftsByType).map(([typeName, typeData]) => (
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
                ) : (
                  <div className="text-center text-gray-500 italic text-sm">Nessun turno assegnato</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
