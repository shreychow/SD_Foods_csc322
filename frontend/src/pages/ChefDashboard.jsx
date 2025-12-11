// frontend/src/pages/ChefDashboard.jsx - COMPLETE FINAL VERSION
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChefHat,
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  UtensilsCrossed,
  AlertTriangle,
  DollarSign,
  ThumbsUp,
  ThumbsDown,
  Star,
  MessageSquare,
  Package,
} from "lucide-react";
import client from "../api/client";

export default function ChefDashboard() {
  const navigate = useNavigate();
  const [chef, setChef] = useState(null);
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [warningDismissed, setWarningDismissed] = useState(false);

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
    const chefId = user.user_id || user.id;
    loadOrders();
    loadProfile(chefId);
  }, [navigate]);

  const loadProfile = async (chefId) => {
    try {
      const res = await client.get(`/chef/profile/${chefId}`);
      setProfile(res.data);
    } catch (error) {
      console.error("Failed to load chef profile:", error);
    }
  };

  const mapStatus = (backendStatus) => {
    const statusMap = {
      Pending: "pending",
      Confirmed: "pending",
      Preparing: "preparing",
    };
    return statusMap[backendStatus] || "pending";
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await client.get("/chef/orders");

      const mappedOrders = res.data.map((order) => ({
        id: order.order_id,
        customer: order.customer_name || `Customer #${order.customer_id}`,
        items: order.items
          ? order.items.map((item) => `${item.name} x${item.quantity}`)
          : [],
        status: mapStatus(order.delivery_status),
        total: parseFloat(order.total_price),
      }));

      setOrders(mappedOrders);
    } catch (error) {
      console.error("Failed to load chef orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      const chefId = chef.user_id || chef.id;
      await client.post(`/chef/orders/${id}/accept`, {
        chef_id: chefId, // ⭐ Send chef_id
      });
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

  if (!chef) {
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

  const pending = orders.filter((o) => o.status === "pending");
  const preparing = orders.filter((o) => o.status === "preparing");
  const warnings = chef.amount_warnings || 0;

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
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate("/feedback")}
          >
            <MessageSquare size={16} /> Feedback
          </button>
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
        {/* Warnings Alert - Dismissible */}
        {warnings > 0 && !warningDismissed && (
          <div
            className="alert mb-3"
            style={{
              position: "relative",
              background:
                warnings >= 3
                  ? "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))"
                  : "linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(251, 146, 60, 0.05))",
              border: warnings >= 3 ? "2px solid #ef4444" : "2px solid #f97316",
            }}
          >
            <AlertTriangle
              size={20}
              style={{ color: warnings >= 3 ? "#ef4444" : "#f97316" }}
            />
            <div style={{ flex: 1 }}>
              <strong>Warning:</strong> You have {warnings} warning
              {warnings > 1 ? "s" : ""}. {warnings >= 3 && " Your account is at risk!"}
            </div>
            <button
              onClick={() => setWarningDismissed(true)}
              className="btn btn-ghost btn-sm"
              style={{ minWidth: "auto", padding: "4px" }}
            >
              <XCircle size={18} />
            </button>
          </div>
        )}

        {/* Profile Stats */}
        {profile && (
          <div className="grid grid-4 mb-3">
            <div className="card card-compact text-center">
              <DollarSign
                size={32}
                style={{ color: "#22c55e", margin: "0 auto 10px" }}
              />
              <h3 className="title-lg">${profile.salary.toFixed(2)}</h3>
              <p className="text-small text-muted">Salary</p>
            </div>
            <div className="card card-compact text-center">
              <Package
                size={32}
                style={{ color: "#3b82f6", margin: "0 auto 10px" }}
              />
              <h3 className="title-lg">{profile.dishes_prepared}</h3>
              <p className="text-small text-muted">Dishes Prepared</p>
            </div>
            <div className="card card-compact text-center">
              <ThumbsUp
                size={32}
                style={{ color: "#22c55e", margin: "0 auto 10px" }}
              />
              <h3 className="title-lg">{profile.compliments}</h3>
              <p className="text-small text-muted">Compliments</p>
            </div>
            <div className="card card-compact text-center">
              <ThumbsDown
                size={32}
                style={{ color: "#ef4444", margin: "0 auto 10px" }}
              />
              <h3 className="title-lg">{profile.complaints}</h3>
              <p className="text-small text-muted">Complaints</p>
            </div>
          </div>
        )}

        {/* Average Rating Banner */}
        {profile && profile.avg_rating > 0 && (
          <div
            className="alert mb-3"
            style={{
              background:
                profile.avg_rating >= 4
                  ? "linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))"
                  : profile.avg_rating < 2
                  ? "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))"
                  : "linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(251, 146, 60, 0.05))",
              border:
                profile.avg_rating >= 4
                  ? "2px solid #22c55e"
                  : profile.avg_rating < 2
                  ? "2px solid #ef4444"
                  : "2px solid #f97316",
            }}
          >
            <Star
              size={20}
              style={{
                fill: "#facc15",
                color: "#facc15",
              }}
            />
            <div>
              <strong>Average Rating:</strong> {profile.avg_rating}/5 stars
              {profile.avg_rating >= 4 && " - Excellent work! Keep it up! 🌟"}
              {profile.avg_rating < 2 &&
                " - Please improve quality to avoid demotion"}
            </div>
          </div>
        )}

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
                  <p style={{ margin: "0 0 10px 0", fontWeight: "500" }}>
                    Customer: {order.customer}
                  </p>
                  <p className="menu-price" style={{ margin: "0 0 10px 0" }}>
                    ${order.total.toFixed(2)}
                  </p>
                  <div style={{ marginBottom: "10px" }}>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="badge" style={{ margin: "2px" }}>
                        {item}
                      </div>
                    ))}
                  </div>
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
                  <p style={{ margin: "0 0 10px 0", fontWeight: "500" }}>
                    Customer: {order.customer}
                  </p>
                  <p className="menu-price" style={{ margin: "0 0 10px 0" }}>
                    ${order.total.toFixed(2)}
                  </p>
                  <div style={{ marginBottom: "10px" }}>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="badge" style={{ margin: "2px" }}>
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