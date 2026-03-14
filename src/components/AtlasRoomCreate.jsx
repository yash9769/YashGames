import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabaseClient.js'
import DiceRoll from './DiceRoll.jsx'

export default function AtlasRoomCreate({ onBack }) {
  const navigate = useNavigate()
  const [roomCode, setRoomCode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [diceResult, setDiceResult] = useState(null)
  const [isRolling, setIsRolling] = useState(false)
  
  const generateRoomCode = () => Math.random().toString(36).substring(2, 6).toUpperCase()

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    setIsRolling(true)

    // Keep generating codes until we get a unique one
    let code = generateRoomCode()
    let attempts = 0
    while (attempts < 5) {
      const { data } = await supabase.from('atlas_rooms').select('id').eq('room_code', code).maybeSingle()
      if (!data) break
      code = generateRoomCode()
      attempts++
    }

    const letters = ['A', 'T', 'L', 'A', 'S']
    const result = letters[Math.floor(Math.random() * letters.length)]

    setTimeout(async () => {
       setDiceResult(result)
       const { error: insertErr } = await supabase.from('atlas_rooms').insert({
          room_code: code,
          starting_letter: result,
          status: 'waiting',
          current_turn: 'host'
       })

       setLoading(false)
       setIsRolling(false)

       if (insertErr) {
          setError('Failed to create room.')
          return
       }

       setRoomCode(code)
    }, 2000) // fake roll duration
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
        <h2 className="text-2xl font-bold text-white font-display">Create Atlas</h2>
      </div>

      <AnimatePresence mode="wait">
        {!isRolling && !roomCode ? (
          <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="flex flex-col gap-6">
            <div className="glass-card p-6 border-accent/20 border-l-4 border-l-accent">
              <p className="text-white font-semibold text-lg mb-4 font-display">
                🎲 Roll for the first letter
              </p>
              <p className="text-white/50 text-sm leading-relaxed font-body">
                The dice will land on A, T, L, A, or S. This determines the letter you MUST start with!
              </p>
            </div>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="btn-primary w-full py-5 text-xl font-bold tracking-wide"
            >
              Roll Dice & Create Room ✨
            </button>
            
            {error && <p className="text-accent-hot text-center text-sm">{error}</p>}
          </motion.div>
        ) : isRolling ? (
           <motion.div key="rolling" className="flex flex-col flex-1 items-center justify-center -mt-10" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <DiceRoll isRolling={true} result={null} />
           </motion.div>
        ) : (
          <motion.div key="code" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-6">
            <DiceRoll isRolling={false} result={diceResult} />
            
            <div className="glass-card p-6 text-center mt-4">
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest font-body mb-2">Room Code</p>
              <div className="text-5xl font-mono font-bold tracking-widest text-white drop-shadow-glow mb-2">{roomCode}</div>
              <p className="text-white/30 text-xs">Share this with your opponent</p>
            </div>

            <div className="mt-4 flex flex-col gap-3">
               <button 
                 onClick={() => navigator.clipboard.writeText(roomCode)} 
                 className="btn-ghost w-full py-4 text-white/70"
               >
                 📋 Copy Code
               </button>
               <button 
                  onClick={() => navigate(`/atlas/game/${roomCode}?role=host`)} 
                  className="btn-primary w-full py-4 shadow-glow"
               >
                 Enter Game Room →
               </button>
            </div>
            <p className="text-white/30 text-xs text-center">Wait for your opponent, then make the first move.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
