import { Routes, Route } from 'react-router-dom'
import { Home, Dictionary, Quiz, Settings, Info } from './pages'

function App() {
  return (
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dictionary" element={<Dictionary />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/info" element={<Info />} />
    </Routes>
  )
}

export default App
