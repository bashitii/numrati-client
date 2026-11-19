#!/bin/bash
# Double-click this file to start Numrati: the API server (port 4000) and the website (port 5173).
cd "$(dirname "$0")"
CLIENT_DIR="$(pwd)"
SERVER_DIR="$CLIENT_DIR/../numrati-server"
# older copies used the Capstone2-server folder name
[ -d "$SERVER_DIR" ] || SERVER_DIR="$CLIENT_DIR/../Capstone2-server"

# 1) The server needs its Supabase settings
if [ ! -f "$SERVER_DIR/.env" ]; then
  echo "Missing $SERVER_DIR/.env. Copy .env.example to .env and fill it in (see the README)."
  read -r -p "Press Enter to close."
  exit 1
fi

# 2) Install packages the first time
[ -d node_modules ] || npm install
[ -d "$SERVER_DIR/node_modules" ] || (cd "$SERVER_DIR" && npm install)

# 3) Start the API in the background, stop it again when this window closes
(cd "$SERVER_DIR" && npm run dev) &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null' EXIT

echo ""
echo "Starting Numrati... keep this window open. Press Ctrl+C to stop."
# (runs Vite through node directly, which avoids macOS blocking the downloaded vite script)
node node_modules/vite/bin/vite.js --open /home
