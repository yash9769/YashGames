import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import RoomCreate from '../components/RoomCreate.jsx'
import RoomJoin from '../components/RoomJoin.jsx'
import AtlasRoomCreate from '../components/AtlasRoomCreate.jsx'
import AtlasRoomJoin from '../components/AtlasRoomJoin.jsx'
import ScribbleRoomCreate from '../components/ScribbleRoomCreate.jsx'
import ScribbleRoomJoin from '../components/ScribbleRoomJoin.jsx'

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3 } },
}

export default function Home() {
  const [view, setView] = useState('hub')

  return (
    <motion.div
      className="flex flex-col min-h-dvh pt-safe pb-safe px-5 relative z-10 w-full max-w-md mx-auto"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <AnimatePresence mode="wait">

        {/* --- MAIN HUB VIEW --- */}
        {view === 'hub' && (
          <motion.div
            key="hub"
            className="flex flex-col flex-1 items-center justify-center gap-8"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.25 } }}
          >
            <div className="text-center">
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                transition={{ duration: 2.5, delay: 0.8, repeat: Infinity, repeatDelay: 4 }}
              >
                🎮
              </motion.div>
              <h1
                className="text-5xl font-bold tracking-tight text-white leading-none font-display pb-2"
              >
                Yash<span className="text-accent">Games</span>
              </h1>
              <p className="text-white/50 mt-2 text-base font-medium font-body">
                Choose your challenge.
              </p>
            </div>

            <div className="w-full max-w-sm flex flex-col gap-4">
               <motion.button
                 onClick={() => setView('mindmatch')}
                 className="glass-card p-6 text-left active:scale-95 transition-transform duration-150 w-full hover:border-accent-hot/50"
                 whileTap={{ scale: 0.97 }}
               >
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-accent-hot/20 flex items-center justify-center text-2xl flex-shrink-0">
                     🧠
                   </div>
                   <div>
                     <div className="font-bold text-white text-xl font-display">
                       MindMatch
                     </div>
                     <div className="text-white/50 text-sm mt-0.5 font-body">
                       The multiplayer number game
                     </div>
                   </div>
                   <div className="ml-auto text-accent-hot text-xl">→</div>
                 </div>
               </motion.button>

               <motion.button
                 onClick={() => setView('atlas')}
                 className="glass-card p-6 text-left active:scale-95 transition-transform duration-150 w-full hover:border-accent/50"
                 whileTap={{ scale: 0.97 }}
               >
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-2xl flex-shrink-0">
                     🌍
                   </div>
                   <div>
                     <div className="font-bold text-white text-xl font-display">
                       Atlas
                     </div>
                     <div className="text-white/50 text-sm mt-0.5 font-body">
                       The geography chaining game
                     </div>
                   </div>
                   <div className="ml-auto text-accent text-xl">→</div>
                 </div>
               </motion.button>
               
               <motion.button
                 onClick={() => setView('scribble')}
                 className="glass-card p-6 text-left active:scale-95 transition-transform duration-150 w-full hover:border-[#F2BEAC]/50"
                 whileTap={{ scale: 0.97 }}
               >
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-[#F2BEAC]/20 flex items-center justify-center text-2xl flex-shrink-0">
                     🎨
                   </div>
                   <div>
                     <div className="font-bold text-white text-xl font-display">
                       Scribble
                     </div>
                     <div className="text-white/50 text-sm mt-0.5 font-body">
                       Draw and guess together
                     </div>
                   </div>
                   <div className="ml-auto text-[#F2BEAC] text-xl">→</div>
                 </div>
               </motion.button>

               <motion.button
                 onClick={() => setView('friends')}
                 className="glass-card p-6 text-left active:scale-95 transition-transform duration-150 w-full hover:border-accent/50"
                 whileTap={{ scale: 0.97 }}
               >
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-2xl flex-shrink-0">
                     👥
                   </div>
                   <div>
                     <div className="font-bold text-white text-xl font-display">
                       Friends
                     </div>
                     <div className="text-white/50 text-sm mt-0.5 font-body">
                       See your friends and send game invites
                     </div>
                   </div>
                   <div className="ml-auto text-accent text-xl">→</div>
                 </div>
               </motion.button>
            </div>


          </motion.div>
        )}

        {/* --- MINDMATCH MENU --- */}
        {view === 'mindmatch' && (
          <motion.div
            key="mindmatch"
            className="flex flex-col flex-1 items-center justify-center gap-8 w-full max-w-sm mx-auto"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.4 } }}
            exit={{ opacity: 0, x: -40, transition: { duration: 0.25 } }}
          >
            <div className="w-full flex justify-between items-center px-2 mb-4">
               <button onClick={() => setView('hub')} className="text-white/50 hover:text-white transition-colors font-body font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                 <span className="text-lg leading-none">←</span> Back
               </button>
               <h2 className="text-xl font-bold font-display text-accent-hot">MindMatch</h2>
            </div>
            
            <motion.button
              onClick={() => setView('mm-create')}
              className="glass-card p-6 text-left active:scale-95 transition-transform duration-150 w-full"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-hot/20 flex items-center justify-center text-2xl">🎯</div>
                <div>
                  <div className="font-bold text-white text-lg font-display">Create Room</div>
                  <div className="text-white/50 text-sm mt-0.5 font-body">Pick a number, share the code</div>
                </div>
              </div>
            </motion.button>
            <motion.button
              onClick={() => setView('mm-join')}
              className="glass-card p-6 text-left active:scale-95 transition-transform duration-150 w-full"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-cool/20 flex items-center justify-center text-2xl">🔍</div>
                <div>
                  <div className="font-bold text-white text-lg font-display">Join Room</div>
                  <div className="text-white/50 text-sm mt-0.5 font-body">Enter a code and start guessing</div>
                </div>
              </div>
            </motion.button>
          </motion.div>
        )}

        {/* --- ATLAS MENU --- */}
        {view === 'atlas' && (
          <motion.div
            key="atlas"
            className="flex flex-col flex-1 items-center justify-center gap-8 w-full max-w-sm mx-auto"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.4 } }}
            exit={{ opacity: 0, x: -40, transition: { duration: 0.25 } }}
          >
            <div className="w-full flex justify-between items-center px-2 mb-4">
               <button onClick={() => setView('hub')} className="text-white/50 hover:text-white transition-colors font-body font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                 <span className="text-lg leading-none">←</span> Back
               </button>
               <h2 className="text-xl font-bold font-display text-accent">Atlas</h2>
            </div>

            <motion.button
              onClick={() => setView('atlas-create')}
              className="glass-card p-6 text-left active:scale-95 transition-transform duration-150 w-full"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-2xl">🎲</div>
                <div>
                  <div className="font-bold text-white text-lg font-display">Create Game</div>
                  <div className="text-white/50 text-sm mt-0.5 font-body">Roll the dice and start the chain</div>
                </div>
              </div>
            </motion.button>
            <motion.button
              onClick={() => setView('atlas-join')}
              className="glass-card p-6 text-left active:scale-95 transition-transform duration-150 w-full"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-400/20 flex items-center justify-center text-2xl">🤝</div>
                <div>
                  <div className="font-bold text-white text-lg font-display">Join Game</div>
                  <div className="text-white/50 text-sm mt-0.5 font-body">Enter a room code to battle</div>
                </div>
              </div>
            </motion.button>
          </motion.div>
        )}

        {/* --- SCRIBBLE MENU --- */}
        {view === 'scribble' && (
          <motion.div
            key="scribble"
            className="flex flex-col flex-1 items-center justify-center gap-8 w-full max-w-sm mx-auto"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.4 } }}
            exit={{ opacity: 0, x: -40, transition: { duration: 0.25 } }}
          >
            <div className="w-full flex justify-between items-center px-2 mb-4">
               <button onClick={() => setView('hub')} className="text-white/50 hover:text-white transition-colors font-body font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                 <span className="text-lg leading-none">←</span> Back
               </button>
               <h2 className="text-xl font-bold font-display text-[#F2BEAC]">Scribble</h2>
            </div>

            <motion.button
              onClick={() => setView('scribble-create')}
              className="glass-card p-6 text-left active:scale-95 transition-transform duration-150 w-full"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F2BEAC]/20 flex items-center justify-center text-2xl">🖌️</div>
                <div>
                  <div className="font-bold text-white text-lg font-display">Create Game</div>
                  <div className="text-white/50 text-sm mt-0.5 font-body">You draw, they guess</div>
                </div>
              </div>
            </motion.button>
            <motion.button
              onClick={() => setView('scribble-join')}
              className="glass-card p-6 text-left active:scale-95 transition-transform duration-150 w-full"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#BEACF2]/20 flex items-center justify-center text-2xl">👀</div>
                <div>
                  <div className="font-bold text-white text-lg font-display">Join Game</div>
                  <div className="text-white/50 text-sm mt-0.5 font-body">Enter a room code to guess</div>
                </div>
              </div>
            </motion.button>
          </motion.div>
        )}

        {/* --- CREATION / JOIN VIEWS --- */}
        {view === 'mm-create' && (
          <motion.div key="mm-create" className="flex flex-col flex-1 pt-12" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <RoomCreate onBack={() => setView('mindmatch')} />
          </motion.div>
        )}
        {view === 'mm-join' && (
          <motion.div key="mm-join" className="flex flex-col flex-1 pt-12" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <RoomJoin onBack={() => setView('mindmatch')} />
          </motion.div>
        )}
        {view === 'atlas-create' && (
          <motion.div key="atlas-create" className="flex flex-col flex-1 pt-12" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <AtlasRoomCreate onBack={() => setView('atlas')} />
          </motion.div>
        )}
        {view === 'atlas-join' && (
          <motion.div key="atlas-join" className="flex flex-col flex-1 pt-12" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <AtlasRoomJoin onBack={() => setView('atlas')} />
          </motion.div>
        )}
        {view === 'scribble-create' && (
          <motion.div key="scribble-create" className="flex flex-col flex-1 pt-12" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <ScribbleRoomCreate onBack={() => setView('scribble')} />
          </motion.div>
        )}
        {view === 'scribble-join' && (
          <motion.div key="scribble-join" className="flex flex-col flex-1 pt-12" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
            <ScribbleRoomJoin onBack={() => setView('scribble')} />
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  )
}
