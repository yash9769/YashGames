import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient.js'

export default function ScribbleResult() {
  const { roomCode } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const role = searchParams.get('role') || 'guesser'
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchResult() {
      const { data } = await supabase
        .from('scribble_rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .single()
        
      setRoom(data)
      setLoading(false)
    }
    fetchResult()
  }, [roomCode])

  if (loading) return <div className="min-h-dvh flex items-center justify-center text-[#F2BEAC]"><motion.div animate={{rotate:360}} transition={{repeat:Infinity, duration:1}}>◌</motion.div></div>
  if (!room) return <div className="min-h-dvh flex items-center justify-center text-accent-hot">Room not found</div>

  const isTimeUp = room.winner === 'time_up'
  const isWinner = room.winner === role
  const isDrawer = role === room.drawer

  let title = "Game Over"
  let subtitle = ""

  if (isTimeUp) {
    title = "Time's Up!"
    subtitle = "Nobody guessed the word."
  } else if (isDrawer) {
     title = "They Got It! 🎉"
     subtitle = "Great drawing!"
  } else {
     if (isWinner) {
        title = "You Guessed It! 🏆"
        subtitle = "Amazing deduction skills!"
     } else {
        title = "Someone Else Got It!"
        subtitle = "Too slow!"
     }
  }

  return (
    <div className="flex flex-col min-h-dvh pt-safe pb-safe px-5 relative z-10">
      <div className="flex flex-col flex-1 items-center justify-center gap-8 w-full max-w-sm mx-auto">
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="text-center"
        >
          <div className="text-6xl mb-6">
            {isTimeUp ? '⏰' : isWinner || isDrawer ? '🌟' : '👏'}
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            {title}
          </h1>
          <p className="text-white/60 font-body text-lg">
            {subtitle}
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full glass-card p-8 text-center border-[#F2BEAC]/30 border"
        >
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest font-body mb-2">The Word Was</p>
          <div className="text-4xl font-display font-bold text-[#F2BEAC] tracking-[0.2em] mb-4">
            {room.current_word}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full flex flex-col gap-4 mt-8"
        >
          <button
            onClick={() => navigate('/')}
            className="btn-primary w-full py-5 text-xl font-bold shadow-glow"
            style={{ background: 'linear-gradient(135deg, #F2BEAC 0%, #E89E84 100%)', boxShadow: '0 8px 32px -8px rgba(242, 190, 172, 0.5)' }}
          >
            ← Back to Hub
          </button>
        </motion.div>
      </div>
    </div>
  )
}
