// pages/Home.jsx
// Entry screen: players choose to Create a room or Join an existing one.

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import RoomCreate from '../components/RoomCreate.jsx'
import RoomJoin from '../components/RoomJoin.jsx'

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3 } },
}

export default function Home() {
  // 'home' | 'create' | 'join'
  const [view, setView] = useState('home')

  return (
    <motion.div
      className="flex flex-col min-h-dvh pt-safe pb-safe px-5 relative z-10"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <AnimatePresence mode="wait">

        {view === 'home' && (
          <motion.div
            key="home"
            className="flex flex-col flex-1 items-center justify-center gap-8"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.25 } }}
          >
            {/* Logo */}
            <div className="text-center">
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                transition={{ duration: 2.5, delay: 0.8, repeat: Infinity, repeatDelay: 4 }}
              >
                🧠
              </motion.div>
              <h1
                className="text-5xl font-bold tracking-tight text-white leading-none"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Mind<span className="text-accent">Match</span>
              </h1>
              <p className="text-white/50 mt-2 text-base font-medium">
                The multiplayer number game
              </p>
            </div>

            {/* Cards */}
            <div className="w-full max-w-sm flex flex-col gap-4">
              {/* Create room card */}
              <motion.button
                onClick={() => setView('create')}
                className="glass-card p-6 text-left active:scale-95 transition-transform duration-150 w-full"
                whileTap={{ scale: 0.97 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-2xl flex-shrink-0">
                    🎯
                  </div>
                  <div>
                    <div className="font-semibold text-white text-lg" style={{ fontFamily: 'Space Grotesk' }}>
                      Create Room
                    </div>
                    <div className="text-white/50 text-sm mt-0.5">
                      Pick a number, share the code
                    </div>
                  </div>
                  <div className="ml-auto text-white/30 text-xl">→</div>
                </div>
              </motion.button>

              {/* Join room card */}
              <motion.button
                onClick={() => setView('join')}
                className="glass-card p-6 text-left active:scale-95 transition-transform duration-150 w-full"
                whileTap={{ scale: 0.97 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent-hot/20 flex items-center justify-center text-2xl flex-shrink-0">
                    🔍
                  </div>
                  <div>
                    <div className="font-semibold text-white text-lg" style={{ fontFamily: 'Space Grotesk' }}>
                      Join Room
                    </div>
                    <div className="text-white/50 text-sm mt-0.5">
                      Enter a code and start guessing
                    </div>
                  </div>
                  <div className="ml-auto text-white/30 text-xl">→</div>
                </div>
              </motion.button>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <p className="text-white/25 text-xs text-center">
                Invite a friend anywhere in the world ✨
              </p>

              <Link
                to="/about"
                className="text-white/40 hover:text-white transition-colors text-xs uppercase tracking-widest font-semibold py-2 px-4 rounded-full border border-white/5 hover:border-white/10 hover:bg-white/5"
              >
                About Our Space
              </Link>
            </div>
          </motion.div>
        )}

        {view === 'create' && (
          <motion.div
            key="create"
            className="flex flex-col flex-1"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, x: -40, transition: { duration: 0.25 } }}
          >
            <RoomCreate onBack={() => setView('home')} />
          </motion.div>
        )}

        {view === 'join' && (
          <motion.div
            key="join"
            className="flex flex-col flex-1"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, x: -40, transition: { duration: 0.25 } }}
          >
            <RoomJoin onBack={() => setView('home')} />
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  )
}
