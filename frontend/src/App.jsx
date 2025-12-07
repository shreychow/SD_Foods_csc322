import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import CustomerDashboard from './pages/CustomerDashboard.jsx'
import MenuPage from "./pages/MenuPage.jsx"; 


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/customer" element={<CustomerDashboard />} />
      <Route path="/menu" element={<MenuPage />} />
    </Routes>
  )
}
