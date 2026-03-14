import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function PlacesHistory({ turns, currentPlayer }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns.length])

  if (turns.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-white/30 italic font-body">
        Awaiting the first move...
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2 pb-4">
      <AnimatePresence initial={false}>
        {turns.map((turn) => {
          const isYou = turn.player === currentPlayer
          
          let badge = null
          if (turn.is_valid === null) badge = <span className="badge-waiting">⏳ Checking...</span>
          else if (turn.is_valid === true) badge = <span className="badge-correct">✓ Valid</span>
          else badge = <span className="bg-accent-hot/20 text-accent-hot border border-accent-hot/30 rounded-xl px-3 py-1 text-sm font-semibold">✗ Invalid</span>

          const name = turn.place_name
          const head = name.slice(0, -1)
          const lastLetter = name.slice(-1)

          return (
            <motion.div
              key={turn.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex flex-col rounded-3xl p-5 ${isYou ? 'bg-accent/20 border-accent/30 ml-8' : 'glass-card mr-8 mb-0 pb-5 pt-5 px-5 shadow-none'}`}
              style={!isYou ? { margin: '0 2rem 0 0' } : {}}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 font-body">
                  {isYou ? 'You' : 'Opponent'} • Turn {turn.turn_number}
                </span>
                {badge}
              </div>
              <div className="text-2xl font-bold tracking-tight font-display">
                {head}<span className="text-accent underline decoration-2 underline-offset-4">{lastLetter}</span>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
      <div ref={bottomRef} className="h-2" />
    </div>
  )
}
