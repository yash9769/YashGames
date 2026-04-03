import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabaseClient.js'

export default function AtlasRoomJoin({ onBack }) {
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

    const { data: room, error: fetchErr } = await supabase
      .from('atlas_rooms')
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

    // Update status to active as soon as the guesser joins
    if (room.status === 'waiting') {
       await supabase.from('atlas_rooms').update({ status: 'active' }).eq('id', room.id)
    }

    setLoading(false)
    navigate(`/atlas/game/${cleanCode}?role=guesser`)
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
        <h2 className="text-2xl font-bold text-white font-display">Join Atlas</h2>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="flex flex-col gap-6">
          <div className="glass-card p-6 border-accent-cool/20 border-l-4 border-l-green-400">
            <p className="text-white font-semibold text-lg mb-4 font-display">
              🌍 Player B — The Challenger
            </p>
            <p className="text-white/50 text-sm leading-relaxed font-body">
              Enter the 4-letter code from the Host to jump into the geography battle.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="relative">
              <input
                type="text"
                className="room-input w-full py-6 px-6 text-center text-4xl font-mono tracking-[0.5em] text-white placeholder:text-white/20 focus:border-green-400/50"
                placeholder="ABCD"
                maxLength={4}
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
              <div className="absolute inset-0 rounded-3xl ring-2 ring-green-400/20 blur-md -z-10 opacity-60" />
            </div>
            
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

            <button
              onClick={handleJoin}
              disabled={loading || code.trim().length !== 4}
              className="btn-primary w-full py-5 text-xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)', boxShadow: '0 8px 32px -8px rgba(74, 222, 128, 0.5)' }}
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-6 h-6 border-2 border-bg-dark/30 border-t-bg-dark rounded-full" />
              ) : (
                'Enter Arena ⚔️'
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
