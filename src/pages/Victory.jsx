// pages/Victory.jsx
// Celebration screen shown to both players when the number is guessed correctly.

import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { supabase } from '../lib/supabaseClient.js'

export default function Victory() {
  const { roomCode } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const role = searchParams.get('role') || 'guesser'
  const fired = useRef(false)
  const [rematchRequested, setRematchRequested] = useState(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true

    // Fire confetti burst
    const duration = 3000
    const end = Date.now() + duration

    const colors = ['#6c63ff', '#ff6584', '#43e8d8', '#fff', '#ffd700'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    })()
  }, [])

  // Listen for rematch events (when room status goes back to 'active')
  useEffect(() => {
    if (!roomCode) return

    const fetchRoomIdAndListen = async () => {
      const { data: roomData } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_code', roomCode.toUpperCase())
        .single()

      if (!roomData) return

      const channel = supabase
        .channel(`rematch-${roomData.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomData.id}`,
        }, (payload) => {
          if (payload.new.status === 'active') {
             // Host restarted the game, jump both players back but switch roles!
             const newRole = role === 'host' ? 'guesser' : 'host'
             navigate(`/game/${roomCode.toUpperCase()}?role=${newRole}`, { replace: true })
          }
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    fetchRoomIdAndListen()
  }, [roomCode, role, navigate])

  const handleRematch = async () => {
    if (role !== 'host') return
    setRematchRequested(true)

    // Reset the room status to 'active' and delete previous guesses
    const { data: roomData } = await supabase
      .from('rooms')
      .select('id')
      .eq('room_code', roomCode.toUpperCase())
      .single()

    if (roomData) {
      // 1. Delete old guesses
      await supabase.from('guesses').delete().eq('room_id', roomData.id)
      
      // 2. Reactivate room, increment round, and reset secret_number so the NEW host can pick.
      await supabase.from('rooms').update({ 
        status: 'active', 
        round_number: (roomData.round_number || 1) + 1,
        secret_number: -1 // Special flag meaning "Host needs to pick a new number"
      }).eq('id', roomData.id)
    }
  }

  const messages = {
    guesser: { headline: 'You cracked it! 🎉', sub: "Your mind is unstoppable." },
    host: { headline: "They got it! 🎊", sub: "Your secret is out." },
  }
  const msg = messages[role] || messages.guesser

  const handleShare = async () => {
    const text = `I just guessed the secret number in ${roomCode?.toUpperCase()}!\n\nCan you beat my score?\nPlay YashGames: ${window.location.origin}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MindMatch Victory',
          text,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      navigator.clipboard.writeText(text)
      alert('Result copied to clipboard!')
    }
  }

  return (
    <motion.div
      className="flex flex-col min-h-dvh pt-safe pb-safe items-center justify-center px-6 gap-8 relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Big celebration emoji */}
      <motion.div
        className="text-8xl"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
      >
        🏆
      </motion.div>

      {/* Text */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <h1
          className="text-4xl font-bold text-white"
          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
        >
          {msg.headline}
        </h1>
        <p className="text-white/60 mt-2 text-lg">{msg.sub}</p>
      </motion.div>

      {/* Room code pill */}
      <motion.div
        className="glass-card px-6 py-3 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Room</p>
        <span className="room-code text-2xl">{roomCode?.toUpperCase()}</span>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        className="w-full max-w-sm flex flex-col gap-3"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        {role === 'host' ? (
          <button
            onClick={handleRematch}
            disabled={rematchRequested}
            className="btn-primary w-full disabled:opacity-50"
          >
            {rematchRequested ? 'Starting Rematch…' : 'Rematch (Swap Roles) 🔄'}
          </button>
        ) : (
          <div className="glass-card p-4 text-center text-sm text-white/70">
            Waiting for Host to start a rematch...
          </div>
        )}
        
        <button
          onClick={handleShare}
          className="bg-white/10 hover:bg-white/15 text-white w-full py-4 rounded-2xl font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <span>📤</span> Share Result
        </button>

        <button
          onClick={() => navigate('/')}
          className="btn-ghost w-full"
        >
          Quit to Home
        </button>
      </motion.div>

      {/* Glow orb decorations */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)' }}
      />
    </motion.div>
  )
}
