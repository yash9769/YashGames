// pages/Game.jsx
// Main game screen. Handles both Player A (host) and Player B (guesser) views.
// Uses Supabase realtime to sync state between both players.

import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient.js'
import GameBoard from '../components/GameBoard.jsx'

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -24, transition: { duration: 0.3 } },
}

export default function Game() {
  const { roomCode } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // role: 'host' (Player A) or 'guesser' (Player B)
  const role = searchParams.get('role') || 'guesser'

  const [room, setRoom] = useState(null)
  const [guesses, setGuesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch initial room + guesses data
  const fetchRoomData = useCallback(async () => {
    const { data: roomData, error: roomErr } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', roomCode.toUpperCase())
      .single()

    if (roomErr || !roomData) {
      setError('Room not found. Check the code and try again.')
      setLoading(false)
      return
    }

    setRoom(roomData)

    const { data: guessData } = await supabase
      .from('guesses')
      .select('*')
      .eq('room_id', roomData.id)
      .order('created_at', { ascending: true })

    setGuesses(guessData || [])
    setLoading(false)

    // If room already marked correct, redirect to victory
    if (roomData.status === 'complete') {
      navigate(`/victory/${roomCode}?role=${role}`, { replace: true })
    }
  }, [roomCode, role, navigate])

  useEffect(() => {
    fetchRoomData()
  }, [fetchRoomData])

  // Subscribe to realtime changes on the guesses table for this room
  useEffect(() => {
    if (!room) return

    const channel = supabase
      .channel(`room-${room.id}`)
      // Listen for new guesses
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'guesses',
        filter: `room_id=eq.${room.id}`,
      }, (payload) => {
        setGuesses(prev => [...prev, payload.new])
      })
      // Listen for guess updates (host responds with higher/lower/correct)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'guesses',
        filter: `room_id=eq.${room.id}`,
      }, (payload) => {
        setGuesses(prev =>
          prev.map(g => g.id === payload.new.id ? payload.new : g)
        )
        // If the response is 'correct', redirect both players to victory
        if (payload.new.response === 'correct') {
          setTimeout(() => {
            navigate(`/victory/${roomCode}?role=${role}`)
          }, 800)
        }
      })
      // Listen for room status changes
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${room.id}`,
      }, (payload) => {
        setRoom(payload.new)
        if (payload.new.status === 'complete') {
          setTimeout(() => {
            navigate(`/victory/${roomCode}?role=${role}`)
          }, 800)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room, roomCode, role, navigate])

  // Player B submits a guess
  const handleGuess = async (value) => {
    if (!room) return
    await supabase.from('guesses').insert({
      room_id: room.id,
      guess_value: Number(value),
      response: null,
    })
  }

  // Player A responds to a guess (higher / lower / correct)
  const handleRespond = async (guessId, response) => {
    await supabase
      .from('guesses')
      .update({ response })
      .eq('id', guessId)

    // If correct, mark the room as complete
    if (response === 'correct') {
      await supabase
        .from('rooms')
        .update({ status: 'complete' })
        .eq('id', room.id)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <motion.div
          className="text-accent text-4xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        >
          ◌
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh px-6 gap-6">
        <div className="text-5xl">😕</div>
        <p className="text-white/70 text-center text-lg">{error}</p>
        <button onClick={() => navigate('/')} className="btn-primary w-full max-w-xs">
          Go Home
        </button>
      </div>
    )
  }

  return (
    <motion.div
      className="flex flex-col min-h-dvh pt-safe relative z-10"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <GameBoard
        room={room}
        guesses={guesses}
        role={role}
        onGuess={handleGuess}
        onRespond={handleRespond}
      />
    </motion.div>
  )
}
