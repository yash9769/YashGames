import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TurnTimer from './TurnTimer.jsx'
import PlaceInput from './PlaceInput.jsx'
import PlacesHistory from './PlacesHistory.jsx'
import { playSound } from '../lib/audio.js'

export default function AtlasBoard({ room, turns, role, onPlaceSubmit, onTimeout, isChecking }) {
  const isMyTurn = room.current_turn === role && room.status === 'active'
  const isHost = role === 'host'
  const opponentRole = isHost ? 'guesser' : 'host'

  const lastTurn = turns[turns.length - 1]
  let requiredLetter = room.starting_letter

  if (lastTurn && lastTurn.is_valid) {
    requiredLetter = lastTurn.place_name.slice(-1).toUpperCase()
  }

  useEffect(() => {
    if (isMyTurn) playSound('pop')
  }, [isMyTurn])

  return (
    <div className="flex flex-col h-full pt-safe pb-safe outline-none relative z-10">
      {/* Header Info */}
      <div className="flex justify-between items-center px-6 py-4">
        <div className="flex flex-col">
          <span className="text-white/40 text-[10px] uppercase font-bold tracking-widest font-body">Room</span>
          <span className="text-2xl font-bold font-mono tracking-wider drop-shadow-glow text-white">
            {room.room_code}
          </span>
        </div>
        
        {room.status === 'active' ? (
          <TurnTimer 
            duration={30} 
            isActive={room.status === 'active'} 
            onTimeout={onTimeout} 
            keyString={`turn-${turns.length}-${room.current_turn}`}
          />
        ) : (
          <div className="text-accent-hot font-bold blink px-4 py-2 rounded-xl bg-accent-hot/10 border border-accent-hot/20">
            Game Over
          </div>
        )}
      </div>

      {/* History Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <PlacesHistory turns={turns} currentPlayer={role} />
      </div>

      {/* Input Area */}
      <AnimatePresence>
        <motion.div
          className="p-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="glass-card p-4">
             <PlaceInput 
               requiredLetter={requiredLetter} 
               disabled={!isMyTurn}
               isChecking={isChecking}
               onSubmit={onPlaceSubmit}
             />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
