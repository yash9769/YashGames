import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient.js'

export default function AtlasResult() {
  const { roomCode } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const role = searchParams.get('role') || 'guesser'
  const [room, setRoom] = useState(null)
  const [turnsCount, setTurnsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchResult() {
      const { data: dbRoom } = await supabase
        .from('atlas_rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .single()
        
      if (dbRoom) setRoom(dbRoom)
      
      const { count } = await supabase
        .from('atlas_turns')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', dbRoom?.id)
        
      setTurnsCount(count || 0)
      setLoading(false)
    }
    fetchResult()
  }, [roomCode])

  useEffect(() => {
    if (!room) return

    const channel = supabase
      .channel(`rematch-${room.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'atlas_rooms',
        filter: `id=eq.${room.id}`,
      }, (payload) => {
        if (payload.new.status === 'active') {
           const newRole = role === 'host' ? 'guesser' : 'host'
           navigate(`/atlas/game/${roomCode.toUpperCase()}?role=${newRole}`, { replace: true })
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [room, roomCode, role, navigate])

  const handleRematch = async () => {
    if (!room) return
    await supabase.from('atlas_turns').delete().eq('room_id', room.id)
    await supabase.from('atlas_rooms').update({
      status: 'active',
      current_turn: 'host'
    }).eq('id', room.id)
  }

  if (loading) return <div className="min-h-dvh flex items-center justify-center text-accent"><motion.div animate={{rotate:360}} transition={{repeat:Infinity, duration:1}}>◌</motion.div></div>
  if (!room) return <div className="min-h-dvh flex items-center justify-center">Game Not Found</div>

  const isWinner = room.winner === role
  const reasons = {
    'timeout': '⏱️ Time ran out',
    'repeat': '🔁 Repeated a place',
    'invalid': '❌ Invalid place name'
  }
  const reasonText = reasons[room.loss_reason] || 'Game Over'

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col min-h-dvh pt-safe pb-safe items-center justify-center px-5 gap-8 relative z-10"
    >
      <div className="text-center">
        <motion.div 
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
          className="text-8xl mb-4"
        >
          {isWinner ? '🏆' : '💀'}
        </motion.div>
        <h1 className="text-5xl font-bold font-display tracking-tight text-white mb-2">
          {isWinner ? 'Victory!' : 'Defeat'}
        </h1>
        <p className="text-accent-hot font-medium text-xl font-body">
          {reasonText}
        </p>
      </div>

      <div className="glass-card p-6 w-full max-w-sm flex flex-col gap-4 text-center">
        <div>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1 font-body font-bold">Chain Length</p>
          <p className="text-4xl font-mono font-bold text-accent drop-shadow-glow">{turnsCount}</p>
        </div>
        <div>
           <p className="text-white/40 text-[10px] uppercase tracking-widest font-body font-bold">Room Code</p>
           <p className="room-code text-2xl">{roomCode}</p>
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-3">
        <button onClick={handleRematch} className="btn-primary w-full text-lg shadow-glow">
          Rematch (Swap Roles) 🔄
        </button>
        <button onClick={() => navigate('/')} className="btn-ghost w-full text-lg">
          Quit to Hub
        </button>
      </div>
    </motion.div>
  )
}
