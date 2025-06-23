"use client"

import { StatisticsPanel } from "@/components/statistics-panel"

export default function StatistichePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Report Dipendenti</h1>
          <p className="text-gray-600 mt-2">Statistiche complete delle ore lavorate nella settimana corrente</p>
        </div>

        <StatisticsPanel />
      </div>
    </main>
  )
}
