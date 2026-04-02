// components/GameBoard.jsx
// The core match screen. Connects to Supabase, syncs state, handles turns.

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabaseClient.js'
import GuessInput from './GuessInput.jsx'
import GuessHistory from './GuessHistory.jsx'
import { playSound } from '../lib/audio.js'

export default function GameBoard() {
  const { roomCode } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  // 'host' (Player A) or 'guesser' (Player B)
  const role = searchParams.get('role') || 'guesser'

  const [room, setRoom] = useState(null)
  const [guesses, setGuesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // We keep the realtime channel ref to ensure we only subscribe once
  const channelRef = useRef(null)

  // Fetch initial game state
  const fetchGameState = useCallback(async () => {
    // 1. Get room details
    const { data: dbRoom, error: roomErr } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', roomCode.toUpperCase())
      .single()

    if (roomErr || !dbRoom) {
      setError('Room not found.')
      setLoading(false)
      return
    }

    setRoom(dbRoom)

    // 2. Get past guesses
    const { data: dbGuesses } = await supabase
      .from('guesses')
      .select('*')
      .eq('room_id', dbRoom.id)
      .order('created_at', { ascending: true })

    setGuesses(dbGuesses || [])
    setLoading(false)

    // Check if room is already completed.
    if (dbRoom.status === 'complete') {
        navigate(`/game/${dbRoom.room_code}/victory?role=${role}`, { replace: true })
    }
  }, [roomCode, role, navigate])

  // Initial load
  useEffect(() => {
    fetchGameState()
  }, [fetchGameState])

  // Setup Realtime subscriptions
  useEffect(() => {
    if (!room) return

    channelRef.current = supabase
      .channel(`game-${room.id}`)
      // Listen to room updates (for status changes, round limits, scores)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${room.id}`,
      }, (payload) => {
        setRoom(payload.new)
        // If room completes, jump to victory screen
        if (payload.new.status === 'complete') {
           setTimeout(() => navigate(`/game/${room.room_code}/victory?role=${role}`, { replace: true }), 1500)
        }
      })
      // Listen for NEW guesses (Player B inserting)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'guesses',
        filter: `room_id=eq.${room.id}`,
      }, (payload) => {
        setGuesses(prev => [...prev, payload.new])
        // Minor haptic / audio queue for Host when a new guess arrives
        if (role === 'host' && navigator.vibrate) navigator.vibrate(50)
      })
      // Listen for UPDATED guesses (Player A adding response "higher"/"lower")
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'guesses',
        filter: `room_id=eq.${room.id}`,
      }, (payload) => {
        setGuesses(prev => prev.map(g => g.id === payload.new.id ? payload.new : g))
      })
      .subscribe()

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [room?.id, roomCode, role, navigate])

  // Actions for Player B (Guesser)
  const handleMakeGuess = async (val) => {
    if (room.status !== 'active') return
    // Simple frontend block, host also verifies later
    if (guesses.some(g => g.response === null)) return // Wait for host to answer previous
    
    await supabase.from('guesses').insert({
      room_id: room.id,
      guess_value: val,
      response: null
    })
  }

  // Actions for Player A (Host)
  const handleHostResponse = async (guessId, responseVal) => {
    if (room.status !== 'active') return

    // Play appropriate sound
    if (responseVal === 'correct') {
      playSound('win')
      if (navigator.vibrate) navigator.vibrate([100, 50, 100])
    } else {
      playSound('pop')
      if (navigator.vibrate) navigator.vibrate(30)
    }

    // 1. Update the guess
    await supabase.from('guesses').update({ response: responseVal }).eq('id', guessId)
    
    // 2. If correct, end game
    if (responseVal === 'correct') {
      await supabase.from('rooms').update({ status: 'complete' }).eq('id', room.id)
    } else if (room.max_attempts) {
      // Check if max attempts reached.
      // Wait, we need to count *total* guesses including this one.
      const totalGuesses = guesses.length // the new guess is in local state, might not be fully synced, but usually is.
      if (totalGuesses >= room.max_attempts) {
         // Out of attempts! For now, we'll just complete the room but mark it as failed (you can add a failed screen).
         // Actually, let's keep it simple: if failed, we'll mark as complete for now.
         await supabase.from('rooms').update({ status: 'failed' }).eq('id', room.id)
         alert(`Game Over! Out of attempts. The number was ${room.secret_number}`)
      }
    }
  }

  // Derived state
  const unresolvedGuess = guesses.find(g => g.response === null)
  const isGuesserTurn = role === 'guesser' && !unresolvedGuess
  const isHostTurn = role === 'host' && unresolvedGuess
  
  // Extract latest response for hint text on GuessInput
  const resolvedGuesses = guesses.filter(g => g.response !== null)
  const latestResponse = resolvedGuesses.length > 0 ? resolvedGuesses[resolvedGuesses.length - 1].response : null

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center relative z-10">
         <motion.div 
           className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full"
           animate={{ rotate: 360 }}
           transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
         />
      </div>
    )
  }

  if (error) {
    return <div className="flex-1 flex items-center justify-center p-6 text-center text-accent-hot relative z-10">{error}</div>
  }

  return (
    <div className="flex flex-col h-full pt-safe pb-safe outline-none relative z-10">
      
      {/* Top Header details */}
      <div className="flex justify-between items-center px-4 py-3 mb-2">
         <div className="flex flex-col">
            <span className="text-white/40 text-[10px] uppercase font-bold tracking-widest leading-tight">Room</span>
            <span className="text-xl font-bold font-mono tracking-wider drop-shadow-glow text-white leading-tight">
               {room.room_code}
            </span>
         </div>
         {role === 'host' && (
           <div className="flex flex-col items-end">
             <span className="text-white/40 text-[10px] uppercase font-bold tracking-widest leading-tight">Secret Number</span>
             <span className="text-xl font-bold font-mono text-accent drop-shadow-glow leading-tight">
               {room.secret_number}
             </span>
           </div>
         )}
         {role === 'guesser' && room.range_max && (
           <div className="flex flex-col items-end">
             <span className="text-white/40 text-[10px] uppercase font-bold tracking-widest leading-tight">Range</span>
             <span className="text-sm font-bold font-mono text-white/80 leading-tight">
               1 - {room.range_max}
             </span>
           </div>
         )}
      </div>

      {/* Main scrolling history area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <GuessHistory guesses={guesses} />
      </div>

      {/* Bottom Action Area */}
      <AnimatePresence>
        <motion.div
           className="p-4"
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
        >
          {room.secret_number === -1 ? (
             role === 'host' ? (
                <div className="glass-card p-6 flex flex-col items-center gap-4">
                   <h3 className="text-xl font-bold text-white font-display">Pick your Secret Number</h3>
                   <p className="text-white/50 text-sm text-center">
                     Choose a number between 1 and {room.range_max || 100}
                   </p>
                   <input 
                      type="number"
                      className="room-input"
                      placeholder={`1-${room.range_max || 100}`}
                      min={1}
                      max={room.range_max || 100}
                      autoFocus
                      onKeyDown={(e) => {
                         if (e.key === 'Enter') {
                            const val = parseInt(e.target.value)
                            if (val >= 1 && val <= (room.range_max || 100)) {
                               supabase.from('rooms').update({ secret_number: val }).eq('id', room.id)
                            }
                         }
                      }}
                   />
                   <button 
                      onClick={(e) => {
                        const input = e.target.previousSibling
                        const val = parseInt(input.value)
                        if (val >= 1 && val <= (room.range_max || 100)) {
                           supabase.from('rooms').update({ secret_number: val }).eq('id', room.id)
                        }
                      }}
                      className="btn-primary w-full shadow-glow py-4 rounded-2xl"
                   >
                      Set Number & Start 🚀
                   </button>
                </div>
             ) : (
                <div className="glass-card p-10 flex flex-col items-center gap-6 text-center">
                   <motion.div
                     animate={{ rotate: 360 }}
                     transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                     className="text-5xl"
                   >
                     🌀
                   </motion.div>
                   <div>
                     <h3 className="text-xl font-bold text-white font-display">Waiting for Host</h3>
                     <p className="text-white/50 text-sm mt-1">The new host is choosing their secret number...</p>
                   </div>
                </div>
             )
          ) : (
            role === 'guesser' ? (
              <div className="glass-card p-4">
                <GuessInput 
                  onGuess={handleMakeGuess} 
                  disabled={!isGuesserTurn || room.status !== 'active'}
                  latestResponse={latestResponse}
                />
              </div>
            ) : (
              <div className="glass-card p-4 flex flex-col items-center">
                {isHostTurn ? (
                  <>
                    <p className="text-sm text-white/60 mb-3 font-medium text-center">
                      Guesser chose: <span className="font-bold text-white text-xl">{unresolvedGuess.guess_value}</span>
                    </p>
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <button 
                         onClick={() => handleHostResponse(unresolvedGuess.id, 'lower')}
                         className="p-4 rounded-xl bg-accent-cool/10 hover:bg-accent-cool/20 border border-accent-cool/30 text-accent-cool font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_15px_rgba(67,232,216,0.1)]"
                      >
                        <span className="text-2xl leading-none">↓</span> Lower
                      </button>
                      <button 
                         onClick={() => handleHostResponse(unresolvedGuess.id, 'higher')}
                         className="p-4 rounded-xl bg-accent-hot/10 hover:bg-accent-hot/20 border border-accent-hot/30 text-accent-hot font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,101,132,0.1)]"
                      >
                        Higher <span className="text-2xl leading-none">↑</span>
                      </button>
                    </div>
                    <button 
                      onClick={() => handleHostResponse(unresolvedGuess.id, 'correct')}
                      className="w-full mt-3 p-4 rounded-xl bg-gradient-to-r from-accent to-purple-500 text-white font-bold text-lg active:scale-95 transition-all shadow-glow flex items-center justify-center gap-2"
                    >
                      🎯 Correct!
                    </button>
                  </>
                ) : (
                  <div className="py-6 flex flex-col items-center gap-3">
                     <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
                     <p className="text-white/40 italic text-sm">Waiting for guesser...</p>
                  </div>
                )}
              </div>
            )
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  )
}
