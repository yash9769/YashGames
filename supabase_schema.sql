-- ============================================================
-- MindMatch: Guess The Number — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. ROOMS table
-- Stores each game session with the secret number and status.
CREATE TABLE IF NOT EXISTS rooms (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code   TEXT NOT NULL UNIQUE,          -- 4-char code shared between players
  secret_number INT NOT NULL,                -- The number Player A chose
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'complete')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for fast room_code lookups (used on every join/connect)
CREATE INDEX IF NOT EXISTS idx_rooms_room_code ON rooms(room_code);

-- ============================================================

-- 2. GUESSES table
-- Stores every guess Player B makes, and the host's response.
CREATE TABLE IF NOT EXISTS guesses (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  guess_value INT NOT NULL,
  response    TEXT CHECK (response IN ('higher', 'lower', 'correct')),  -- NULL until host responds
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for fetching all guesses in a room (used on load + realtime filter)
CREATE INDEX IF NOT EXISTS idx_guesses_room_id ON guesses(room_id);

-- ============================================================

-- 3. ROW LEVEL SECURITY (RLS)
-- Enable RLS — then grant full anon access.
-- In production you'd tighten this with auth-based policies.
ALTER TABLE rooms  ENABLE ROW LEVEL SECURITY;
ALTER TABLE guesses ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads and writes (required for the public game to work)
CREATE POLICY "Public rooms access"  ON rooms  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public guesses access" ON guesses FOR ALL USING (true) WITH CHECK (true);

-- ============================================================

-- 4. REALTIME
-- Enable realtime publications for both tables so Supabase broadcasts changes.
-- (Tables are added to the realtime publication by default in new projects,
--  but run this to be sure.)
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE guesses;

-- ============================================================
-- Done! Your tables are ready.
-- ============================================================
