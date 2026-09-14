import { Navigate, Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import CompaniesPage from './pages/CompaniesPage'
import MapPage from './pages/MapPage'

export default function App() {
  return (
    <div className="app">
      <main className="app__main">
        <Routes>
          <Route path="/" element={<Navigate to="/companies" replace />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="*" element={<Navigate to="/companies" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
