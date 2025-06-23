"use client"

import { useEffect } from "react"

/**
 * Intercetta i ChunkLoadError (mancato caricamento dei file /_next/static/chunks)
 * e ricarica la pagina in modo pulito. È un semplice “air-bag” di sicurezza.
 */
export default function ChunkLoadErrorHandler() {
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      if (event?.message && /Loading chunk \d+ failed/.test(event.message)) {
        // forza il refresh così Next lite rigenera gli asset mancanti
        window.location.reload()
      }
    }

    window.addEventListener("error", handler)
    return () => window.removeEventListener("error", handler)
  }, [])

  return null
}
