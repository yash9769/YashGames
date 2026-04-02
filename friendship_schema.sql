-- ============================================================
-- YashGames: Friendship System & Social Infrastructure
-- Run this in your Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. PROFILES Table
-- Stores user identity and meta info (compatible with Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username    TEXT UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  xp          INT DEFAULT 0,
  level       INT DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. FRIENDS Table
-- Bidirectional friendship tracking
CREATE TABLE IF NOT EXISTS friends (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  friend_id   UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- 3. GAME_INVITATIONS Table
-- Direct play requests between friends
CREATE TABLE IF NOT EXISTS game_invitations (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id  UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  invitee_id  UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  game_type   TEXT NOT NULL CHECK (game_type IN ('mindmatch', 'atlas', 'scribble')),
  room_code   TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 4. UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_friends_updated_at ON friends;
CREATE TRIGGER update_friends_updated_at BEFORE UPDATE ON friends FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_game_invitations_updated_at ON game_invitations;
CREATE TRIGGER update_game_invitations_updated_at BEFORE UPDATE ON game_invitations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_invitations ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can see profiles, users can handle their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Friends: Only involved parties can see or modify
CREATE POLICY "Users can view their own friendships" ON friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can create friend requests" ON friends FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own friendships" ON friends FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can delete their own friendships" ON friends FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Invitations: Inviter/Invitee only
CREATE POLICY "Users can view their own invitations" ON game_invitations FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);
CREATE POLICY "Users can create invitations" ON game_invitations FOR INSERT WITH CHECK (auth.uid() = inviter_id);
CREATE POLICY "Users can respond to invitations" ON game_invitations FOR UPDATE USING (auth.uid() = invitee_id);

-- 6. REALTIME SUBSCRIPTIONS
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE friends;
ALTER PUBLICATION supabase_realtime ADD TABLE game_invitations;

-- ============================================================
-- Done! Social system tables ready.
-- ============================================================
