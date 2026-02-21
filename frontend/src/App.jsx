import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ReviewPage from './pages/ReviewPage'
import HistoryPage from './pages/HistoryPage'
import StatusPage from './pages/StatusPage'
import ComparePage from './pages/ComparePage'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/review/:id" element={<ReviewPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/status" element={<StatusPage />} />
        <Route path="/compare" element={<ComparePage />} />
      </Routes>
    </>
  )
}
