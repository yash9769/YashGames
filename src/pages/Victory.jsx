// pages/Victory.jsx
// Celebration screen shown to both players when the number is guessed correctly.

import { useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'

export default function Victory() {
  const { roomCode } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const role = searchParams.get('role') || 'guesser'
  const fired = useRef(false)

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

  const messages = {
    guesser: { headline: 'You cracked it! 🎉', sub: "Your mind is unstoppable." },
    host: { headline: "They got it! 🎊", sub: "Your secret is out." },
  }
  const msg = messages[role] || messages.guesser

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
        <button
          onClick={() => navigate('/')}
          className="btn-primary w-full"
        >
          Play Again 🎮
        </button>
        <button
          onClick={() => navigate('/')}
          className="btn-ghost w-full"
        >
          Go Home
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
