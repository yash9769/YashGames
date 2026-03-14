import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient.js'
import { validatePlace } from '../lib/validatePlace.js'
import AtlasBoard from '../components/AtlasBoard.jsx'

export default function AtlasGame() {
  const { roomCode } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const role = searchParams.get('role') || 'guesser'
  const [room, setRoom] = useState(null)
  const [turns, setTurns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isChecking, setIsChecking] = useState(false)

  const channelRef = useRef(null)

  const fetchGameState = useCallback(async () => {
    const { data: dbRoom, error: roomErr } = await supabase
      .from('atlas_rooms')
      .select('*')
      .eq('room_code', roomCode.toUpperCase())
      .single()

    if (roomErr || !dbRoom) {
      setError('Room not found.')
      setLoading(false)
      return
    }

    setRoom(dbRoom)

    const { data: dbTurns } = await supabase
      .from('atlas_turns')
      .select('*')
      .eq('room_id', dbRoom.id)
      .order('created_at', { ascending: true })

    setTurns(dbTurns || [])
    setLoading(false)

    if (dbRoom.status === 'complete') {
      navigate(`/atlas/result/${dbRoom.room_code}?role=${role}`, { replace: true })
    }
  }, [roomCode, role, navigate])

  useEffect(() => {
    fetchGameState()
  }, [fetchGameState])

  useEffect(() => {
    if (!room) return

    channelRef.current = supabase
      .channel(`game-${room.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'atlas_rooms',
        filter: `id=eq.${room.id}`,
      }, (payload) => {
        setRoom(payload.new)
        if (payload.new.status === 'complete') {
          setTimeout(() => navigate(`/atlas/result/${room.room_code}?role=${role}`, { replace: true }), 1500)
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'atlas_turns',
        filter: `room_id=eq.${room.id}`,
      }, (payload) => {
        setTurns(prev => [...prev, payload.new])
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'atlas_turns',
        filter: `room_id=eq.${room.id}`,
      }, (payload) => {
        setTurns(prev => prev.map(t => t.id === payload.new.id ? payload.new : t))
      })
      .subscribe()

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [room?.id, roomCode, role, navigate])

  const handleTimeout = async () => {
    if (room.current_turn === role && room.status === 'active') {
      await supabase.from('atlas_rooms').update({
        status: 'complete',
        winner: role === 'host' ? 'guesser' : 'host',
        loss_reason: 'timeout'
      }).eq('id', room.id)
    }
  }

  const handlePlaceSubmit = async (placeName) => {
    if (room.current_turn !== role || isChecking) return

    setIsChecking(true)

    const normalizedNew = placeName.trim().toLowerCase()
    const isRepeat = turns.some(t => t.place_name.toLowerCase() === normalizedNew)
    
    if (isRepeat) {
      await supabase.from('atlas_turns').insert({
        room_id: room.id,
        player: role,
        place_name: placeName,
        is_valid: false,
        turn_number: turns.length + 1
      })
      await supabase.from('atlas_rooms').update({
        status: 'complete',
        winner: role === 'host' ? 'guesser' : 'host',
        loss_reason: 'repeat'
      }).eq('id', room.id)
      setIsChecking(false)
      return
    }

    const { data: insertedTurn } = await supabase.from('atlas_turns').insert({
      room_id: room.id,
      player: role,
      place_name: placeName,
      is_valid: null,
      turn_number: turns.length + 1
    }).select().single()

    const isValid = await validatePlace(placeName)

    await supabase.from('atlas_turns').update({
      is_valid: isValid
    }).eq('id', insertedTurn.id)

    if (isValid) {
       await supabase.from('atlas_rooms').update({
          current_turn: role === 'host' ? 'guesser' : 'host'
       }).eq('id', room.id)
    } else {
       await supabase.from('atlas_rooms').update({
          status: 'complete',
          winner: role === 'host' ? 'guesser' : 'host',
          loss_reason: 'invalid'
       }).eq('id', room.id)
    }

    setIsChecking(false)
  }

  if (loading) return <div className="min-h-dvh flex items-center justify-center text-accent"><motion.div animate={{rotate:360}} transition={{repeat:Infinity, duration:1}}>◌</motion.div></div>
  if (error) return <div className="min-h-dvh flex items-center justify-center text-accent-hot font-bold">{error}</div>

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full h-full"
    >
      <AtlasBoard 
        room={room} 
        turns={turns} 
        role={role} 
        onPlaceSubmit={handlePlaceSubmit} 
        onTimeout={handleTimeout}
        isChecking={isChecking}
      />
    </motion.div>
  )
}
