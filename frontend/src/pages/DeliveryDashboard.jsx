// frontend/src/pages/DeliveryDashboard.jsx - WITHOUT TOP 4 STATS BOXES
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  LogOut,
  Package,
  CheckCircle,
  MapPin,
  Clock,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Award,
  MessageSquare,
} from "lucide-react";
import client from "../api/client";

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState(null);
  const [activeTab, setActiveTab] = useState("available");
  const [availableOrders, setAvailableOrders] = useState([]);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [bidAmounts, setBidAmounts] = useState({});

  useEffect(() => {
    const stored = localStorage.getItem("customer");
    if (!stored) {
      navigate("/login");
      return;
    }

    try {
      const user = JSON.parse(stored);
      console.log("👤 Logged in user:", user);

      // CRITICAL: Check role and redirect if wrong
      if (user.role === "customer") {
        console.log("User is customer, redirecting to /customer");
        navigate("/customer");
        return;
      }

      if (user.role !== "driver" && user.role !== "delivery") {
        console.error("Invalid role:", user.role);
        alert("Access denied. Delivery role required.");
        navigate("/login");
        return;
      }

      setDelivery(user);
      const driverId = user.user_id || user.id;
      console.log("🚚 Driver ID:", driverId);
      loadData(driverId);
    } catch (err) {
      console.error("Error parsing user data:", err);
      navigate("/login");
    }
  }, [navigate]);

  // AUTO-REFRESH: Reload profile every 5 seconds
  useEffect(() => {
    if (!delivery) return;

    const driverId = delivery.user_id || delivery.id;
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing profile...");
      loadProfile(driverId);
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [delivery]);

  const loadData = async (driverId) => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        loadAvailableOrders(),
        loadAssignedOrders(driverId),
        loadProfile(driverId),
      ]);
    } catch (error) {
      console.error("Failed to load data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableOrders = async () => {
    try {
      console.log("📦 Loading available orders...");
      const res = await client.get("/delivery/orders/available");
      console.log("Available orders response:", res.data);

      const orders = Array.isArray(res.data) ? res.data : [];

      const cleanOrders = orders.map((order) => ({
        ...order,
        order_id: order.order_id || 0,
        customer_name: order.customer_name || "Unknown",
        delivered_to: order.delivered_to || "No address",
        total_price: parseFloat(order.total_price) || 0,
        delivery_status: order.delivery_status || "Unknown",
        bids: Array.isArray(order.bids)
          ? order.bids.map((bid) => ({
              ...bid,
              bid_id: bid.bid_id || 0,
              driver_id: bid.driver_id || 0,
              driver_name: bid.driver_name || "Unknown Driver",
              bid_amount: parseFloat(bid.bid_amount) || 0,
              bid_status: bid.bid_status || "pending",
            }))
          : [],
      }));

      console.log("Cleaned available orders:", cleanOrders);
      setAvailableOrders(cleanOrders);
    } catch (error) {
      console.error("Failed to load available orders:", error);
      setAvailableOrders([]);
    }
  };

  const loadAssignedOrders = async (driverId) => {
    try {
      console.log("📦 Loading assigned orders for driver:", driverId);
      const res = await client.get(
        `/delivery/orders/assigned?driver_id=${driverId}`
      );
      console.log("Assigned orders response:", res.data);

      const orders = Array.isArray(res.data) ? res.data : [];

      const cleanOrders = orders.map((order) => ({
        ...order,
        order_id: order.order_id || 0,
        customer_name: order.customer_name || "Unknown",
        delivered_to: order.delivered_to || "No address",
        total_price: parseFloat(order.total_price) || 0,
        delivery_status: order.delivery_status || "Unknown",
        phone: order.phone || "No phone",
      }));

      console.log("Cleaned assigned orders:", cleanOrders);
      setAssignedOrders(cleanOrders);
    } catch (error) {
      console.error("Failed to load assigned orders:", error);
      setAssignedOrders([]);
    }
  };

  const loadProfile = async (driverId) => {
    try {
      console.log("👤 Loading profile for driver:", driverId);
      const res = await client.get(`/delivery/profile/${driverId}`);
      console.log("Profile loaded:", res.data);
      setProfile(res.data);
    } catch (error) {
      console.error("Failed to load driver profile:", error);

      // Set default profile to avoid errors
      setProfile({
        name: delivery?.name || "Driver",
        salary: 0,
        warnings: 0,
        total_deliveries: 0,
        complaints: 0,
        compliments: 0,
      });
    }
  };

  const handlePlaceBid = async (orderId) => {
    const bidAmount = bidAmounts[orderId];

    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      alert("Please enter a valid bid amount");
      return;
    }

    try {
      const driverId = delivery.user_id || delivery.id;
      console.log("💰 Placing bid:", { orderId, driverId, bidAmount });

      await client.post(`/delivery/orders/${orderId}/bid`, {
        driver_id: driverId,
        bid_amount: parseFloat(bidAmount),
      });

      console.log("Bid placed successfully!");
      alert("Bid placed successfully! Wait for manager approval.");

      setBidAmounts({ ...bidAmounts, [orderId]: "" });
      await loadAvailableOrders();
    } catch (error) {
      console.error("Failed to place bid:", error);
      alert(
        error.response?.data?.error || "Failed to place bid. Please try again."
      );
    }
  };

  const handlePickup = async (orderId) => {
    try {
      const driverId = delivery.user_id || delivery.id;
      console.log("Picking up order:", { orderId, driverId });

      await client.post(`/delivery/orders/${orderId}/pickup`, {
        driver_id: driverId,
      });

      console.log("Order picked up!");
      alert("Order picked up!");
      await loadData(driverId);
    } catch (error) {
      console.error("Failed to pick up order:", error);
      alert(error.response?.data?.error || "Failed to pick up order");
    }
  };

  const handleDeliver = async (orderId) => {
    try {
      console.log("Delivering order:", orderId);
      await client.post(`/delivery/orders/${orderId}/deliver`);

      console.log("Order delivered!");
      alert("Order delivered!");
      const driverId = delivery.user_id || delivery.id;
      await loadData(driverId);
    } catch (error) {
      console.error("Failed to deliver order:", error);
      alert("Failed to deliver order");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("customer");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="page-center">
        <div style={{ textAlign: "center" }}>
          <Truck
            size={48}
            style={{ color: "#3b82f6", marginBottom: "20px" }}
          />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-center">
        <div className="card" style={{ maxWidth: "500px", textAlign: "center" }}>
          <AlertTriangle
            size={48}
            style={{ color: "#ef4444", margin: "0 auto 20px" }}
          />
          <h3 className="title-md mb-2">Error Loading Dashboard</h3>
          <p className="text-muted mb-3">{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              const driverId = delivery?.user_id || delivery?.id;
              if (driverId) loadData(driverId);
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="page-center">
        <p>Loading user data...</p>
      </div>
    );
  }

  const warnings = delivery.amount_warnings || 0;
  const ready = assignedOrders.filter(
    (o) => o.delivery_status === "Ready for Delivery"
  );
  const delivering = assignedOrders.filter(
    (o) => o.delivery_status === "Out for Delivery"
  );

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
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate("/feedback")}
          >
            <MessageSquare size={16} /> Feedback
          </button>
          <span className="text-muted">Welcome, {delivery.name}</span>
          <button onClick={handleLogout} className="btn btn-ghost btn-sm">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: "120px" }}>
        {/* Warnings Alert */}
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
              {warnings > 1 ? "s" : ""}.
              {warnings >= 3 && " Your account is at risk!"}
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

        {/* Tabs */}
        <div className="tabs mb-3">
          <button
            className={activeTab === "available" ? "tab active" : "tab"}
            onClick={() => setActiveTab("available")}
          >
            Available Orders ({availableOrders.length})
          </button>
          <button
            className={activeTab === "assigned" ? "tab active" : "tab"}
            onClick={() => setActiveTab("assigned")}
          >
            My Deliveries ({assignedOrders.length})
          </button>
        </div>

        {/* AVAILABLE ORDERS TAB (Bidding) */}
        {activeTab === "available" && (
          <div className="card card-sm">
            <h3 className="title-md mb-3">
              <Award size={20} /> Available for Bidding (
              {availableOrders.length})
            </h3>
            {availableOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <Package
                  size={48}
                  style={{ color: "#d1d5db", margin: "0 auto 20px" }}
                />
                <p className="text-muted">No orders available for bidding</p>
                <p className="text-small text-muted">
                  Check back soon for new orders!
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                }}
              >
                {availableOrders.map((order) => {
                  const driverId = delivery.user_id || delivery.id;
                  const myBid = (order.bids || []).find(
                    (b) => b.driver_id === driverId
                  );
                  const lowestBid =
                    order.bids && order.bids.length > 0
                      ? Math.min(...order.bids.map((b) => b.bid_amount))
                      : null;

                  return (
                    <div
                      key={order.order_id}
                      className="card card-compact"
                      style={{ background: "rgba(59, 130, 246, 0.05)" }}
                    >
                      <div className="flex-between mb-2">
                        <h4 className="title-md" style={{ margin: 0 }}>
                          Order #{order.order_id}
                        </h4>
                        <span className="badge">
                          <Package size={14} /> Ready
                        </span>
                      </div>

                      <p style={{ margin: "5px 0", fontWeight: "500" }}>
                        {order.customer_name}
                      </p>

                      <div
                        className="flex gap-sm"
                        style={{ margin: "5px 0", color: "#78716c" }}
                      >
                        <MapPin size={16} />
                        <span className="text-small">{order.delivered_to}</span>
                      </div>

                      <p className="menu-price" style={{ margin: "10px 0" }}>
                        Order Total: ${order.total_price.toFixed(2)}
                      </p>

                      {/* Existing Bids */}
                      {order.bids && order.bids.length > 0 && (
                        <div
                          style={{
                            background: "rgba(249, 115, 22, 0.05)",
                            padding: "10px",
                            borderRadius: "6px",
                            marginBottom: "10px",
                          }}
                        >
                          <p
                            className="text-small"
                            style={{ margin: "0 0 5px 0" }}
                          >
                            <strong>{order.bids.length} Bid(s):</strong>
                          </p>
                          {order.bids.slice(0, 3).map((bid) => (
                            <div
                              key={bid.bid_id}
                              className="flex-between"
                              style={{ margin: "3px 0" }}
                            >
                              <span className="text-small">
                                {bid.driver_name}
                                {bid.driver_id === driverId && " (You)"}
                              </span>
                              <span
                                className="text-small"
                                style={{
                                  fontWeight:
                                    lowestBid &&
                                    bid.bid_amount === lowestBid
                                      ? "bold"
                                      : "normal",
                                  color:
                                    lowestBid &&
                                    bid.bid_amount === lowestBid
                                      ? "#22c55e"
                                      : "inherit",
                                }}
                              >
                                ${bid.bid_amount.toFixed(2)}
                                {lowestBid &&
                                  bid.bid_amount === lowestBid &&
                                  " 🏆"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Bid Input */}
                      <div className="flex gap-sm">
                        <input
                          type="number"
                          className="input"
                          placeholder="Enter bid ($)"
                          step="0.50"
                          min="0"
                          value={bidAmounts[order.order_id] || ""}
                          onChange={(e) =>
                            setBidAmounts({
                              ...bidAmounts,
                              [order.order_id]: e.target.value,
                            })
                          }
                          style={{ flex: 1 }}
                        />
                        <button
                          className="btn btn-primary"
                          onClick={() => handlePlaceBid(order.order_id)}
                        >
                          <TrendingUp size={16} />
                          {myBid ? "Update Bid" : "Place Bid"}
                        </button>
                      </div>

                      {myBid && (
                        <p
                          className="text-small text-muted"
                          style={{ margin: "8px 0 0 0" }}
                        >
                          Your current bid: ${myBid.bid_amount.toFixed(2)} (
                          {myBid.bid_status})
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ASSIGNED ORDERS TAB */}
        {activeTab === "assigned" && (
          <>
            {/* Ready for Pickup */}
            <div className="card card-sm mb-3">
              <h3 className="title-md mb-3">
                Ready for Pickup ({ready.length})
              </h3>
              {ready.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <Package
                    size={48}
                    style={{ color: "#d1d5db", margin: "0 auto 20px" }}
                  />
                  <p className="text-muted">No orders ready for pickup</p>
                </div>
              ) : (
                <div className="grid grid-2">
                  {ready.map((order) => (
                    <div
                      key={order.order_id}
                      className="card card-compact"
                      style={{ background: "rgba(34, 197, 94, 0.05)" }}
                    >
                      <div className="flex-between mb-2">
                        <h4 className="title-md" style={{ margin: 0 }}>
                          Order #{order.order_id}
                        </h4>
                        <span className="badge badge-success">
                          <Package size={14} /> Ready
                        </span>
                      </div>
                      <p style={{ margin: "5px 0", fontWeight: "500" }}>
                        {order.customer_name}
                      </p>
                      <div
                        className="flex gap-sm"
                        style={{ margin: "5px 0", color: "#78716c" }}
                      >
                        <MapPin size={16} />
                        <span className="text-small">{order.delivered_to}</span>
                      </div>
                      <p
                        className="text-small text-muted"
                        style={{ margin: "5px 0" }}
                      >
                        📞 {order.phone}
                      </p>
                      <p className="menu-price" style={{ margin: "10px 0" }}>
                        ${order.total_price.toFixed(2)}
                      </p>
                      <button
                        className="btn btn-primary w-full"
                        onClick={() => handlePickup(order.order_id)}
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
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <Truck
                    size={48}
                    style={{ color: "#d1d5db", margin: "0 auto 20px" }}
                  />
                  <p className="text-muted">No active deliveries</p>
                </div>
              ) : (
                <div className="grid grid-2">
                  {delivering.map((order) => (
                    <div
                      key={order.order_id}
                      className="card card-compact"
                      style={{ background: "rgba(249, 115, 22, 0.05)" }}
                    >
                      <div className="flex-between mb-2">
                        <h4 className="title-md" style={{ margin: 0 }}>
                          Order #{order.order_id}
                        </h4>
                        <span className="badge badge-warning">
                          <Clock size={14} /> Delivering
                        </span>
                      </div>
                      <p style={{ margin: "5px 0", fontWeight: "500" }}>
                        {order.customer_name}
                      </p>
                      <div
                        className="flex gap-sm"
                        style={{ margin: "5px 0", color: "#78716c" }}
                      >
                        <MapPin size={16} />
                        <span className="text-small">{order.delivered_to}</span>
                      </div>
                      <p
                        className="text-small text-muted"
                        style={{ margin: "5px 0" }}
                      >
                        📞 {order.phone}
                      </p>
                      <p className="menu-price" style={{ margin: "10px 0" }}>
                        ${order.total_price.toFixed(2)}
                      </p>
                      <button
                        className="btn btn-success w-full"
                        onClick={() => handleDeliver(order.order_id)}
                      >
                        <CheckCircle size={16} /> Mark Delivered
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
