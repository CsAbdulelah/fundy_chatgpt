import { Routes, Route } from 'react-router-dom'
import './App.css'
import SideNav from './components/SideNav.jsx'
import GpBuilder from './pages/GpBuilder.jsx'
import LpForm from './pages/LpForm.jsx'
import GpReview from './pages/GpReview.jsx'
import Components from './pages/Components.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <SideNav />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<GpBuilder />} />
          <Route path="/builder" element={<GpBuilder />} />
          <Route path="/lp-form" element={<LpForm />} />
          <Route path="/review" element={<GpReview />} />
          <Route path="/components" element={<Components />} />
        </Routes>
      </main>
    </div>
  )
}
