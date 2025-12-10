import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';
import MenuPage from "./pages/MenuPage.jsx"; 

// Upstream imports
import OrderCheckout from './pages/OrderCheckout.jsx';
import Wallet from './pages/Wallet.jsx';
import Chat from './pages/ai_chat.jsx';
import Feedback from './pages/feedback.jsx';


// OrderHistory import
import OrderHistory from "./pages/OrderHistory.jsx";

function OrderHistoryWrapper() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // fetchOrders() when backend exists
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders/history');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const updateRating = async (orderId, foodRating, deliveryRating) => {
    try {
      await fetch(`/api/orders/${orderId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodRating, deliveryRating })
      });

      setOrders(prev =>
        prev.map(order =>
          order.id === orderId
            ? { ...order, rating: foodRating, deliveryRating }
            : order
        )
      );
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  return (
    <OrderHistory
      orders={orders}
      updateRating={updateRating}
      onBackToMenu={() => navigate('/menu')}
    />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/customer" element={<CustomerDashboard />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/checkout" element={<OrderCheckout />} />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/feedback" element={<Feedback />} />
      {/* Your order history route */}
      <Route path="/orders" element={<OrderHistoryWrapper />} />
    </Routes>
  );
}
