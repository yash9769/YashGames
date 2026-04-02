import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabaseClient.js'

export default function ScribbleRoomCreate({ onBack }) {
  const navigate = useNavigate()
  const [roomCode, setRoomCode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [startingWord, setStartingWord] = useState(null)
  const [isChoosing, setIsChoosing] = useState(false)
  
  const generateRoomCode = () => Math.random().toString(36).substring(2, 6).toUpperCase()

  const WORDS = ['CAT', 'DOG', 'HOUSE', 'TREE', 'SUN', 'CAR', 'APPLE', 'MOON', 'ASTRONAUT', 'PENGUIN', 'GUITAR']

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    setIsChoosing(true)

    let code = generateRoomCode()
    let attempts = 0
    while (attempts < 5) {
      const { data } = await supabase.from('scribble_rooms').select('id').eq('room_code', code).maybeSingle()
      if (!data) break
      code = generateRoomCode()
      attempts++
    }

    const word = WORDS[Math.floor(Math.random() * WORDS.length)]

    setTimeout(async () => {
       setStartingWord(word)
       const { error: insertErr } = await supabase.from('scribble_rooms').insert({
          room_code: code,
          current_word: word,
          status: 'waiting',
          drawer: 'host'
       })

       setLoading(false)
       setIsChoosing(false)

       if (insertErr) {
          setError('Failed to create room.')
          return
       }

       setRoomCode(code)
    }, 1500)
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
        <h2 className="text-2xl font-bold text-white font-display">Create Scribble</h2>
      </div>

      <AnimatePresence mode="wait">
        {!isChoosing && !roomCode ? (
          <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="flex flex-col gap-6">
            <div className="glass-card p-6 border-[#F2BEAC]/20 border-l-4 border-l-[#F2BEAC]">
              <p className="text-white font-semibold text-lg mb-4 font-display">
                🎨 Draw and Guess
              </p>
              <p className="text-white/50 text-sm leading-relaxed font-body">
                We will give you a random word. Create the room, invite a friend, and start drawing so they can guess it!
              </p>
            </div>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="btn-primary w-full py-5 text-xl font-bold tracking-wide"
              style={{ background: 'linear-gradient(135deg, #F2BEAC 0%, #E89E84 100%)', boxShadow: '0 8px 32px -8px rgba(242, 190, 172, 0.5)' }}
            >
              Get Word & Create Room ✨
            </button>
            
            {error && <p className="text-accent-hot text-center text-sm">{error}</p>}
          </motion.div>
        ) : isChoosing ? (
           <motion.div key="choosing" className="flex flex-col flex-1 items-center justify-center -mt-10" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <motion.div animate={{rotate: 360}} transition={{repeat: Infinity, duration: 1, ease: 'linear'}} className="text-4xl mb-4">
                ✏️
              </motion.div>
              <p className="text-white/50 font-body animate-pulse">Picking a word...</p>
           </motion.div>
        ) : (
          <motion.div key="code" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-6">
            <div className="glass-card p-6 text-center border-[#E89E84]/30 border">
               <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest font-body mb-2">Your Secret Word</p>
               <div className="text-3xl font-display font-bold text-white tracking-wide">{startingWord}</div>
            </div>
            
            <div className="glass-card p-6 text-center mt-2">
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest font-body mb-2">Room Code</p>
              <div className="text-5xl font-mono font-bold tracking-widest text-[#F2BEAC] drop-shadow-glow mb-2">{roomCode}</div>
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
                  onClick={() => navigate(`/scribble/game/${roomCode}?role=host`)} 
                  className="btn-primary w-full py-4 shadow-glow"
                  style={{ background: 'linear-gradient(135deg, #F2BEAC 0%, #E89E84 100%)', boxShadow: '0 8px 32px -8px rgba(242, 190, 172, 0.5)' }}
               >
                 Enter Game Room →
               </button>
            </div>
            <p className="text-white/30 text-xs text-center">Wait for your opponent, then start drawing.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
