// components/RoomJoin.jsx
// Player B enters a 4-character code to join the session.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabaseClient.js'

export default function RoomJoin({ onBack }) {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleJoin = async () => {
    const cleanCode = code.trim().toUpperCase()
    if (cleanCode.length !== 4) {
      setError('Code must be 4 characters')
      return
    }

    setLoading(true)
    setError('')

    // Fetch the room to verify it exists
    const { data: room, error: fetchErr } = await supabase
      .from('rooms')
      .select('id, status')
      .eq('room_code', cleanCode)
      .maybeSingle()

    if (fetchErr) {
      setLoading(false)
      setError('Connection error. Try again.')
      return
    }

    if (!room) {
      setLoading(false)
      setError("Room not found. Check the code.")
      return
    }

    // Success! Redirect as guesser
    setLoading(false)
    navigate(`/game/${cleanCode}?role=guesser`)
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

      <AnimatePresence mode="wait">
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="flex flex-col gap-6"
        >
          <div className="glass-card p-6 border-accent-cool/20 border-l-4 border-l-accent-cool">
            <p className="text-white font-semibold text-lg mb-4" style={{ fontFamily: 'Space Grotesk' }}>
              🔍 Player B — The Guesser
            </p>
            <p className="text-white/50 text-sm leading-relaxed">
              Enter the 4-letter code from your friend to join the session and start guessing.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-white/40 text-xs font-bold uppercase tracking-widest px-1">
              Room Code
            </label>
            <input
              type="text"
              className="room-input"
              placeholder="ABCD"
              maxLength={4}
              value={code}
              onChange={e => {
                setCode(e.target.value)
                setError('')
              }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            {error && (
              <motion.p
                className="text-accent-hot text-sm font-semibold px-1 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.p>
            )}
          </div>

          <button
            onClick={handleJoin}
            disabled={loading || code.trim().length !== 4}
            className="w-full bg-accent-cool hover:bg-accent-cool/90 active:bg-accent-cool/80 text-bg-dark font-bold py-4 rounded-2xl text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(67,232,216,0.3)] mt-4"
          >
            {loading ? 'Joining…' : 'Enter Session ⚔️'}
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
