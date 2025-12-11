
// frontend/src/pages/DeliveryDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  LogOut,
  Package,
  CheckCircle,
  MapPin,
  Clock,
} from "lucide-react";
import client from "../api/client";

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("customer");
    if (!stored) {
      navigate("/login");
      return;
    }

    const user = JSON.parse(stored);

    // allow role "driver" or "delivery"
    if (user.role !== "driver" && user.role !== "delivery") {
      alert("Access denied. Delivery role required.");
      navigate("/login");
      return;
    }

    setDelivery(user);
    loadOrders();
  }, [navigate]);

  const mapStatus = (backendStatus) => {
    const statusMap = {
      "Ready for Delivery": "ready",
      "Out for Delivery": "delivering",
    };
    return statusMap[backendStatus] || "ready";
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await client.get("/delivery/orders");
      console.log("✅ Delivery orders:", res.data);

      const mappedOrders = res.data.map((order) => ({
        id: order.order_id,
        customer:
          order.customer_name || `Customer #${order.customer_id || "N/A"}`,
        address: order.delivered_to,
        phone: order.phone || "N/A",
        status: mapStatus(order.delivery_status),
        total: Number(order.total_price),
      }));

      setOrders(mappedOrders);
    } catch (error) {
      console.error("❌ Failed to load delivery orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePickup = async (id) => {
    try {
      await client.post(`/delivery/orders/${id}/pickup`);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, status: "delivering" } : o
        )
      );
      alert("Order picked up and marked as out for delivery!");
    } catch (error) {
      console.error("Failed to pick up order:", error);
      alert("Failed to pick up order. Please try again.");
    }
  };

  const handleDeliver = async (id) => {
    try {
      await client.post(`/delivery/orders/${id}/deliver`);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      alert("Order marked as delivered!");
    } catch (error) {
      console.error("Failed to deliver order:", error);
      alert("Failed to deliver order. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("customer");
    navigate("/login");
  };

  if (!delivery) {
    return (
      <div className="page-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-center">
        <p>Loading orders...</p>
      </div>
    );
  }

  const ready = orders.filter((o) => o.status === "ready");
  const delivering = orders.filter((o) => o.status === "delivering");

  return (
    <div className="page">
      {/* Header */}
      <div className="navbar">
        <div className="flex gap-md">
          <div className="brand-logo-sm">
            <Truck size={22} />
          </div>
          <span className="brand-name">DELIVERY PORTAL</span>
        </div>
        <div className="flex gap-md">
          <span className="text-muted">Welcome, {delivery.name}</span>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: "120px" }}>
        {/* Ready for Pickup */}
        <div className="card card-sm mb-3">
          <h3 className="title-md mb-3">
            Ready for Pickup ({ready.length})
          </h3>
          {ready.length === 0 ? (
            <p
              className="text-muted text-center"
              style={{ padding: "40px" }}
            >
              No orders ready for pickup
            </p>
          ) : (
            <div className="grid grid-2">
              {ready.map((order) => (
                <div
                  key={order.id}
                  className="card card-compact"
                  style={{ background: "rgba(34, 197, 94, 0.05)" }}
                >
                  <div className="flex-between mb-2">
                    <h4 className="title-md" style={{ margin: 0 }}>
                      Order #{order.id}
                    </h4>
                    <span className="badge badge-success">
                      <Package size={14} /> Ready
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "5px 0",
                      fontWeight: "500",
                    }}
                  >
                    {order.customer}
                  </p>
                  <div
                    className="flex gap-sm"
                    style={{ margin: "5px 0", color: "#78716c" }}
                  >
                    <MapPin size={16} />
                    <span className="text-small">{order.address}</span>
                  </div>
                  <p
                    className="text-small text-muted"
                    style={{ margin: "5px 0" }}
                  >
                    📞 {order.phone}
                  </p>
                  <p className="menu-price" style={{ margin: "10px 0" }}>
                    ${order.total.toFixed(2)}
                  </p>
                  <button
                    className="btn btn-primary w-full"
                    onClick={() => handlePickup(order.id)}
                  >
                    <Truck size={16} /> Pick Up Order
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Out for Delivery */}
        <div className="card card-sm">
          <h3 className="title-md mb-3">
            Out for Delivery ({delivering.length})
          </h3>
          {delivering.length === 0 ? (
            <p
              className="text-muted text-center"
              style={{ padding: "40px" }}
            >
              No active deliveries
            </p>
          ) : (
            <div className="grid grid-2">
              {delivering.map((order) => (
                <div
                  key={order.id}
                  className="card card-compact"
                  style={{ background: "rgba(249, 115, 22, 0.05)" }}
                >
                  <div className="flex-between mb-2">
                    <h4 className="title-md" style={{ margin: 0 }}>
                      Order #{order.id}
                    </h4>
                    <span className="badge badge-warning">
                      <Clock size={14} /> Delivering
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "5px 0",
                      fontWeight: "500",
                    }}
                  >
                    {order.customer}
                  </p>
                  <div
                    className="flex gap-sm"
                    style={{ margin: "5px 0", color: "#78716c" }}
                  >
                    <MapPin size={16} />
                    <span className="text-small">{order.address}</span>
                  </div>
                  <p
                    className="text-small text-muted"
                    style={{ margin: "5px 0" }}
                  >
                    📞 {order.phone}
                  </p>
                  <p className="menu-price" style={{ margin: "10px 0" }}>
                    ${order.total.toFixed(2)}
                  </p>
                  <button
                    className="btn btn-success w-full"
                    onClick={() => handleDeliver(order.id)}
                  >
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
