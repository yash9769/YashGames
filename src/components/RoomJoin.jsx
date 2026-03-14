// components/RoomJoin.jsx
// Player B enters a room code to join an existing game.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient.js'

export default function RoomJoin({ onBack }) {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length < 4) {
      setError('Room codes are 4 characters')
      return
    }

    setLoading(true)
    setError('')

    const { data, error: fetchErr } = await supabase
      .from('rooms')
      .select('id, status')
      .eq('room_code', trimmed)
      .maybeSingle()

    setLoading(false)

    if (fetchErr || !data) {
      setError('Room not found. Double-check the code.')
      return
    }

    if (data.status === 'complete') {
      setError('This game is already over!')
      return
    }

    navigate(`/game/${trimmed}?role=guesser`)
  }

  return (
    <div className="flex flex-col flex-1 px-1 py-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-2xl bg-white/[0.08] flex items-center justify-center text-white/60 active:scale-90 transition-transform"
        >
          ←
        </button>
        <h2
          className="text-2xl font-bold text-white"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          Join Room
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6"
      >
        {/* Info card */}
        <div className="glass-card p-6">
          <p className="text-white/60 text-sm mb-1">You are</p>
          <p className="text-white font-semibold text-lg mb-4" style={{ fontFamily: 'Space Grotesk' }}>
            🔍 Player B — The Guesser
          </p>
          <p className="text-white/50 text-sm leading-relaxed">
            Get the room code from your friend. Make guesses and follow their Higher / Lower hints to find the number.
          </p>
        </div>

        {/* Code input */}
        <div className="flex flex-col gap-3">
          <label className="text-white/60 text-sm font-medium px-1">
            Room Code
          </label>
          <input
            type="text"
            className="num-input uppercase tracking-[0.3em]"
            placeholder="ABCD"
            value={code}
            maxLength={6}
            onChange={e => {
              setCode(e.target.value.toUpperCase())
              setError('')
            }}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {error && (
            <motion.p
              className="text-accent-hot text-sm px-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.p>
          )}
        </div>

        <button
          onClick={handleJoin}
          disabled={loading || code.trim().length < 4}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Finding room…' : 'Join Game 🎮'}
        </button>
      </motion.div>
    </div>
  )
}
