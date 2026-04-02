import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient.js'
import ScribbleBoard from '../components/ScribbleBoard.jsx'

export default function ScribbleGame() {
  const { roomCode } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const role = searchParams.get('role') || 'guesser'
  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isChecking, setIsChecking] = useState(false)
  const [channel, setChannel] = useState(null)

  const dbChannelRef = useRef(null)

  const fetchGameState = useCallback(async () => {
    const { data: dbRoom, error: roomErr } = await supabase
      .from('scribble_rooms')
      .select('*')
      .eq('room_code', roomCode.toUpperCase())
      .single()

    if (roomErr || !dbRoom) {
      setError('Room not found.')
      setLoading(false)
      return
    }

    setRoom(dbRoom)

    const { data: dbChat } = await supabase
      .from('scribble_chat')
      .select('*')
      .eq('room_id', dbRoom.id)
      .order('created_at', { ascending: true })

    setMessages(dbChat || [])

    // Setup the ephemeral broadcast channel for drawing
    const drawChannel = supabase.channel(`scribble_draw_${dbRoom.id}`, {
      config: {
        broadcast: { ack: false },
      },
    })
    
    drawChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
         setChannel(drawChannel)
         // If we're the guesser and just joined, the room is active!
         if (dbRoom.status === 'waiting' && role === 'guesser') {
             supabase.from('scribble_rooms').update({ status: 'active' }).eq('id', dbRoom.id).then()
         }
      }
    })

    setLoading(false)

    if (dbRoom.status === 'complete') {
      navigate(`/scribble/result/${dbRoom.room_code}?role=${role}`, { replace: true })
    }
  }, [roomCode, role, navigate])

  useEffect(() => {
    fetchGameState()
    
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [fetchGameState]) // deliberately avoiding channel in deps to prevent loop

  useEffect(() => {
    if (!room) return

    dbChannelRef.current = supabase
      .channel(`scribble_db_${room.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'scribble_rooms',
        filter: `id=eq.${room.id}`,
      }, (payload) => {
        setRoom(payload.new)
        if (payload.new.status === 'complete') {
          setTimeout(() => navigate(`/scribble/result/${room.room_code}?role=${role}`, { replace: true }), 1500)
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'scribble_chat',
        filter: `room_id=eq.${room.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
        // If someone guessed correctly via realtime, and we are not the one checking, do nothing as DB will update room.
      })
      .subscribe()

    return () => {
      if (dbChannelRef.current) supabase.removeChannel(dbChannelRef.current)
    }
  }, [room?.id, roomCode, role, navigate])

  const handleTimeout = async () => {
    // Only host triggers timeout
    if (role === 'host' && room?.status === 'active') {
      await supabase.from('scribble_rooms').update({
        status: 'complete',
        winner: 'time_up'
      }).eq('id', room.id)
    }
  }

  const handleMessageSubmit = async (message) => {
    if (room.drawer === role || isChecking || room.status !== 'active') return

    setIsChecking(true)
    
    const isCorrect = message.toLowerCase().trim() === room.current_word.toLowerCase().trim()

    await supabase.from('scribble_chat').insert({
      room_id: room.id,
      player: role,
      message: message,
      is_correct: isCorrect
    })

    if (isCorrect) {
       await supabase.from('scribble_rooms').update({
          status: 'complete',
          winner: role
       }).eq('id', room.id)
    }

    setIsChecking(false)
  }

  if (loading) return <div className="min-h-dvh flex items-center justify-center text-[#F2BEAC]"><motion.div animate={{rotate:360}} transition={{repeat:Infinity, duration:1}}>◌</motion.div></div>
  if (error) return <div className="min-h-dvh flex items-center justify-center text-accent-hot font-bold">{error}</div>

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full h-full"
    >
      <ScribbleBoard 
        room={room} 
        messages={messages} 
        role={role} 
        channel={channel}
        onMessageSubmit={handleMessageSubmit} 
        onTimeout={handleTimeout}
        isChecking={isChecking}
      />
    </motion.div>
  )
}
