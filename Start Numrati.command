#!/bin/bash
# Double-click this file to start Numrati: the API server (port 4000) and the website (port 5173).
cd "$(dirname "$0")"
CLIENT_DIR="$(pwd)"
SERVER_DIR="$CLIENT_DIR/../Capstone2-server"

# 1) The server needs its Supabase settings
if [ ! -f "$SERVER_DIR/.env" ]; then
  echo "Missing Capstone2-server/.env. Copy .env.example to .env and fill it in (see the README)."
  read -r -p "Press Enter to close."
  exit 1
fi

# 2) Gemini key for the Sanadak assistant (optional, asked once, stays on this Mac)
if ! grep -q "^GEMINI_API_KEY=..*" .env 2>/dev/null; then
  echo ""
  echo "Paste your Gemini API key for the assistant (or just press Enter to skip):"
  read -r KEY
  [ -n "$KEY" ] && echo "GEMINI_API_KEY=$KEY" >> .env
fi

# 3) Install packages the first time
[ -d node_modules ] || npm install
[ -d "$SERVER_DIR/node_modules" ] || (cd "$SERVER_DIR" && npm install)

# 4) Start the API in the background, stop it again when this window closes
(cd "$SERVER_DIR" && npm run dev) &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null' EXIT

echo ""
echo "Starting Numrati... keep this window open. Press Ctrl+C to stop."
# (runs Vite through node directly, which avoids macOS blocking the downloaded vite script)
node node_modules/vite/bin/vite.js --open /home
