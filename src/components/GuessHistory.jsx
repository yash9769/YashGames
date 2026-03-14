// components/GuessHistory.jsx
// Displays the list of guesses using framer-motion for smooth list animations.

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function GuessHistory({ guesses }) {
  const bottomRef = useRef(null)

  // Auto-scroll to bottom on new guess
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [guesses.length])

  if (guesses.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-white/30 italic text-center text-sm font-medium">
          No guesses yet.<br/>The game awaits.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 pb-4">
      <AnimatePresence initial={false}>
        {guesses.map((g, idx) => {
          
          let responseBadge = null
          if (g.response === 'higher') {
             responseBadge = <span className="text-accent-hot font-bold text-sm bg-accent-hot/10 px-2 py-1 rounded-md">Higher ↑</span>
          } else if (g.response === 'lower') {
             responseBadge = <span className="text-accent-cool font-bold text-sm bg-accent-cool/10 px-2 py-1 rounded-md">Lower ↓</span>
          } else if (g.response === 'correct') {
             responseBadge = <span className="text-green-400 font-bold text-sm bg-green-400/10 px-2 py-1 rounded-md">Correct! ✓</span>
          } else {
             responseBadge = <span className="text-white/40 font-medium text-xs italic blink">Waiting...</span>
          }

          return (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="glass-card px-5 py-4 flex items-center justify-between"
              style={{
                // Make older guesses slightly dimmer to keep focus on the newest
                opacity: idx === guesses.length - 1 ? 1 : 0.7 
              }}
            >
              <div className="flex items-center gap-4">
                 <span className="text-white/20 font-bold text-xs uppercase tracking-widest w-4 text-right">
                    #{idx + 1}
                 </span>
                 <span className="text-2xl font-bold font-mono text-white tracking-tight">
                   {g.guess_value}
                 </span>
              </div>
              <div>
                {responseBadge}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
      <div ref={bottomRef} className="h-4" />
    </div>
  )
}
