import { Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';
import MenuPage from "./pages/MenuPage.jsx"; 
import PublicHomePage from './pages/PublicHomePage.jsx';

// Upstream imports
import OrderCheckout from './pages/OrderCheckout.jsx';
import Wallet from './pages/Wallet.jsx';
import Chat from './pages/ai_chat.jsx';
import Feedback from './pages/feedback.jsx';
import ManagerDashboard from "./pages/ManagerDash.jsx";
import ChefDashboard from "./pages/ChefDashboard.jsx";
import DeliveryDashboard from "./pages/DeliveryDashboard.jsx";

// OrderHistory import
import OrderHistory from "./pages/OrderHistory.jsx";

function OrderHistoryWrapper() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("customer");
    if (!stored) {
      navigate("/login");
      return;
    }
    setCustomer(JSON.parse(stored));
    fetchOrders();
  }, [navigate]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders/history');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Demo data fallback
      setOrders([
        {
          id: 1,
          date: "2024-12-08T14:30:00",
          status: "delivered",
          total: 45.99,
          rating: 0,
          deliveryRating: 0,
          items: [
            { name: "Classic Cheeseburger", quantity: 2, price: 12.99, image: "https://images.unsplash.com/photo-1722125680299-783f98369451" },
            { name: "Fries", quantity: 1, price: 4.99, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877" }
          ]
        },
        {
          id: 2,
          date: "2024-12-07T11:20:00",
          status: "delivered",
          total: 24.98,
          rating: 5,
          deliveryRating: 4,
          items: [
            { name: "Margherita Pizza", quantity: 1, price: 14.99, image: "https://images.unsplash.com/photo-1667422542005-eb6909ac24c2" },
            { name: "Caesar Salad", quantity: 1, price: 9.99, image: "https://images.unsplash.com/photo-1651352650142-385087834d9d" }
          ]
        }
      ]);
    } finally {
      setLoading(false);
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
      // Still update locally in demo mode
      setOrders(prev =>
        prev.map(order =>
          order.id === orderId
            ? { ...order, rating: foodRating, deliveryRating }
            : order
        )
      );
    }
  };

  if (loading) {
    return <div className="page-center"><p>Loading orders...</p></div>;
  }

  return (
    <OrderHistory
      orders={orders}
      updateRating={updateRating}
      onBackToMenu={() => navigate('/customer')}
    />
  );
}

export default function App() {
  return (
    <Routes>
      {/* PUBLIC LANDING PAGE */}
      <Route path="/" element={<PublicHomePage />} />
      
      {/* PUBLIC ROUTES - Visitors can access */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/chat" element={<Chat />} />
      
      {/* AUTHENTICATED ROUTES - Customers only */}
      <Route path="/customer" element={<CustomerDashboard />} />
      <Route path="/checkout" element={<OrderCheckout />} />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="/feedback" element={<Feedback />} />
      <Route path="/orders" element={<OrderHistoryWrapper />} />
      
      {/* EMPLOYEE ROUTES */}
      <Route path="/manager" element={<ManagerDashboard />} />
      <Route path="/chef" element={<ChefDashboard />} />
      <Route path="/delivery" element={<DeliveryDashboard />} />
    </Routes>
  );
}
