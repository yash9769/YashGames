// components/GuessHistory.jsx
// Displays the running list of guesses with animated entry and response badges.

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ResponseBadge = ({ response }) => {
  if (!response) return (
    <span className="badge-waiting">Waiting…</span>
  )
  if (response === 'higher') return (
    <span className="badge-higher">↑ Higher</span>
  )
  if (response === 'lower') return (
    <span className="badge-lower">↓ Lower</span>
  )
  if (response === 'correct') return (
    <span className="badge-correct">✓ Correct!</span>
  )
  return null
}

export default function GuessHistory({ guesses }) {
  const bottomRef = useRef(null)

  // Auto-scroll to latest guess
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [guesses.length])

  if (guesses.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-white/25 text-sm">
        No guesses yet…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto max-h-64 pr-1">
      <AnimatePresence initial={false}>
        {guesses.map((guess, index) => (
          <motion.div
            key={guess.id}
            layout
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-between glass-card px-4 py-3"
          >
            {/* Guess number + ordinal */}
            <div className="flex items-center gap-3">
              <span className="text-white/30 text-xs font-mono w-5 text-right">
                #{index + 1}
              </span>
              <motion.span
                className="text-white text-xl font-mono font-bold"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {guess.guess_value}
              </motion.span>
            </div>

            {/* Response badge with animated appearance */}
            <motion.div
              key={`${guess.id}-${guess.response}`}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <ResponseBadge response={guess.response} />
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  )
}
