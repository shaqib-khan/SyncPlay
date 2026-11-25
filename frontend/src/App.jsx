import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Home from './pages/Home.jsx'
import CreateRoom from './pages/CreateRoom.jsx'
import JoinRoom from './pages/JoinRoom.jsx'
import WatchRoom from './pages/WatchRoom.jsx'
import SearchPage from './pages/SearchPage.jsx'
import MyRooms from './pages/MyRooms.jsx'
import Watchlist from './pages/Watchlist.jsx'
import Settings from './pages/Settings.jsx'
import NotFound from './pages/NotFound.jsx'
import Navbar from './components/Navbar.jsx'

function App() {
  const location = useLocation()
  const isRoomActive = location.pathname.startsWith('/room/')

  return (
    <div className="min-h-screen bg-[#111111] text-[#FFFFFF] flex flex-col">
      {/* Top GroupTube-Inspired Header (Hidden in full watch room) */}
      {!isRoomActive && <Navbar />}

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: isRoomActive ? 0 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isRoomActive ? 0 : -4 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="w-full h-full min-h-[calc(100vh-64px)]"
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/create" element={<CreateRoom />} />
              <Route path="/join" element={<JoinRoom />} />
              <Route path="/join/:roomCode" element={<JoinRoom />} />
              <Route path="/my-rooms" element={<MyRooms />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/room/:roomId" element={<WatchRoom />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
