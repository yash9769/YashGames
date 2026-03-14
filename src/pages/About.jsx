// pages/About.jsx
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function About() {
  return (
    <motion.div 
      className="flex flex-col min-h-dvh pt-safe pb-safe px-6 relative z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Back button */}
      <div className="mt-4">
        <Link to="/" className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-sm group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Menu
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-12">
        <motion.div 
          className="text-5xl mb-8"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
        >
          💖
        </motion.div>

        <motion.div
           className="glass-card w-full max-w-md overflow-hidden relative"
           initial={{ y: 30, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Decorative bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent via-accent-hot to-accent" />
          
          <div className="p-8 md:p-10 space-y-8">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: 'display' }}>
                Our Secret Space
              </h1>
              <div className="h-0.5 w-12 bg-accent/30 mx-auto rounded-full" />
            </div>

            <div className="space-y-6 text-white/70 leading-relaxed text-center">
              <motion.p 
                className="text-xl font-medium text-white italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                “For Kshirja And Yash onlyyyy”
              </motion.p>
              
              <div className="space-y-4 text-sm md:text-base">
                <p>
                  In a world full of noise, this tiny corner was built just for the two of us. 
                  A place where we challenge each other, share moments, and create memories 
                  one guess at a time.
                </p>
                
                <p>
                  Whether it's a game of numbers or the journey of life, 
                  everything is better when we're playing it together.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 text-center">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold mb-3">
                Built with love
              </div>
              <div className="flex justify-center items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-sm">Y</span>
                <span className="text-accent-hot animate-pulse">❤️</span>
                <span className="w-8 h-8 rounded-full bg-accent-hot/10 flex items-center justify-center text-sm">K</span>
              </div>
            </div>
          </div>
        </motion.div>
        
        <motion.p 
          className="mt-10 text-white/20 text-[10px] uppercase tracking-[0.3em] font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          Infinite & Beyond ✨
        </motion.p>
      </div>
    </motion.div>
  )
}
