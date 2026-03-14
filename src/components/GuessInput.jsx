// components/GuessInput.jsx
// The input control used by Player B to submit guesses.
// Designed for smooth mobile keyboard interaction.

import { useState } from 'react'
import { motion } from 'framer-motion'
import { playSound } from '../lib/audio.js'

export default function GuessInput({ onGuess, disabled, latestResponse }) {
  const [value, setValue] = useState('')
  const [shake, setShake] = useState(false)

  const handleSubmit = () => {
    const num = parseInt(value, 10)
    if (isNaN(num)) {
      playSound('error')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    playSound('pop')
    onGuess(num)
    setValue('')
  }

  // Color hint based on last response
  const hintColor = {
    higher: 'text-accent-hot',
    lower: 'text-accent-cool',
    correct: 'text-green-400',
  }[latestResponse] || 'text-white/40'

  const hintText = {
    higher: '↑ Go higher',
    lower: '↓ Go lower',
    correct: '✓ Correct!',
  }[latestResponse] || 'Enter your guess'

  return (
    <div className="flex flex-col gap-3">
      {/* Hint label */}
      <motion.p
        key={latestResponse}
        className={`text-sm font-medium text-center ${hintColor}`}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {hintText}
      </motion.p>

      {/* Input row */}
      <motion.div
        className="flex gap-3"
        animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          className="num-input flex-1"
          placeholder="Your guess…"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !disabled && handleSubmit()}
          disabled={disabled}
        />
        <motion.button
          onClick={handleSubmit}
          disabled={disabled || !value}
          className="btn-primary px-5 disabled:opacity-40"
          whileTap={{ scale: 0.92 }}
        >
          <span className="text-xl">↗</span>
        </motion.button>
      </motion.div>
    </div>
  )
}
