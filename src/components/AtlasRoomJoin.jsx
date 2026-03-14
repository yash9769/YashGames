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

          <div className="flex flex-col gap-3">
            <label className="text-white/40 text-xs font-bold uppercase tracking-widest px-1 font-body">Room Code</label>
            <input
              type="text"
              className="w-full bg-white/[0.05] border border-white/10 focus:bg-white/[0.08] focus:border-green-400/50 rounded-2xl px-6 py-5 text-4xl text-center tracking-[0.3em] font-mono font-bold text-white uppercase placeholder:text-white/10 outline-none transition-all"
              placeholder="ABCD"
              maxLength={4}
              value={code}
              onChange={e => { setCode(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            {error && (
              <motion.p className="text-accent-hot text-sm font-semibold px-1 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {error}
              </motion.p>
            )}
          </div>

          <button
            onClick={handleJoin}
            disabled={loading || code.trim().length !== 4}
            className="w-full bg-green-400 hover:bg-green-300 active:bg-green-500 text-bg-dark font-bold font-display py-4 rounded-2xl text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:shadow-[0_0_30px_rgba(74,222,128,0.5)] mt-4"
          >
            {loading ? 'Joining…' : 'Enter Arena ⚔️'}
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
