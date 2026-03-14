// components/GameBoard.jsx
// Core game layout. Renders differently based on role:
//   host    → sees guess list + Higher/Lower/Correct buttons
//   guesser → sees guess input + guess history

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GuessInput from './GuessInput.jsx'
import GuessHistory from './GuessHistory.jsx'
import { useNavigate } from 'react-router-dom'

export default function GameBoard({ room, guesses, role, onGuess, onRespond }) {
  const navigate = useNavigate()
  const [respondingId, setRespondingId] = useState(null)
  const [lastFeedback, setLastFeedback] = useState(null)

  // The most recent guess that hasn't been responded to yet (for host view)
  const pendingGuess = [...guesses].reverse().find(g => !g.response)

  // Latest response for guesser hint display
  const latestResponse = [...guesses].reverse().find(g => g.response)?.response

  const handleRespond = async (response) => {
    if (!pendingGuess) return
    setRespondingId(pendingGuess.id)
    setLastFeedback(response)
    await onRespond(pendingGuess.id, response)
    setRespondingId(null)
  }

  const totalGuesses = guesses.length
  const answeredGuesses = guesses.filter(g => g.response).length

  return (
    <div className="flex flex-col h-full min-h-dvh pb-safe">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
        <div>
          <p className="text-white/40 text-xs uppercase tracking-widest">Room</p>
          <span className="room-code text-xl">{room?.room_code}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Role chip */}
          <div className="glass-card px-3 py-1.5 text-xs font-semibold text-white/70">
            {role === 'host' ? '🎯 Host' : '🔍 Guesser'}
          </div>
          {/* Guess counter */}
          <div className="glass-card px-3 py-1.5 text-xs font-semibold text-accent">
            {totalGuesses} guess{totalGuesses !== 1 ? 'es' : ''}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">

        {/* HOST VIEW */}
        {role === 'host' && (
          <>
            {/* Secret number reminder */}
            <div className="glass-card p-5">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Your Secret Number</p>
              <p className="text-4xl font-mono font-bold text-accent">
                {room?.secret_number ?? '—'}
              </p>
              <p className="text-white/40 text-xs mt-2">
                Respond to each guess your friend makes below
              </p>
            </div>

            {/* Pending guess action */}
            <AnimatePresence>
              {pendingGuess && (
                <motion.div
                  key={pendingGuess.id}
                  className="glass-card p-5"
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                >
                  <p className="text-white/50 text-sm mb-1">Latest guess</p>
                  <p className="text-5xl font-mono font-bold text-white mb-5">
                    {pendingGuess.guess_value}
                  </p>

                  {/* Response buttons */}
                  <div className="grid grid-cols-3 gap-3">
                    <motion.button
                      onClick={() => handleRespond('lower')}
                      disabled={!!respondingId}
                      className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl
                                 bg-accent-cool/15 border border-accent-cool/30 active:scale-95
                                 transition-all duration-150 disabled:opacity-50"
                      whileTap={{ scale: 0.93 }}
                    >
                      <span className="text-2xl">↓</span>
                      <span className="text-accent-cool text-xs font-semibold uppercase tracking-wide">Lower</span>
                    </motion.button>

                    <motion.button
                      onClick={() => handleRespond('correct')}
                      disabled={!!respondingId}
                      className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl
                                 bg-green-400/15 border border-green-400/30 active:scale-95
                                 transition-all duration-150 disabled:opacity-50"
                      whileTap={{ scale: 0.93 }}
                    >
                      <span className="text-2xl">✓</span>
                      <span className="text-green-400 text-xs font-semibold uppercase tracking-wide">Correct</span>
                    </motion.button>

                    <motion.button
                      onClick={() => handleRespond('higher')}
                      disabled={!!respondingId}
                      className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl
                                 bg-accent-hot/15 border border-accent-hot/30 active:scale-95
                                 transition-all duration-150 disabled:opacity-50"
                      whileTap={{ scale: 0.93 }}
                    >
                      <span className="text-2xl">↑</span>
                      <span className="text-accent-hot text-xs font-semibold uppercase tracking-wide">Higher</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Waiting state when no pending guess */}
            {!pendingGuess && totalGuesses === 0 && (
              <div className="glass-card p-6 text-center">
                <motion.div
                  className="text-3xl mb-3"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ⏳
                </motion.div>
                <p className="text-white/50 text-sm">
                  Waiting for your friend to make their first guess…
                </p>
                <p className="text-white/30 text-xs mt-2">
                  Make sure they've joined with code <span className="text-accent font-mono">{room?.room_code}</span>
                </p>
              </div>
            )}

            {!pendingGuess && totalGuesses > 0 && answeredGuesses === totalGuesses && (
              <div className="glass-card p-4 text-center">
                <p className="text-white/40 text-sm">Waiting for next guess…</p>
              </div>
            )}
          </>
        )}

        {/* GUESSER VIEW */}
        {role === 'guesser' && (
          <>
            <div className="glass-card p-5">
              <p className="text-white/50 text-sm leading-relaxed">
                Think of a number, type it, and tap send. Your opponent will guide you with{' '}
                <span className="text-accent-hot font-semibold">Higher</span> or{' '}
                <span className="text-accent-cool font-semibold">Lower</span> hints.
              </p>
            </div>

            <GuessInput
              onGuess={onGuess}
              disabled={false}
              latestResponse={latestResponse}
            />
          </>
        )}

        {/* Guess history — visible to both players */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider">
              Guess History
            </h3>
            {totalGuesses > 0 && (
              <span className="text-white/30 text-xs">{totalGuesses} total</span>
            )}
          </div>
          <GuessHistory guesses={guesses} />
        </div>

      </div>

      {/* Bottom safe area spacer */}
      <div className="h-4" />
    </div>
  )
}
