import { BrowserRouter, Route, Routes } from 'react-router'
import { AppProvider } from './store/AppStore'
import Layout from './components/Layout'
import History from './pages/History'
import Home from './pages/Home'
import NewGame from './pages/NewGame'
import Players from './pages/Players'
import Scoreboard from './pages/Scoreboard'
import Settings from './pages/Settings'

function App() {
  return (
    <AppProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/players" element={<Players />} />
            <Route path="/games/new" element={<NewGame />} />
            <Route path="/games/:gameId" element={<Scoreboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}

export default App
