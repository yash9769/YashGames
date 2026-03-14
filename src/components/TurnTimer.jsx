import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'

export default function TurnTimer({ duration = 30, isActive, onTimeout, keyString }) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const timerRef = useRef(null)

  useEffect(() => {
    setTimeLeft(duration)
    
    if (!isActive) return

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          onTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [isActive, duration, onTimeout, keyString])

  const percentage = (timeLeft / duration) * 100
  const isUrgent = timeLeft <= 10

  const radius = 30
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  let colorClass = 'text-green-400'
  if (timeLeft <= 15) colorClass = 'text-accent'
  if (isUrgent) colorClass = 'text-accent-hot'

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-white/10"
        />
        <motion.circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          className={colorClass}
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'linear' }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      
      <motion.span 
        className={`text-2xl font-bold font-mono ${isUrgent ? 'animate-pulse text-accent-hot drop-shadow-[0_0_8px_rgba(255,101,132,0.5)]' : 'text-white'}`}
        key={timeLeft}
        initial={isUrgent ? { scale: 1.2 } : false}
        animate={isUrgent ? { scale: 1 } : false}
      >
        {timeLeft}
      </motion.span>
    </div>
  )
}
