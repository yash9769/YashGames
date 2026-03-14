import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import RoomCreate from './components/RoomCreate.jsx'
import RoomJoin from './components/RoomJoin.jsx'
import GameBoard from './components/GameBoard.jsx'
import Victory from './pages/Victory.jsx'

import AtlasGame from './pages/AtlasGame.jsx'
import AtlasResult from './pages/AtlasResult.jsx'

export default function App() {
  return (
    <div className="min-h-dvh flex flex-col bg-background font-body text-white selection:bg-accent/40 selection:text-white">
      {/* Background glow effects */}
      <div className="fixed top-0 left-0 w-full h-96 bg-accent-hot/10 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
      <div className="fixed bottom-0 right-0 w-full h-96 bg-accent/20 blur-[150px] rounded-full pointer-events-none translate-y-1/3 translate-x-1/3" />
      
      <main className="flex-grow flex flex-col relative z-10 w-full max-w-md mx-auto relative overflow-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:roomCode" element={<GameBoard />} />
          <Route path="/game/:roomCode/victory" element={<Victory />} />
          
          <Route path="/atlas/game/:roomCode" element={<AtlasGame />} />
          <Route path="/atlas/result/:roomCode" element={<AtlasResult />} />
        </Routes>
      </main>
    </div>
  )
}
