// Talks to Sanadak through our Express API (POST /api/chat).
// The API passes the question to the Sanadak agent in Google Cloud and sends back its answer.

export type AssistantMessage = { role: 'user' | 'model'; text: string }

const BASE = import.meta.env.VITE_API_URL ?? '/api'

// One id per conversation, so the agent remembers what was said before.
// A new id is made when the chat starts again (only one user message so far).
let sessionId = crypto.randomUUID()

export async function askAssistant(messages: AssistantMessage[], onText: (text: string) => void): Promise<string> {
  if (messages.filter((m) => m.role === 'user').length === 1) sessionId = crypto.randomUUID()

  const response = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, messages }),
  })
  if (!response.ok) throw new Error(`Assistant error ${response.status}`)

  const text = await response.text()
  if (!text.trim()) throw new Error('Empty answer')
  onText(text)
  return text
}
