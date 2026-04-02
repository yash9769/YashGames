import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import ScribbleCanvas from './ScribbleCanvas.jsx'
import ScribbleToolbar from './ScribbleToolbar.jsx'

export default function ScribbleBoard({ room, messages, role, channel, onMessageSubmit, onTimeout, isChecking }) {
  const [chatInput, setChatInput] = useState('')
  const messagesEndRef = useRef(null)
  const canvasRef = useRef(null)

  // Drawing tools state
  const [activeColor, setActiveColor] = useState('#000000')
  const [activeSize, setActiveSize] = useState(12)
  const [activeTool, setActiveTool] = useState('brush') // 'brush' or 'fill'
  
  const isDrawer = room?.drawer === role

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!chatInput.trim() || isChecking) return
    onMessageSubmit(chatInput.trim())
    setChatInput('')
  }

  const [timeLeft, setTimeLeft] = useState(120)

  useEffect(() => {
    if (room?.status !== 'active') return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          onTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [room?.status, onTimeout])

  // Dummy player generation for the sidebar since we don't have a full player table in the current schema
  const players = [
    { name: 'Host', isDrawer: room?.drawer === 'host', points: isDrawer && room?.status === 'complete' ? 100 : 0, avatarId: 1, isYou: role === 'host' },
    { name: 'Guesser', isDrawer: room?.drawer === 'guesser', points: !isDrawer && room?.status === 'complete' ? 100 : 0, avatarId: 2, isYou: role === 'guesser' }
  ]

  return (
    <div className="flex flex-col min-h-dvh max-h-dvh overflow-hidden w-full relative" style={{ backgroundColor: '#2A4B9B' }}>
      
      {/* Skribbl CSS pattern background simulation */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #FFFFFF 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Main Container */}
      <div className="flex-1 w-full max-w-[1200px] mx-auto p-4 flex flex-col gap-4 relative z-10 h-full">
        
        {/* Header Bar */}
        <div className="bg-white border-4 border-black border-b-[8px] rounded-lg p-2 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 border-4 border-black rounded-full bg-white flex items-center justify-center font-bold text-xl relative -ml-6 -mt-6">
              ⏰
              <div className="absolute -bottom-2 -right-2 bg-white border-2 border-black rounded-full w-8 h-8 flex items-center justify-center text-xs">
                {room?.status === 'active' ? timeLeft : '--'}
              </div>
            </div>
            <div className="font-bold text-lg font-sans ml-4 uppercase tracking-wide">
              Round 1 of 3
            </div>
          </div>
          
          <div className="text-center">
             <div className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">
                {room?.status === 'waiting' ? 'Waiting' : isDrawer ? 'Draw This' : 'Guess This'}
             </div>
             <div className="text-2xl font-mono font-bold tracking-[0.4em] text-black">
                {room?.status === 'waiting' ? '---' : 
                 (isDrawer || room?.status === 'complete' ? room?.current_word : room?.current_word.replace(/[A-Za-z0-9]/g, '_ '))}
             </div>
          </div>

          <div className="w-12 h-12 flex items-center justify-center text-2xl font-bold">
            ⚙️
          </div>
        </div>

        {/* Responsive Layout: Vertical on mobile, 3-column on desktop (md+) */}
        <div className="flex-1 flex flex-col md:flex-row gap-2 min-h-0 relative overflow-y-auto md:overflow-hidden custom-scrollbar">
           
           {/* Player List: Horizontal row on mobile, Left Sidebar on desktop */}
           <div className="flex shrink-0 gap-1 overflow-x-auto md:overflow-y-auto pb-2 md:pb-0 md:flex-col md:w-56 custom-scrollbar">
              {players.map((p, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-2 p-2 rounded border-2 border-black shrink-0 w-40 md:w-full ${p.isYou ? 'bg-blue-100' : 'bg-green-400'} shadow-[2px_2px_0px_#000] md:shadow-none`}
                >
                   <div className="text-xs md:text-sm font-bold w-4 md:w-6 shrink-0 text-right">#{idx + 1}</div>
                   <div className="flex-1 min-w-0">
                      <div className={`font-bold text-xs md:text-sm truncate ${p.isYou ? 'text-blue-700' : 'text-black'}`}>
                        {p.name} {p.isYou && '(You)'}
                      </div>
                      <div className="text-[10px] md:text-xs">{p.points} points</div>
                   </div>
                   {p.isDrawer && (
                      <div className="shrink-0 text-lg md:text-xl" title="Drawing">✏️</div>
                   )}
                   <div className="w-8 h-8 md:w-10 md:h-10 border-2 border-black bg-white rounded-md flex shrink-0 items-center justify-center text-lg md:text-xl overflow-hidden shadow-[inset_0_-4px_rgba(0,0,0,0.1)]">
                      {p.avatarId === 1 ? '😎' : '🤓'}
                   </div>
                </div>
              ))}
           </div>

           {/* Center Area: Canvas + Toolbars */}
           <div className="flex-1 min-w-0 flex flex-col items-center">
              <div className="w-full aspect-square md:flex-1 bg-white border-4 border-black relative overflow-hidden flex items-center justify-center shadow-[4px_4px_0px_#000]">
                 {room?.status === 'waiting' && isDrawer && (
                    <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center pointer-events-none p-4 text-center">
                       <span className="bg-black text-white px-4 py-2 font-bold font-sans text-lg md:text-xl rounded">Waiting for players...</span>
                    </div>
                 )}
                 <ScribbleCanvas 
                    ref={canvasRef}
                    isDrawer={isDrawer && room?.status === 'active'} 
                    channel={channel} 
                    activeColor={activeColor}
                    activeSize={activeSize}
                    activeTool={activeTool}
                 />
              </div>

              {/* Toolbar: Only for drawers */}
              {isDrawer && (
                 <div className="w-full mt-2 shrink-0">
                    <ScribbleToolbar 
                       activeColor={activeColor} setActiveColor={setActiveColor}
                       activeSize={activeSize} setActiveSize={setActiveSize}
                       activeTool={activeTool} setActiveTool={setActiveTool}
                       onUndo={() => canvasRef.current?.undo()}
                       onClear={() => canvasRef.current?.clear()}
                    />
                 </div>
              )}
           </div>

           {/* Chat: Below center area on mobile, Right Sidebar on desktop */}
           <div className="w-full md:w-72 mt-2 md:mt-0 bg-white border-4 border-black flex flex-col shrink-0 md:shrink h-64 md:h-full shadow-[4px_4px_0px_#000] md:shadow-none">
              <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-1 custom-scrollbar text-sm font-sans font-bold bg-white">
                 {messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-4 text-xs italic">Chat empty.</div>
                 ) : (
                    messages.map((msg, i) => {
                       if (msg.is_correct) {
                          return (
                             <div key={msg.id} className="bg-green-100 text-green-600 px-2 py-1 rounded border-b border-green-200">
                                {msg.player} {msg.player === role ? '(You)' : ''} guessed the word!
                             </div>
                          )
                       }

                       const bgClass = i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                       
                       return (
                          <div key={msg.id} className={`${bgClass} px-2 py-0.5 md:py-1 rounded break-words border-b border-gray-100`}>
                             <span className={msg.player === role ? 'text-blue-600' : 'text-black'}>
                                {msg.player}: 
                             </span>
                             <span className="font-normal text-black ml-1">
                                {msg.message}
                             </span>
                          </div>
                       )
                    })
                 )}
                 <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSubmit} className="border-t-2 border-black shrink-0">
                 <input 
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder={isDrawer ? "You are drawing..." : room?.status === 'waiting' ? "Waiting..." : "Type your guess..."}
                    disabled={isChecking || isDrawer || room?.status === 'waiting'}
                    maxLength={100}
                    autoComplete="off"
                    className="w-full p-2 outline-none font-sans text-sm font-bold placeholder:font-normal placeholder:text-gray-400 disabled:bg-gray-100"
                 />
              </form>
           </div>
           
        </div>
      </div>
    </div>
  )
}
