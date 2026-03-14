# 🧠 MindMatch — Multiplayer Guess The Number

A real-time multiplayer number-guessing game built for mobile (iOS Safari + Android Chrome).  
Two players. One secret number. Higher or Lower hints. First guess wins.

---

## Tech Stack

| Layer       | Tool                              |
|-------------|-----------------------------------|
| Frontend    | React 18 + Vite                   |
| Styling     | TailwindCSS v3                    |
| Animations  | Framer Motion                     |
| Backend/DB  | Supabase (Postgres + Realtime)    |
| Routing     | React Router v6                   |
| Confetti    | canvas-confetti                   |

---

## Project Structure

```
src/
├── components/
│   ├── GameBoard.jsx     # Core game layout (host + guesser views)
│   ├── GuessInput.jsx    # Number input for Player B
│   ├── GuessHistory.jsx  # Animated guess log
│   ├── RoomCreate.jsx    # Player A: pick number, generate code
│   └── RoomJoin.jsx      # Player B: enter code to join
├── pages/
│   ├── Home.jsx          # Landing screen
│   ├── Game.jsx          # Game screen (manages Supabase state)
│   └── Victory.jsx       # Win screen with confetti
└── lib/
    └── supabaseClient.js # Supabase init
```

---

## 1. Supabase Setup

### Step 1 — Create a project
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click **New Project**, give it a name, set a password, choose a region
3. Wait ~2 minutes for it to spin up

### Step 2 — Run the schema
1. In your Supabase dashboard, go to **SQL Editor → New Query**
2. Paste the contents of `supabase_schema.sql`
3. Click **Run**

This creates:
- `rooms` table — stores room codes + secret numbers
- `guesses` table — stores every guess + the host's response
- RLS policies (public access for the anonymous game)
- Realtime enabled on both tables

### Step 3 — Get your API credentials
1. Go to **Settings → API**
2. Copy your **Project URL** and **anon/public key**

---

## 2. Local Development

### Step 1 — Clone and install
```bash
git clone <your-repo>
cd guess-the-number
npm install
```

### Step 2 — Set up environment variables
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

### Step 3 — Run dev server
```bash
npm run dev
```

Open `http://localhost:5173` on two browser tabs (or devices on the same network) to test multiplayer.

**To test on a phone:**
```bash
npm run dev -- --host
```
Then open `http://YOUR_LOCAL_IP:5173` on your phone.

---

## 3. How to Play

1. **Player A (Host)** opens the app → taps **Create Room**
2. Enters a secret number (any integer) → taps **Create Room ✨**
3. A 4-character room code appears — share it with Player B
4. Player A taps **Enter Game Room** and waits

5. **Player B (Guesser)** opens the app → taps **Join Room**
6. Types the 4-character code → taps **Join Game 🎮**

7. Player B types guesses and submits
8. Player A sees each guess and taps **Higher**, **Lower**, or **Correct**
9. Both players see the guess history update in real time
10. When Player B guesses correctly → 🎉 Victory screen for both!

---

## 4. Deploy to Vercel

### Option A — Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
```

Follow the prompts. When asked about environment variables, add:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Option B — Vercel Dashboard
1. Push your code to GitHub
2. Go to [https://vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Under **Environment Variables**, add both `VITE_SUPABASE_*` keys
5. Click **Deploy**

Vercel auto-detects Vite and sets the build command to `npm run build` with output `dist/`.

### Add a vercel.json (for SPA routing)
Create `vercel.json` in the project root:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
This ensures React Router works correctly on page refresh.

---

## 5. Environment Variables Reference

| Variable               | Description                        | Where to find                         |
|------------------------|------------------------------------|---------------------------------------|
| `VITE_SUPABASE_URL`    | Your Supabase project URL          | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key               | Supabase → Settings → API → anon key |

> ⚠️ Never use the `service_role` key in a frontend app. The `anon` key is safe to expose.

---

## 6. Mobile Tips

- **iOS Safari**: Works natively. Add to Home Screen for full-screen app feel.
- **Android Chrome**: Works natively. Supports PWA install from browser menu.
- **Input zoom fix**: Already applied — `font-size: 16px` on inputs prevents iOS auto-zoom.
- **Safe area**: `env(safe-area-inset-*)` applied for notch/Dynamic Island support.

---

## 7. Extending the Game

Ideas to build on top of this:

- **Number range selector** — let host pick range (1–100, 1–1000, etc.)
- **Timer mode** — Player B has 60 seconds to guess
- **Score tracking** — track fewest guesses across multiple rounds
- **Binary search hint** — show optimal guess range narrowing
- **Push notifications** — notify Player A when a guess arrives (Web Push API)
- **Auth** — Supabase Auth so players have profiles and history

---

## License

MIT — build whatever you want with it.
