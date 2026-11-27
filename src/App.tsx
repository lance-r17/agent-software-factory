import { Route, Routes } from 'react-router'
import Home from './pages/Home'
import MiniSweAgent from './pages/MiniSweAgent'
import OpenHandsAgentCanvas from './pages/OpenHandsAgentCanvas'
import SweAgent from './pages/SweAgent'
import Agentless from './pages/Agentless'
import MetaGPT from './pages/MetaGPT'
import SweAf from './pages/SweAf'
import Omnigent from './pages/Omnigent'
import Loom from './pages/Loom'
import Ase from './pages/Ase'
import Scion from './pages/Scion'
import ArchivePage from './pages/Archive'
import NotFound from './pages/NotFound'

export default function App() {
  return <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/solutions/mini-swe-agent" element={<MiniSweAgent locale="zh" />} />
    <Route path="/solutions/openhands-agent-canvas" element={<OpenHandsAgentCanvas locale="zh" />} />
    <Route path="/solutions/swe-agent" element={<SweAgent locale="zh" />} />
    <Route path="/solutions/agentless" element={<Agentless locale="zh" />} />
    <Route path="/solutions/metagpt" element={<MetaGPT locale="zh" />} />
    <Route path="/solutions/swe-af" element={<SweAf locale="zh" />} />
    <Route path="/solutions/omnigent" element={<Omnigent locale="zh" />} />
    <Route path="/solutions/loom" element={<Loom locale="zh" />} />
    <Route path="/solutions/ase" element={<Ase locale="zh" />} />
    <Route path="/solutions/scion" element={<Scion locale="zh" />} />
    <Route path="/archive" element={<ArchivePage locale="zh" />} />
    <Route path="/en" element={<Home locale="en" />} />
    <Route path="/en/solutions/mini-swe-agent" element={<MiniSweAgent locale="en" />} />
    <Route path="/en/solutions/openhands-agent-canvas" element={<OpenHandsAgentCanvas locale="en" />} />
    <Route path="/en/solutions/swe-agent" element={<SweAgent locale="en" />} />
    <Route path="/en/solutions/agentless" element={<Agentless locale="en" />} />
    <Route path="/en/solutions/metagpt" element={<MetaGPT locale="en" />} />
    <Route path="/en/solutions/swe-af" element={<SweAf locale="en" />} />
    <Route path="/en/solutions/omnigent" element={<Omnigent locale="en" />} />
    <Route path="/en/solutions/loom" element={<Loom locale="en" />} />
    <Route path="/en/solutions/ase" element={<Ase locale="en" />} />
    <Route path="/en/solutions/scion" element={<Scion locale="en" />} />
    <Route path="/en/archive" element={<ArchivePage locale="en" />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
}
