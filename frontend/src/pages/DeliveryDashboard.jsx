import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, LogOut, Package, CheckCircle, MapPin, Clock } from "lucide-react";
import client from "../api/client";

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("customer");
    if (!stored) {
      navigate("/login");
      return;
    }
    const user = JSON.parse(stored);
    if (user.role !== "delivery") {
      alert("Access denied. Delivery role required.");
      navigate("/login");
      return;
    }
    setDelivery(user);
    loadOrders();
  }, [navigate]);

  const loadOrders = async () => {
    try {
      const res = await client.get("/delivery/orders");
      setOrders(res.data);
    } catch (error) {
      // Demo data
      setOrders([
        { id: 1, customer: "John Doe", address: "123 Main St, Apt 4B", phone: "555-0101", status: "ready", total: 45.99 },
        { id: 2, customer: "Jane Smith", address: "456 Oak Ave", phone: "555-0102", status: "ready", total: 67.50 },
        { id: 3, customer: "Mike Johnson", address: "789 Pine Rd", phone: "555-0103", status: "delivering", total: 32.99 },
      ]);
    }
  };

  const handlePickup = async (id) => {
    try {
      await client.post(`/delivery/orders/${id}/pickup`);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "delivering" } : o));
      alert("Order picked up!");
    } catch (error) {
      alert("Order picked up! (Demo)");
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "delivering" } : o));
    }
  };

  const handleDeliver = async (id) => {
    try {
      await client.post(`/delivery/orders/${id}/deliver`);
      setOrders(prev => prev.filter(o => o.id !== id));
      alert("Order delivered!");
    } catch (error) {
      alert("Order delivered! (Demo)");
      setOrders(prev => prev.filter(o => o.id !== id));
    }
  };

  if (!delivery) return <div>Loading...</div>;

  const ready = orders.filter(o => o.status === "ready");
  const delivering = orders.filter(o => o.status === "delivering");

  return (
    <div className="page">
      {/* Header */}
      <div className="navbar">
        <div className="flex gap-md">
          <div className="brand-logo-sm"><Truck size={22} /></div>
          <span className="brand-name">DELIVERY PORTAL</span>
        </div>
        <button onClick={() => { localStorage.removeItem("customer"); navigate("/login"); }} className="btn btn-ghost btn-sm">
          <LogOut size={14} /> Logout
        </button>
      </div>

      <div className="container" style={{ paddingTop: "120px" }}>
        {/* Ready for Pickup */}
        <div className="card card-sm mb-3">
          <h3 className="title-md mb-3">Ready for Pickup ({ready.length})</h3>
          {ready.length === 0 ? (
            <p className="text-muted text-center" style={{ padding: "40px" }}>No orders ready</p>
          ) : (
            <div className="grid grid-2">
              {ready.map(order => (
                <div key={order.id} className="card card-compact" style={{ background: "rgba(34, 197, 94, 0.05)" }}>
                  <div className="flex-between mb-2">
                    <h4 className="title-md" style={{ margin: 0 }}>Order #{order.id}</h4>
                    <span className="badge badge-success"><Package size={14} /> Ready</span>
                  </div>
                  <p style={{ margin: "5px 0", fontWeight: "500" }}>{order.customer}</p>
                  <div className="flex gap-sm" style={{ margin: "5px 0", color: "#78716c" }}>
                    <MapPin size={16} />
                    <span className="text-small">{order.address}</span>
                  </div>
                  <p className="text-small text-muted" style={{ margin: "5px 0" }}>📞 {order.phone}</p>
                  <p className="menu-price" style={{ margin: "10px 0" }}>${order.total.toFixed(2)}</p>
                  <button className="btn btn-primary w-full" onClick={() => handlePickup(order.id)}>
                    <Truck size={16} /> Pick Up Order
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Out for Delivery */}
        <div className="card card-sm">
          <h3 className="title-md mb-3">Out for Delivery ({delivering.length})</h3>
          {delivering.length === 0 ? (
            <p className="text-muted text-center" style={{ padding: "40px" }}>No active deliveries</p>
          ) : (
            <div className="grid grid-2">
              {delivering.map(order => (
                <div key={order.id} className="card card-compact" style={{ background: "rgba(249, 115, 22, 0.05)" }}>
                  <div className="flex-between mb-2">
                    <h4 className="title-md" style={{ margin: 0 }}>Order #{order.id}</h4>
                    <span className="badge badge-warning"><Clock size={14} /> Delivering</span>
                  </div>
                  <p style={{ margin: "5px 0", fontWeight: "500" }}>{order.customer}</p>
                  <div className="flex gap-sm" style={{ margin: "5px 0", color: "#78716c" }}>
                    <MapPin size={16} />
                    <span className="text-small">{order.address}</span>
                  </div>
                  <p className="text-small text-muted" style={{ margin: "5px 0" }}>📞 {order.phone}</p>
                  <p className="menu-price" style={{ margin: "10px 0" }}>${order.total.toFixed(2)}</p>
                  <button className="btn btn-success w-full" onClick={() => handleDeliver(order.id)}>
                    <CheckCircle size={16} /> Mark Delivered
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}