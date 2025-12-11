
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChefHat, LogOut, Clock, CheckCircle, XCircle, UtensilsCrossed } from "lucide-react";
import client from "../api/client";

export default function ChefDashboard() {
  const navigate = useNavigate();
  const [chef, setChef] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("customer");
    if (!stored) {
      navigate("/login");
      return;
    }
    const user = JSON.parse(stored);
    if (user.role !== "chef") {
      alert("Access denied. Chef role required.");
      navigate("/login");
      return;
    }
    setChef(user);
    loadOrders();
  }, [navigate]);

  const mapStatus = (backendStatus) => {
    const statusMap = {
      "Pending": "pending",
      "Confirmed": "pending",       // treat new orders as pending
      "Preparing": "preparing",
      "Ready": "ready",
      "Ready for Delivery": "ready",
      "Out for Delivery": "delivering",
      "Delivered": "delivered",
    };
    return statusMap[backendStatus] || "pending";
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await client.get("/chef/orders");
      console.log("✅ Chef orders:", res.data);

      const mappedOrders = res.data.map((order) => ({
        id: order.order_id,
        customer: order.customer_name || `Customer #${order.customer_id}`,
        // items from backend: [{ name, quantity }]
        items: order.items
          ? order.items.map((item) => `${item.name} x${item.quantity}`)
          : [],
        status: mapStatus(order.delivery_status),
        notes: order.notes || null,
        total: parseFloat(order.total_price),
      }));

      setOrders(mappedOrders);
    } catch (error) {
      console.error("❌ Failed to load chef orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      await client.post(`/chef/orders/${id}/accept`);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "preparing" } : o))
      );
      alert("Order accepted and marked as preparing!");
    } catch (error) {
      console.error("Failed to accept order:", error);
      alert("Failed to accept order. Please try again.");
    }
  };

  const handleComplete = async (id) => {
    try {
      await client.post(`/chef/orders/${id}/complete`);
      // remove from chef list after marking ready for delivery
      setOrders((prev) => prev.filter((o) => o.id !== id));
      alert("Order marked as ready for delivery!");
    } catch (error) {
      console.error("Failed to complete order:", error);
      alert("Failed to complete order. Please try again.");
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    try {
      await client.post(`/chef/orders/${id}/reject`, { reason });
      setOrders((prev) => prev.filter((o) => o.id !== id));
      alert("Order rejected and customer refunded!");
    } catch (error) {
      console.error("Failed to reject order:", error);
      alert("Failed to reject order. Please try again.");
    }
  };

  if (!chef) return <div className="page-center"><p>Loading...</p></div>;
  if (loading) return <div className="page-center"><p>Loading orders...</p></div>;

  const pending = orders.filter((o) => o.status === "pending");
  const preparing = orders.filter((o) => o.status === "preparing");

  return (
    <div className="page">
      {/* Header */}
      <div className="navbar">
        <div className="flex gap-md">
          <div className="brand-logo-sm">
            <ChefHat size={22} />
          </div>
          <span className="brand-name">CHEF PORTAL</span>
        </div>
        <div className="flex gap-md">
          <span className="text-muted">Welcome, {chef.name}</span>
          <button
            onClick={() => {
              localStorage.removeItem("customer");
              navigate("/login");
            }}
            className="btn btn-ghost btn-sm"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: "120px" }}>
        {/* Pending Orders */}
        <div className="card card-sm mb-3">
          <h3 className="title-md mb-3">New Orders ({pending.length})</h3>
          {pending.length === 0 ? (
            <p className="text-muted text-center" style={{ padding: "40px" }}>
              No pending orders
            </p>
          ) : (
            <div className="grid grid-2">
              {pending.map((order) => (
                <div
                  key={order.id}
                  className="card card-compact"
                  style={{ background: "rgba(59, 130, 246, 0.05)" }}
                >
                  <div className="flex-between mb-2">
                    <h4 className="title-md" style={{ margin: 0 }}>
                      Order #{order.id}
                    </h4>
                    <span className="badge">
                      <Clock size={14} /> Pending
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      fontWeight: "500",
                    }}
                  >
                    Customer: {order.customer}
                  </p>
                  <p className="menu-price" style={{ margin: "0 0 10px 0" }}>
                    ${order.total.toFixed(2)}
                  </p>
                  <div style={{ marginBottom: "10px" }}>
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="badge"
                        style={{ margin: "2px" }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                  {order.notes && (
                    <p
                      className="text-small"
                      style={{
                        background: "rgba(249, 115, 22, 0.1)",
                        padding: "8px",
                        borderRadius: "6px",
                        marginBottom: "10px",
                      }}
                    >
                      Note: {order.notes}
                    </p>
                  )}
                  <div className="flex gap-sm">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAccept(order.id)}
                    >
                      <CheckCircle size={16} /> Accept
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleReject(order.id)}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preparing Orders */}
        <div className="card card-sm">
          <h3 className="title-md mb-3">In Progress ({preparing.length})</h3>
          {preparing.length === 0 ? (
            <p className="text-muted text-center" style={{ padding: "40px" }}>
              No orders in progress
            </p>
          ) : (
            <div className="grid grid-2">
              {preparing.map((order) => (
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
                      <UtensilsCrossed size={14} /> Preparing
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "0 0 10px 0",
                      fontWeight: "500",
                    }}
                  >
                    Customer: {order.customer}
                  </p>
                  <p className="menu-price" style={{ margin: "0 0 10px 0" }}>
                    ${order.total.toFixed(2)}
                  </p>
                  <div style={{ marginBottom: "10px" }}>
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="badge"
                        style={{ margin: "2px" }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                  <button
                    className="btn btn-success w-full"
                    onClick={() => handleComplete(order.id)}
                  >
                    <CheckCircle size={16} /> Mark Ready for Delivery
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

