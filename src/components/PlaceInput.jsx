import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function PlaceInput({ requiredLetter, disabled, isChecking, onSubmit }) {
  const [value, setValue] = useState('')
  const [errorShake, setErrorShake] = useState(false)

  useEffect(() => {
    setValue('')
  }, [requiredLetter])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (disabled || isChecking) return

    const trimmed = value.trim()
    if (!trimmed) return

    if (trimmed.charAt(0).toUpperCase() !== requiredLetter.toUpperCase()) {
      setErrorShake(true)
      setTimeout(() => setErrorShake(false), 500)
      return
    }

    onSubmit(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2 relative">
      <div className="flex justify-between items-end px-2">
        <span className="text-white/60 text-sm font-medium">
          Must start with:
        </span>
        <span className="text-3xl font-bold text-accent drop-shadow-[0_0_10px_rgba(108,99,255,0.5)] font-mono">
          {requiredLetter}
        </span>
      </div>

      <motion.div
        animate={errorShake ? { x: [-10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="relative"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled || isChecking}
          placeholder={disabled ? "Opponent is thinking..." : "Enter a place name..."}
          className={`w-full bg-white/[0.08] border ${errorShake ? 'border-accent-hot bg-accent-hot/10' : 'border-white/[0.15] focus:border-accent/60 focus:bg-white/[0.1]'} rounded-2xl px-5 py-5 text-white placeholder-white/30 outline-none transition-colors text-xl font-body disabled:opacity-50`}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        
        {isChecking && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-accent">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
               ◌
            </motion.div>
          </div>
        )}
      </motion.div>

      {errorShake && (
        <p className="text-accent-hot text-xs font-bold text-center mt-1">
          Must start with '{requiredLetter}'!
        </p>
      )}
    </form>
  )
}
