import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import RoomCreate from '../components/RoomCreate.jsx'
import RoomJoin from '../components/RoomJoin.jsx'
import AtlasRoomCreate from '../components/AtlasRoomCreate.jsx'
import AtlasRoomJoin from '../components/AtlasRoomJoin.jsx'
import ScribbleRoomCreate from '../components/ScribbleRoomCreate.jsx'
import ScribbleRoomJoin from '../components/ScribbleRoomJoin.jsx'
import { supabase } from '../lib/supabaseClient.js'
import friendsService from '../lib/friends.js'

const pageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3 } },
}

export default function Home() {
  const [view, setView] = useState('hub')
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [user, setUser] = useState(null)
  const [connStatus, setConnStatus] = useState('checking')

  useEffect(() => {
    checkUser()
    loadSocialData()
    
    // Subscribe to friend requests
    let unsubscribe = () => {}
    try {
      unsubscribe = friendsService.subscribeToFriendRequests(() => {
        loadSocialData()
      })
    } catch (e) { console.error('Realtime social sub failed:', e) }
    
    return () => unsubscribe()
  }, [])

  async function checkUser() {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    setUser(currentUser)
    if (currentUser) {
      setConnStatus('connected')
    } else {
      // If no user, we might be in local mode or unauth
      setConnStatus('unauthenticated')
    }
  }

  async function loadSocialData() {
    try {
      const friendList = await friendsService.getFriends('accepted')
      const pendingRequests = await friendsService.getFriendRequests()
      setFriends(friendList || [])
      setRequests(pendingRequests || [])
    } catch (err) {
      console.error('Failed to load social data:', err)
      setConnStatus('connection_error')
    }
  }

  async function handleSearch(q) {
    setSearchQuery(q)
    if (q.length < 3) {
      setSearchResults([])
      return
    }
    try {
      const results = await friendsService.searchUsers(q)
      setSearchResults(results || [])
    } catch (err) {
      console.error('Search failed:', err)
    }
  }

  async function handleAddFriend(userId) {
    try {
      await friendsService.sendFriendRequest(userId)
      alert('Friend request sent!')
      setShowSearch(false)
      setSearchQuery('')
    } catch (err) {
      alert(err.message || 'Failed to send request')
    }
  }

  async function handleAccept(requestId) {
    try {
      await friendsService.acceptFriendRequest(requestId)
      loadSocialData()
    } catch (err) {
      alert('Failed to accept')
    }
  }

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

        {view === 'friends' && (
          <motion.div
            key="friends"
            className="flex flex-col flex-1 w-full max-w-sm mx-auto"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
          >
            <div className="flex justify-between items-center px-2 mb-6">
               <button onClick={() => setView('hub')} className="text-white/50 hover:text-white transition-colors font-body font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                 <span className="text-lg leading-none">←</span> Back
               </button>
               <h2 className="text-xl font-bold font-display text-white">Social Hub</h2>
            </div>

            <div className="flex flex-col gap-6">
               {/* Quick Actions */}
               <div className="glass-card p-5 border-accent/20">
                  <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Discovery</h3>
                  <div className="flex flex-col gap-3">
                     <div className="relative">
                        <input 
                          type="text"
                          placeholder="Search username..."
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                          onFocus={() => setShowSearch(true)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 transition-all font-body"
                        />
                        {searchQuery && (
                          <button onClick={() => {setSearchQuery(''); setSearchResults([]);}} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">✕</button>
                        )}
                     </div>

                     <AnimatePresence>
                        {showSearch && searchQuery.length >= 3 && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="flex flex-col gap-2 overflow-hidden"
                          >
                             {searchResults.length === 0 ? (
                               <p className="text-[10px] text-white/30 text-center py-2">No users found</p>
                             ) : (
                               searchResults.map(u => (
                                 <div key={u.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                    <span className="text-xs font-bold text-white">{u.username}</span>
                                    <button 
                                      onClick={() => handleAddFriend(u.id)}
                                      className="text-[10px] font-bold uppercase text-accent bg-accent/10 px-3 py-1.5 rounded-lg hover:bg-accent hover:text-white transition-all"
                                    >
                                      Connect
                                    </button>
                                 </div>
                               ))
                             )}
                          </motion.div>
                        )}
                     </AnimatePresence>
                  </div>
               </div>

               {/* Friend Requests */}
               {requests.length > 0 && (
                 <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-bold text-accent-hot uppercase tracking-widest px-1 animate-pulse">Pending Requests</h3>
                    <div className="flex flex-col gap-2">
                       {requests.map(req => (
                         <div key={req.id} className="glass-card p-4 border-accent-hot/20 flex items-center gap-4 bg-accent-hot/5">
                           <div className="w-10 h-10 rounded-full bg-accent-hot/20 flex items-center justify-center text-sm">👤</div>
                           <div className="flex-1">
                             <div className="font-bold text-white text-sm">{req.profiles?.username || 'Gamer'}</div>
                             <div className="text-[10px] text-white/40 uppercase font-bold">Wants to play!</div>
                           </div>
                           <button onClick={() => handleAccept(req.id)} className="p-2 rounded-xl bg-accent-hot text-white hover:scale-105 active:scale-95 transition-all">✓</button>
                         </div>
                       ))}
                    </div>
                 </div>
               )}

               {/* Connections List */}
               <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest px-1">My Connections</h3>
                  <div className="flex flex-col gap-2">
                     {friends.length === 0 ? (
                       <div className="glass-card p-8 flex flex-col items-center justify-center gap-2 text-center opacity-40">
                         <span className="text-4xl filter grayscale">👥</span>
                         <p className="text-sm">No connections yet.</p>
                       </div>
                     ) : (
                       friends.map(f => (
                         <div key={f.id} className="glass-card p-4 flex items-center gap-4 group hover:border-accent/40 transition-colors">
                           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-sm">
                             {(f.profiles?.username || '?')[0].toUpperCase()}
                           </div>
                           <div className="flex-1">
                             <div className="font-bold text-white text-sm">{f.profiles?.username}</div>
                             <div className="text-[10px] text-accent font-bold uppercase">Online</div>
                           </div>
                           <button className="p-2 rounded-xl bg-accent/20 text-accent hover:bg-accent hover:text-white transition-all active:scale-90">
                             🎮
                           </button>
                         </div>
                       ))
                     )}
                  </div>
               </div>

               {/* Connection Diagnostics (Footer) */}
               <div className="mt-auto pt-8 pb-4 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                     <div className={`w-2 h-2 rounded-full ${connStatus === 'connected' ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : connStatus === 'checking' ? 'bg-yellow-400' : 'bg-red-400 shadow-[0_0_8px_#f87171]'}`} />
                     <span className="text-[10px] uppercase font-bold tracking-widest text-white/30">
                       Supabase: {connStatus.replace('_', ' ')}
                     </span>
                  </div>
                  {connStatus === 'connection_error' && (
                    <p className="text-[8px] text-red-400/60 mt-2 max-w-[200px] mx-auto italic">
                      Check your project URL and internet connection. ERR_NAME_NOT_RESOLVED detected.
                    </p>
                  )}
               </div>
            </div>
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
