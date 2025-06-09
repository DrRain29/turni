import { NextResponse } from "next/server"

// Questo endpoint è solo per scopi dimostrativi
// In produzione, dovresti usare un database per memorizzare queste informazioni
export async function POST(request: Request) {
  try {
    const { username, email } = await request.json()

    if (!username || !email) {
      return NextResponse.json({ error: "Username e email sono obbligatori" }, { status: 400 })
    }

    // In un'applicazione reale, qui aggiorneresti un database
    // Per questa demo, restituiamo solo un successo
    return NextResponse.json({ success: true, message: "Mappatura aggiornata" })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Errore del server" }, { status: 500 })
  }
}
