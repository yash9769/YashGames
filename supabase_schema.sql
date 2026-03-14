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
  
  -- Settings
  range_min   INT DEFAULT 1,
  range_max   INT DEFAULT 100,
  max_attempts INT,                                  -- Optional life limit
  time_limit_seconds INT,                            -- Optional timer
  hint        TEXT,                                  -- Optional starting hint
  
  -- Match State
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'complete', 'failed')),
  round_number INT DEFAULT 1,
  max_rounds  INT DEFAULT 3,
  
  -- Scores
  host_score  INT DEFAULT 0,
  guesser_score INT DEFAULT 0,
  
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
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'rooms' AND policyname = 'Public rooms access'
    ) THEN
        CREATE POLICY "Public rooms access" ON rooms FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'guesses' AND policyname = 'Public guesses access'
    ) THEN
        CREATE POLICY "Public guesses access" ON guesses FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ============================================================

-- 4. REALTIME
-- Enable realtime publications for both tables so Supabase broadcasts changes.
-- (Tables are added to the realtime publication by default in new projects,
--  but run this to be sure.)
DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'rooms'
  ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'guesses'
  ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE guesses;
  END IF;
END $$;

-- ============================================================
-- Done! MindMatch tables are ready.
-- ============================================================

-- ============================================================
-- ATLAS GAME SCHEMA
-- ============================================================

-- Atlas game rooms
CREATE TABLE IF NOT EXISTS atlas_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  starting_letter TEXT NOT NULL,         -- result of dice roll (A/T/L/S)
  current_turn TEXT NOT NULL DEFAULT 'host',  -- 'host' or 'guesser'
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','active','complete')),
  winner TEXT,                           -- 'host' or 'guesser'
  loss_reason TEXT,                      -- 'timeout' | 'repeat' | 'invalid' | 'challenged'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Each place named during the Atlas game
CREATE TABLE IF NOT EXISTS atlas_turns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES atlas_rooms(id) ON DELETE CASCADE,
  player TEXT NOT NULL,                  -- 'host' or 'guesser'
  place_name TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT NULL,         -- null = validating, true/false after API check
  turn_number INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_atlas_rooms_code ON atlas_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_atlas_turns_room ON atlas_turns(room_id);

ALTER TABLE atlas_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE atlas_turns ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'atlas_rooms' AND policyname = 'Public atlas rooms access'
    ) THEN
        CREATE POLICY "Public atlas rooms access" ON atlas_rooms FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'atlas_turns' AND policyname = 'Public atlas turns access'
    ) THEN
        CREATE POLICY "Public atlas turns access" ON atlas_turns FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'atlas_rooms'
  ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE atlas_rooms;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'atlas_turns'
  ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE atlas_turns;
  END IF;
END $$;