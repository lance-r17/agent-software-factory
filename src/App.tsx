import { Route, Routes } from 'react-router'
import Home from './pages/Home'
import MiniSweAgent from './pages/MiniSweAgent'
import OpenHandsAgentCanvas from './pages/OpenHandsAgentCanvas'
import SweAgent from './pages/SweAgent'
import MiniSweAgentEn from './pages/MiniSweAgentEn'
import OpenHandsAgentCanvasEn from './pages/OpenHandsAgentCanvasEn'
import SweAgentEn from './pages/SweAgentEn'
import NotFound from './pages/NotFound'

export default function App() {
  return <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/solutions/mini-swe-agent" element={<MiniSweAgent />} />
    <Route path="/solutions/openhands-agent-canvas" element={<OpenHandsAgentCanvas />} />
    <Route path="/solutions/swe-agent" element={<SweAgent />} />
    <Route path="/en" element={<Home locale="en" />} />
    <Route path="/en/solutions/mini-swe-agent" element={<MiniSweAgentEn />} />
    <Route path="/en/solutions/openhands-agent-canvas" element={<OpenHandsAgentCanvasEn />} />
    <Route path="/en/solutions/swe-agent" element={<SweAgentEn />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
}
