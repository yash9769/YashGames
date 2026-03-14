import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Home from './pages/Home.jsx'
import Game from './pages/Game.jsx'
import Victory from './pages/Victory.jsx'
import About from './pages/About.jsx'

export default function App() {
  const location = useLocation()

  return (
    <div className="gradient-bg noise min-h-dvh relative">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/game/:roomCode" element={<Game />} />
          <Route path="/victory/:roomCode" element={<Victory />} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}
