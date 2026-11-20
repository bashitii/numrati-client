// Talks to Sanadak through our Express API.
// The API asks Gemini in Google Cloud (Vertex AI), which searches the Numrati knowledge base,
// and sends the answer back in pieces while it is being written.
// For signed-in users the API also saves the chat, so it shows up in their history.
import { freshToken, http } from './http'

export type AssistantMessage = { role: 'user' | 'model'; text: string }

export interface SavedChat {
  id: string
  title: string
  updatedAt: string
  questions: number
}

const BASE = import.meta.env.VITE_API_URL ?? '/api'

/**
 * Ask Sanadak. history is the chat so far; onText is called with the answer so far each time a piece arrives.
 * Resolves to the full answer.
 */
export async function askAssistant(
  chatId: string,
  question: string,
  history: AssistantMessage[],
  onText: (text: string) => void,
) {
  const token = await freshToken()
  const response = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({
      sessionId: chatId,
      question,
      // Only the last messages are sent, shortened, so the request stays small
      history: history.slice(-12).map((m) => ({ role: m.role, text: m.text.slice(0, 4000) })),
    }),
  })
  if (!response.ok || !response.body) throw new Error(`Assistant error ${response.status}`)

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let text = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    text += decoder.decode(value, { stream: true })
    onText(text.trimStart())
  }
  if (!text.trim()) throw new Error('Empty answer')
  return text.trim()
}

export const getChatHistory = async () => (await http.get<{ items: SavedChat[] }>('/chat/history')).items

export const getSavedChat = (chatId: string) =>
  http.get<{ id: string; title: string; messages: AssistantMessage[] }>(`/chat/history/${chatId}`)

export const deleteSavedChat = (chatId: string) => http.delete(`/chat/history/${chatId}`)
