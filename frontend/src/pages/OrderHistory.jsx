import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Package, Clock, CheckCircle2, XCircle, X, ArrowLeft } from "lucide-react";
import client from "../api/client";

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [foodRating, setFoodRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [hoveredFoodStar, setHoveredFoodStar] = useState(0);
  const [hoveredDeliveryStar, setHoveredDeliveryStar] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, []);

const fetchOrders = async () => {
  try {
    setLoading(true);
    const customer = JSON.parse(localStorage.getItem("customer"));

    console.log("1️⃣ Customer from localStorage:", customer);

    if (!customer) {
      navigate("/login");
      return;
    }

    const customerId = customer.user_id || customer.customer_id || customer.id;
    console.log("2️⃣ Using customerId:", customerId);

    const url = `/orders/history?customer_id=${customerId}`;
    console.log("3️⃣ Calling URL:", url);

    const response = await client.get(url);
    console.log("4️⃣ Response data:", response.data);

    if (!response.data || response.data.length === 0) {
      console.log("5️⃣ No orders returned from API");
      setOrders([]);
      return;
    }

    const mappedOrders = response.data.map((order) => ({
      id: order.order_id,
      date: order.created_at,
      status: mapStatus(order.delivery_status),
      total: parseFloat(order.total_price),
      items: order.items || [],
      rating: 0,
      deliveryRating: 0,
    }));

    console.log("6️⃣ Mapped orders:", mappedOrders);
    setOrders(mappedOrders);
  } catch (error) {
    console.error("❌ Error:", error);
    console.error("❌ Error response:", error.response?.data);
    setOrders([]);
  } finally {
    setLoading(false);
  }
};

  const mapStatus = (backendStatus) => {
    const statusMap = {
      Pending: "confirmed",
      Preparing: "preparing",
      Ready: "preparing",
      "Out for Delivery": "preparing",
      Delivered: "delivered",
      Cancelled: "cancelled",
    };
    return statusMap[backendStatus] || "confirmed";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return <Clock size={16} />;
      case "preparing":
        return <Package size={16} />;
      case "delivered":
        return <CheckCircle2 size={16} />;
      case "cancelled":
        return <XCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return { bg: "rgba(59, 130, 246, 0.1)", text: "#3b82f6", border: "rgba(59, 130, 246, 0.3)" };
      case "preparing":
        return { bg: "rgba(249, 115, 22, 0.1)", text: "#f97316", border: "rgba(249, 115, 22, 0.3)" };
      case "delivered":
        return { bg: "rgba(34, 197, 94, 0.1)", text: "#22c55e", border: "rgba(34, 197, 94, 0.3)" };
      case "cancelled":
        return { bg: "rgba(239, 68, 68, 0.1)", text: "#ef4444", border: "rgba(239, 68, 68, 0.3)" };
      default:
        return { bg: "rgba(156, 163, 175, 0.1)", text: "#9ca3af", border: "rgba(156, 163, 175, 0.3)" };
    }
  };

  const handleRateOrder = async () => {
    if (selectedOrder && (foodRating > 0 || deliveryRating > 0)) {
      try {
        await client.post(`/orders/${selectedOrder.id}/rating`, {
          food_rating: foodRating,
          delivery_rating: deliveryRating,
        });

        alert("Thank you for your rating!");

        setOrders(orders.map((order) =>
          order.id === selectedOrder.id ? { ...order, rating: foodRating, deliveryRating } : order
        ));

        closeDialog();
      } catch (error) {
        console.error("Failed to submit rating:", error);
        alert("Failed to submit rating. Please try again.");
      }
    }
  };

  const openRatingDialog = (order) => {
    setSelectedOrder(order);
    setFoodRating(order.rating || 0);
    setDeliveryRating(order.deliveryRating || 0);
  };

  const closeDialog = () => {
    setSelectedOrder(null);
    setFoodRating(0);
    setDeliveryRating(0);
    setHoveredFoodStar(0);
    setHoveredDeliveryStar(0);
  };

  const StarRating = ({ rating, setRating, hoveredStar, setHoveredStar }) => (
    <div className="flex gap-sm">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHoveredStar(star)}
          onMouseLeave={() => setHoveredStar(0)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <Star
            size={32}
            style={{
              fill: star <= (hoveredStar || rating) ? "#facc15" : "transparent",
              color: star <= (hoveredStar || rating) ? "#facc15" : "#d4d4d8",
              transition: "all 0.2s",
            }}
          />
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="page-center">
        <p style={{ fontSize: "1.2rem", color: "#78716c" }}>Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="page">
        <div className="container mb-4">
          <button onClick={() => navigate("/customer")} className="btn btn-secondary">
            <ArrowLeft size={18} /> Back
          </button>
        </div>

        <div className="container">
          <div className="card" style={{ padding: "80px 40px", textAlign: "center" }}>
            <Package size={80} style={{ color: "#d4d4d8", margin: "0 auto 20px" }} />
            <h3 className="title-md">No orders yet</h3>
            <p className="text-muted mb-3">Your order history will appear here once you place an order</p>
            <button onClick={() => navigate("/menu")} className="btn btn-primary">
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container mb-4">
        <button onClick={() => navigate("/customer")} className="btn btn-secondary mb-3">
          <ArrowLeft size={18} /> Back
        </button>

        <h2 className="title-lg">Order History</h2>
        <p className="text-muted">View and rate your past orders</p>
      </div>

      <div className="container">
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {orders.map((order) => {
            const statusColor = getStatusColor(order.status);
            return (
              <div key={order.id} className="card">
                <div className="flex-between mb-3">
                  <div>
                    <div className="flex gap-md mb-2">
                      <h3 className="title-md" style={{ margin: 0 }}>Order #{order.id}</h3>
                      <span className="badge" style={{
                        background: statusColor.bg,
                        color: statusColor.text,
                        border: `1px solid ${statusColor.border}`,
                      }}>
                        {getStatusIcon(order.status)}
                        <span style={{ textTransform: "capitalize" }}>{order.status}</span>
                      </span>
                    </div>
                    <p className="text-muted text-small">
                      {new Date(order.date).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p className="menu-price" style={{ fontSize: "1.8rem", margin: "0 0 5px 0" }}>
                      ${order.total.toFixed(2)}
                    </p>
                    {order.rating > 0 && (
                      <div className="flex gap-sm" style={{ justifyContent: "flex-end" }}>
                        <Star size={16} style={{ fill: "#facc15", color: "#facc15" }} />
                        <span className="text-muted text-small">{order.rating}/5</span>
                      </div>
                    )}
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="mb-3">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex-between"
                        style={{
                          padding: "12px",
                          background: "rgba(249, 115, 22, 0.03)",
                          borderRadius: "8px",
                          marginBottom: "10px",
                          border: "1px solid rgba(249, 115, 22, 0.08)",
                        }}
                      >
                        <div className="flex gap-md" style={{ flex: 1 }}>
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              style={{
                                width: "50px",
                                height: "50px",
                                objectFit: "cover",
                                borderRadius: "6px",
                              }}
                              onError={(e) => { e.target.style.display = "none"; }}
                            />
                          )}
                          <div>
                            <p style={{ margin: "0 0 3px 0", fontWeight: "500" }}>{item.name}</p>
                            <p className="text-muted text-small">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <p style={{ margin: 0, fontWeight: "600", fontSize: "1rem" }}>
                          ${(parseFloat(item.item_price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {order.status === "delivered" && (
                  <button className="btn btn-primary w-full" onClick={() => openRatingDialog(order)}>
                    <Star size={18} />
                    {order.rating ? "Update Rating" : "Rate Order"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1000,
          }}
          onClick={closeDialog}
        >
          <div
            className="card"
            style={{ maxWidth: "500px", width: "100%", padding: "40px", position: "relative" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeDialog}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#71717a",
              }}
            >
              <X size={24} />
            </button>

            <h3 className="title-md">Rate Your Experience</h3>
            <p className="text-muted text-small mb-3">
              Help us improve by rating your food and delivery
            </p>

            <div className="mb-3">
              <label className="form-label">Food Quality</label>
              <StarRating
                rating={foodRating}
                setRating={setFoodRating}
                hoveredStar={hoveredFoodStar}
                setHoveredStar={setHoveredFoodStar}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Delivery Experience</label>
              <StarRating
                rating={deliveryRating}
                setRating={setDeliveryRating}
                hoveredStar={hoveredDeliveryStar}
                setHoveredStar={setHoveredDeliveryStar}
              />
            </div>

            <button
              className="btn btn-primary w-full"
              onClick={handleRateOrder}
              disabled={foodRating === 0 && deliveryRating === 0}
            >
              Submit Rating
            </button>
          </div>
        </div>
      )}
    </div>
  );
}