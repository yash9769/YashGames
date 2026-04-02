-- ============================================================
-- MindMatch: Friends & Invitations Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable the uuid extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. FRIENDS table
CREATE TABLE IF NOT EXISTS friends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Indexes for faster friend lookups
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);

-- 3. GAME_INVITATIONS table
CREATE TABLE IF NOT EXISTS game_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('guess_the_number', 'atlas', 'scribble')),
  room_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Indexes for faster invitation lookups
CREATE INDEX IF NOT EXISTS idx_game_invitations_inviter_id ON game_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_game_invitations_invitee_id ON game_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_game_invitations_status ON game_invitations(status);
CREATE INDEX IF NOT EXISTS idx_game_invitations_expires_at ON game_invitations(expires_at);

-- 4. Update existing game tables to reference user profiles
-- Add user_id columns to track which user created/joined each game

-- For rooms table (Guess The Number)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES auth.users(id);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS guester_id UUID REFERENCES auth.users(id);

-- For atlas_rooms table
ALTER TABLE atlas_rooms ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES auth.users(id);
ALTER TABLE atlas_rooms ADD COLUMN IF NOT EXISTS guester_id UUID REFERENCES auth.users(id);

-- For scribble_rooms table
ALTER TABLE scribble_rooms ADD COLUMN IF NOT EXISTS host_id UUID REFERENCES auth.users(id);
ALTER TABLE scribble_rooms ADD COLUMN IF NOT EXISTS guester_id UUID REFERENCES auth.users(id);

-- 5. ROW LEVEL SECURITY (RLS)
-- Enable RLS on new tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_invitations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Public profiles view'
    ) THEN
        CREATE POLICY "Public profiles view" ON profiles FOR SELECT USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Friends policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'friends' AND policyname = 'Users can view own friends'
    ) THEN
        CREATE POLICY "Users can view own friends" ON friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'friends' AND policyname = 'Users can manage own friend requests'
    ) THEN
        CREATE POLICY "Users can manage own friend requests" ON friends FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Game invitations policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'game_invitations' AND policyname = 'Users can view own invitations'
    ) THEN
        CREATE POLICY "Users can view own invitations" ON game_invitations FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'game_invitations' AND policyname = 'Users can send invitations'
    ) THEN
        CREATE POLICY "Users can send invitations" ON game_invitations FOR INSERT WITH CHECK (auth.uid() = inviter_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'game_invitations' AND policyname = 'Users can respond to own invitations'
    ) THEN
        CREATE POLICY "Users can respond to own invitations" ON game_invitations FOR UPDATE USING (auth.uid() = invitee_id);
    END IF;
END $$;

-- 6. REALTIME
-- Enable realtime publications for new tables
DO $$
BEGIN
   IF NOT EXISTS (
       SELECT 1 
       FROM pg_publication_tables 
       WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
   ) THEN
       ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
   END IF;
END $$;

DO $$
BEGIN
   IF NOT EXISTS (
       SELECT 1 
       FROM pg_publication_tables 
       WHERE pubname = 'supabase_realtime' AND tablename = 'friends'
   ) THEN
       ALTER PUBLICATION supabase_realtime ADD TABLE friends;
   END IF;
END $$;

DO $$
BEGIN
   IF NOT EXISTS (
       SELECT 1 
       FROM pg_publication_tables 
       WHERE pubname = 'supabase_realtime' AND tablename = 'game_invitations'
   ) THEN
       ALTER PUBLICATION supabase_realtime ADD TABLE game_invitations;
   END IF;
END $$;

-- ============================================================
-- Done! Friends & Invitations tables are ready.
-- ============================================================