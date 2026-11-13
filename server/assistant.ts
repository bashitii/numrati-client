// server/assistant.ts
// ------------------------------------------------------------
// The Numrati assistant, Sanadak (Gemini, from Google AI Studio).
//
// It adds one route to the Vite dev server:  POST /api/chat
// The Gemini API key stays here on the server (read from .env),
// so it is never sent to the browser.
// ------------------------------------------------------------
import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { GoogleGenAI, ThinkingLevel } from '@google/genai'

// The same model we tested in AI Studio. Change it here if needed.
const MODEL = 'gemini-3.8-flash'
// Used in order when the main model is busy, out of quota, or not available to this key
const BACKUP_MODELS = ['gemini-flash-latest', 'gemini-flash-lite-latest']

// Simple limits so nobody can send huge requests
const MAX_MESSAGES = 30
const MAX_MESSAGE_LENGTH = 2000

// How many times to try a model when it is busy (waits 1s, then 2s between tries)
const MAX_ATTEMPTS = 3

const GOAL =
  'You are Sanadak (سندك), the Numrati assistant. Answer questions about buying and selling car plate numbers in Jordan ' +
  'on the Numrati platform, and DVLD procedures, using only the knowledge base below. ' +
  'Reply in the same language and dialect as the user.'

type ChatMessage = { role: 'user' | 'model'; text: string }

function loadKnowledge() {
  const file = path.resolve(process.cwd(), 'server/knowledge/numrati-knowledge.txt')
  return fs.readFileSync(file, 'utf-8')
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 100_000) reject(new Error('Request too large'))
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

// Keep only valid messages, and cut very long ones
function cleanMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((m) => m && (m.role === 'user' || m.role === 'model') && typeof m.text === 'string' && m.text.trim())
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, text: m.text.slice(0, MAX_MESSAGE_LENGTH) }))
}

type StreamRequest = Parameters<GoogleGenAI['models']['generateContentStream']>[0]

// Start the answer. A busy model (503) is tried again; if it stays busy, is out of
// quota (429) or is not available (404), the next model in the list takes over.
async function startAnswer(ai: GoogleGenAI, contents: StreamRequest['contents'], systemInstruction: string) {
  let lastError: unknown
  for (const model of [MODEL, ...BACKUP_MODELS]) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const stream = await ai.models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction,
            // Only the main model is known to support this setting
            ...(model === MODEL && { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }), // faster answers
          },
        })
        if (model !== MODEL) console.warn(`[assistant] answering with backup model ${model}`)
        return stream
      } catch (error) {
        lastError = error
        const status = (error as { status?: number }).status
        if (status !== 503 && status !== 429 && status !== 404) throw error
        console.warn(`[assistant] ${model} returned ${status}`)
        if (status !== 503 || attempt === MAX_ATTEMPTS) break
        await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (attempt - 1)))
      }
    }
  }
  throw lastError
}

export function assistantApi(apiKey: string | undefined): Plugin {
  const systemInstruction = GOAL + '\n\nKNOWLEDGE BASE:\n\n' + loadKnowledge()

  return {
    name: 'numrati-assistant',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end('Method not allowed')
        }
        if (!apiKey) {
          console.error('[assistant] Missing GEMINI_API_KEY in .env')
          res.statusCode = 500
          return res.end('Missing GEMINI_API_KEY in .env')
        }

        try {
          const messages = cleanMessages(JSON.parse(await readBody(req)).messages)
          if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
            res.statusCode = 400
            return res.end('No question')
          }

          const ai = new GoogleGenAI({ apiKey })
          const stream = await startAnswer(
            ai,
            messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
            systemInstruction,
          )

          // Send the answer to the browser piece by piece, as it is written
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          for await (const chunk of stream) {
            if (chunk.text) res.write(chunk.text)
          }
          res.end()
        } catch (error) {
          console.error('[assistant]', error)
          if (!res.headersSent) res.statusCode = 500
          res.end()
        }
      })
    },
  }
}
