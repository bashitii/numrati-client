# Numrati: website (client)

React + TypeScript + Vite + Tailwind CSS. The site is bilingual (Arabic RTL and English) and talks only to the Numrati API (`../Capstone2-server`). It never connects to Supabase directly.

## Run it

Double-click **`Start Numrati.command`**. It starts the API and the website together and opens http://localhost:5173.

Or by hand, in two terminals:

```bash
cd ../Capstone2-server && npm run dev
```
```bash
npm install && npm run dev
```

## Structure

```
src/
  main.tsx            app entry: router, login state, favorites
  App.tsx             all routes (account/seller pages need login, /admin/* needs an admin)
  services/http.ts    fetch wrapper: adds the login token, renews it when it expires
  services/api.ts     one function per API call. Every page gets its data from here
  store/auth.tsx      signed-in user, login/register/logout, route guards
  store/favorites.tsx saved plates (kept on the server)
  pages/              screens: Auth, Browse, PlateDetails, Account, Seller, Estimate, Admin, Assistant
  components/         shared UI (buttons, fields, plate artwork, cards, layout)
  i18n/               Arabic and English text
server/assistant.ts   "Sanadak" AI assistant (Gemini), served by the Vite dev server at /api/chat
```

## Settings

`.env.example` lists the optional settings: `GEMINI_API_KEY` for the assistant, and `VITE_API_URL` when the API is hosted somewhere other than `localhost:4000`.

## Build

```bash
npm run build   # type-checks, then writes the static site to dist/
```
