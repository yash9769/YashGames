-- ============================================================
-- Scribble Game Schema
-- Run this in your Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. scribble_rooms table
CREATE TABLE IF NOT EXISTS scribble_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','active','complete')),
  current_word TEXT,
  drawer TEXT NOT NULL DEFAULT 'host', -- 'host' or 'guesser', who is currently drawing.
  winner TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scribble_rooms_code ON scribble_rooms(room_code);

-- 2. scribble_chat table (for guesses)
CREATE TABLE IF NOT EXISTS scribble_chat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES scribble_rooms(id) ON DELETE CASCADE,
  player TEXT NOT NULL,
  message TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scribble_chat_room ON scribble_chat(room_id);

-- 3. RLS
ALTER TABLE scribble_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE scribble_chat ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'scribble_rooms' AND policyname = 'Public scribble rooms access'
    ) THEN
        CREATE POLICY "Public scribble rooms access" ON scribble_rooms FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'scribble_chat' AND policyname = 'Public scribble chat access'
    ) THEN
        CREATE POLICY "Public scribble chat access" ON scribble_chat FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 4. REALTIME PUBLICATION
DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'scribble_rooms'
  ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE scribble_rooms;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'scribble_chat'
  ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE scribble_chat;
  END IF;
END $$;

-- ============================================================
-- Done! Scribble game tables ready.
-- ============================================================
