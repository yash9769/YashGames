// components/RoomCreate.jsx
// Player A enters a secret number, gets a room code, and waits for Player B to join.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabaseClient.js'

// Generate a random 4-character uppercase alphanumeric code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase()
}

export default function RoomCreate({ onBack }) {
  const navigate = useNavigate()
  const [secretNumber, setSecretNumber] = useState('')
  const [rangeMax, setRangeMax] = useState(100)
  const [timeLimit, setTimeLimit] = useState('')
  const [hint, setHint] = useState('')
  const [maxAttempts, setMaxAttempts] = useState('')
  const [roomCode, setRoomCode] = useState(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    const num = parseInt(secretNumber, 10)
    if (isNaN(num)) {
      setError('Enter a valid number')
      return
    }
    if (num < 1 || num > rangeMax) {
      setError(`Number must be between 1 and ${rangeMax}`)
      return
    }

    setLoading(true)
    setError('')

    // Keep generating codes until we get a unique one
    let code = generateRoomCode()
    let attempts = 0
    while (attempts < 5) {
      const { data } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_code', code)
        .maybeSingle()
      if (!data) break
      code = generateRoomCode()
      attempts++
    }

    const maxAtt = parseInt(maxAttempts, 10)
    const tLimit = parseInt(timeLimit, 10)

    const { error: insertErr } = await supabase.from('rooms').insert({
      room_code: code,
      secret_number: num,
      status: 'active',
      range_min: 1,
      range_max: rangeMax,
      hint: hint.trim() || null,
      max_attempts: isNaN(maxAtt) || maxAtt <= 0 ? null : maxAtt,
      time_limit_seconds: isNaN(tLimit) || tLimit <= 0 ? null : tLimit,
      round_number: 1,
      max_rounds: 3,
      host_score: 0,
      guesser_score: 0,
    })

    setLoading(false)

    if (insertErr) {
      setError('Failed to create room. Check your Supabase connection.')
      return
    }

    setRoomCode(code)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEnterGame = () => {
    navigate(`/game/${roomCode}?role=host`)
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
          Create Room
        </h2>
      </div>

      <AnimatePresence mode="wait">
        {!roomCode ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex flex-col gap-6"
          >
            <div className="glass-card p-6">
              <p className="text-white/60 text-sm mb-1">You are</p>
              <p className="text-white font-semibold text-lg mb-4" style={{ fontFamily: 'Space Grotesk' }}>
                🎯 Player A — The Host
              </p>
              <p className="text-white/50 text-sm leading-relaxed">
                Pick a secret number. Your friend will try to guess it — you'll guide them with Higher or Lower hints.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-white/60 text-sm font-medium px-1">
                Secret Number
              </label>
              <input
                type="number"
                className="num-input"
                placeholder="e.g. 42"
                value={secretNumber}
                onChange={e => {
                  setSecretNumber(e.target.value)
                  setError('')
                }}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
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

            <div className="flex flex-col gap-3">
              <label className="text-white/60 text-sm font-medium px-1 flex flex-col">
                Number Range
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 100, 1000].map(max => (
                  <button
                    key={max}
                    onClick={() => setRangeMax(max)}
                    className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                      rangeMax === max
                        ? 'bg-accent/20 border-accent text-accent'
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    1 - {max}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-white/60 text-sm font-medium px-1 flex flex-col">
                Starting Hint <span className="text-xs text-white/30 font-normal">Optional</span>
              </label>
              <input
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-accent transition-colors text-lg"
                placeholder="e.g. It's an even number"
                value={hint}
                onChange={e => setHint(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-white/60 text-sm font-medium px-1 flex flex-col">
                Max Attempts <span className="text-xs text-white/30 font-normal">Optional</span>
              </label>
               <input
                type="number"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-accent transition-colors text-lg"
                placeholder="e.g. 10 (leave blank for unlimited)"
                value={maxAttempts}
                onChange={e => setMaxAttempts(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-white/60 text-sm font-medium px-1 flex flex-col">
                Time Limit per Guess <span className="text-xs text-white/30 font-normal">Optional</span>
              </label>
               <input
                type="number"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-accent transition-colors text-lg"
                placeholder="e.g. 60 (seconds)"
                value={timeLimit}
                onChange={e => setTimeLimit(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>

            <button
              onClick={handleCreate}
              disabled={loading || !secretNumber}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating…' : 'Create Room ✨'}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="code"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-6"
          >
            {/* Success card */}
            <div className="glass-card p-7 text-center">
              <motion.div
                className="text-4xl mb-4"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                🎉
              </motion.div>
              <p className="text-white/50 text-sm mb-2">Share this code with your friend</p>
              <div className="room-code my-3">{roomCode}</div>
              <p className="text-white/30 text-xs">4-character room code</p>
            </div>

            {/* Copy button */}
            <button onClick={handleCopy} className="btn-ghost w-full">
              {copied ? '✓ Copied!' : '📋 Copy Code'}
            </button>

            {/* Enter game */}
            <button onClick={handleEnterGame} className="btn-primary w-full">
              Enter Game Room →
            </button>

            <p className="text-white/30 text-xs text-center">
              Wait for your friend to join, then start responding to guesses
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
