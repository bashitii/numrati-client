// Talks to the Numrati assistant on our own server (/api/chat).
// The answer arrives in pieces; onText is called with the full text so far.

export type AssistantMessage = { role: 'user' | 'model'; text: string }

export async function askAssistant(messages: AssistantMessage[], onText: (text: string) => void): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })
  if (!response.ok || !response.body) throw new Error(`Assistant error ${response.status}`)

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let text = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    text += decoder.decode(value, { stream: true })
    onText(text)
  }
  if (!text.trim()) throw new Error('Empty answer')
  return text
}
