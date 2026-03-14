import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

const faces = ['A', 'T', 'L', 'A', 'S']

export default function DiceRoll({ isRolling, result }) {
  const [currentFace, setCurrentFace] = useState(faces[0])

  useEffect(() => {
    if (!isRolling) return
    let i = 0
    const interval = setInterval(() => {
      setCurrentFace(faces[i % faces.length])
      i++
    }, 100)
    return () => clearInterval(interval)
  }, [isRolling])

  return (
    <div className="w-full flex flex-col items-center justify-center gap-6 py-8">
      <div className="relative w-32 h-32 perspective-1000">
        <motion.div
           className="w-full h-full glass-card border-accent/40 flex items-center justify-center shadow-[0_0_30px_rgba(108,99,255,0.3)]"
           animate={isRolling ? { 
             rotateX: [0, 360, 720], 
             rotateY: [0, 180, 360],
             scale: [1, 1.2, 1]
           } : { 
             rotateX: 0, 
             rotateY: 0,
             scale: 1
           }}
           transition={isRolling ? { 
             duration: 1.5, 
             repeat: Infinity, 
             ease: "linear" 
           } : {
             type: "spring",
             stiffness: 260,
             damping: 20
           }}
           style={{ transformStyle: 'preserve-3d' }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={isRolling ? currentFace : result}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="text-7xl font-black text-accent drop-shadow-[0_0_15px_rgba(108,99,255,0.8)] font-mono"
            >
              {isRolling ? currentFace : result}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      </div>
      
      <p className="text-white/50 font-bold uppercase tracking-widest text-sm font-body">
         {isRolling ? "Rolling the ATLAS dice..." : "Starting letter selected"}
      </p>
    </div>
  )
}
