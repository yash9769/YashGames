import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabaseClient.js'

export default function ScribbleRoomJoin({ onBack }) {
  const navigate = useNavigate()
  const [roomCode, setRoomCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleJoin = async (e) => {
    e.preventDefault()
    
    const code = roomCode.trim().toUpperCase()
    if (code.length !== 4) {
      setError('Room code must be 4 characters')
      return
    }

    setLoading(true)
    setError('')

    const { data: room, error: fetchErr } = await supabase
      .from('scribble_rooms')
      .select('id, status')
      .eq('room_code', code)
      .maybeSingle()

    if (fetchErr || !room) {
      setError('Room not found')
      setLoading(false)
      return
    }

    if (room.status === 'complete') {
      setError('This game is already over')
      setLoading(false)
      return
    }

    // Role is automatically 'guesser' for joined players in scribble
    navigate(`/scribble/game/${code}?role=guesser`)
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
        <h2 className="text-2xl font-bold text-white font-display">Join Scribble</h2>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key="join-form"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          className="flex flex-col gap-6"
        >
          <div className="glass-card p-6 border-[#BEACF2]/20 border-l-4 border-l-[#BEACF2]">
            <p className="text-white font-semibold text-lg mb-2 font-display">
              Have a code?
            </p>
            <p className="text-white/50 text-sm leading-relaxed font-body">
              Enter the 4-letter room code from your friend to join the canvas and start guessing.
            </p>
          </div>

          <form onSubmit={handleJoin} className="flex flex-col gap-6">
            <div className="relative">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase())
                  setError('')
                }}
                maxLength={4}
                placeholder="ABCD"
                className="room-input w-full py-6 px-6 text-center text-4xl font-mono tracking-[0.5em] text-white placeholder:text-white/20 focus:border-[#BEACF2]/50"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
              <div className="absolute inset-0 rounded-3xl ring-2 ring-[#BEACF2]/20 blur-md -z-10 opacity-60" />
            </div>

            <button
              type="submit"
              disabled={loading || roomCode.length !== 4}
              className="w-full py-5 text-xl font-bold flex items-center justify-center gap-3 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #BEACF2 0%, #9F8CEB 100%)', boxShadow: '0 8px 32px -8px rgba(190, 172, 242, 0.5)' }}
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                'Enter Game ✍️'
              )}
            </button>
            
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-accent-hot text-center text-sm font-medium bg-accent-hot/10 py-3 rounded-2xl"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
