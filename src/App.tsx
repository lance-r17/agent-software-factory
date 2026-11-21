import { Route, Routes } from 'react-router'
import Home from './pages/Home'
import MiniSweAgent from './pages/MiniSweAgent'
import OpenHandsAgentCanvas from './pages/OpenHandsAgentCanvas'
import SweAgent from './pages/SweAgent'
import NotFound from './pages/NotFound'

export default function App() {
  return <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/solutions/mini-swe-agent" element={<MiniSweAgent />} />
    <Route path="/solutions/openhands-agent-canvas" element={<OpenHandsAgentCanvas />} />
    <Route path="/solutions/swe-agent" element={<SweAgent />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
}
