import React, { useState } from "react";
import { Star, Package, Clock, CheckCircle2, XCircle, X, ArrowLeft } from "lucide-react";

export default function OrderHistory({ orders = [], updateRating, onBackToMenu }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [foodRating, setFoodRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [hoveredFoodStar, setHoveredFoodStar] = useState(0);
  const [hoveredDeliveryStar, setHoveredDeliveryStar] = useState(0);

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return <Clock className="size-4" />;
      case "preparing":
        return <Package className="size-4" />;
      case "delivered":
        return <CheckCircle2 className="size-4" />;
      case "cancelled":
        return <XCircle className="size-4" />;
      default:
        return <Clock className="size-4" />;
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

  const handleRateOrder = () => {
    if (selectedOrder && (foodRating > 0 || deliveryRating > 0)) {
      updateRating(selectedOrder.id, foodRating, deliveryRating);
      alert("Thank you for your rating!");
      setSelectedOrder(null);
      setFoodRating(0);
      setDeliveryRating(0);
      setHoveredFoodStar(0);
      setHoveredDeliveryStar(0);
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
    <div style={{ display: "flex", gap: "8px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHoveredStar(star)}
          onMouseLeave={() => setHoveredStar(0)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            transition: "transform 0.2s",
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.1)"}
          onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
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

  if (orders.length === 0) {
    return (
      <div className="page">
        {/* Header with Back Button */}
        <div className="container" style={{ marginBottom: "40px" }}>
          <button
            onClick={onBackToMenu}
            className="btn"
            style={{
              background: "white",
              color: "#f97316",
              border: "1px solid rgba(249, 115, 22, 0.2)",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
            }}
          >
            <ArrowLeft size={18} />
            Back to Menu
          </button>
        </div>

        <div className="container">
          <div className="card" style={{ padding: "80px 40px", textAlign: "center" }}>
            <Package size={80} style={{ color: "#d4d4d8", margin: "0 auto 20px" }} />
            <h3 className="title-md" style={{ margin: "0 0 10px 0" }}>No orders yet</h3>
            <p className="text-muted" style={{ margin: "0 0 30px 0" }}>
              Your order history will appear here once you place an order
            </p>
            <button
              onClick={onBackToMenu}
              className="btn btn-primary"
            >
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="container" style={{ marginBottom: "40px" }}>
        <button
          onClick={onBackToMenu}
          className="btn"
          style={{
            background: "white",
            color: "#f97316",
            border: "1px solid rgba(249, 115, 22, 0.2)",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            marginBottom: "30px",
          }}
        >
          <ArrowLeft size={18} />
          Back to Menu
        </button>

        <h2 className="title-lg" style={{ margin: "0 0 10px 0" }}>Order History</h2>
        <p className="text-muted">View and rate your past orders</p>
      </div>

      {/* Orders List */}
      <div className="container" style={{ marginBottom: "60px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {orders.map((order) => {
            const statusColor = getStatusColor(order.status);
            return (
              <div key={order.id} className="card dish-card" style={{ padding: "30px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "20px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                      <h3 className="title-md" style={{ margin: 0 }}>
                        Order #{order.id}
                      </h3>
                      <span
                        style={{
                          padding: "6px 14px",
                          borderRadius: "20px",
                          fontSize: "0.85rem",
                          fontWeight: "500",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: statusColor.bg,
                          color: statusColor.text,
                          border: `1px solid ${statusColor.border}`,
                        }}
                      >
                        {getStatusIcon(order.status)}
                        <span style={{ textTransform: "capitalize" }}>{order.status}</span>
                      </span>
                    </div>
                    <p className="text-muted" style={{ margin: 0, fontSize: "0.9rem" }}>
                      {new Date(order.date).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p className="price" style={{ fontSize: "1.8rem", margin: "0 0 5px 0" }}>
                      ${order.total.toFixed(2)}
                    </p>
                    {order.rating > 0 && (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
                        <Star size={16} style={{ fill: "#facc15", color: "#facc15" }} />
                        <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                          {order.rating}/5
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div style={{ marginBottom: "20px" }}>
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "15px",
                        padding: "12px",
                        background: "rgba(249, 115, 22, 0.03)",
                        borderRadius: "8px",
                        marginBottom: "10px",
                        border: "1px solid rgba(249, 115, 22, 0.08)",
                      }}
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "cover",
                            borderRadius: "6px",
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 3px 0", fontWeight: "500" }}>{item.name}</p>
                        <p className="text-muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p style={{ margin: 0, fontWeight: "600", fontSize: "1rem" }}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Rate Button */}
                {order.status === "delivered" && (
                  <button
                    className="btn btn-primary"
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                    onClick={() => openRatingDialog(order)}
                  >
                    <Star size={18} />
                    {order.rating ? "Update Rating" : "Rate Order"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rating Dialog Modal */}
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
            style={{
              maxWidth: "500px",
              width: "100%",
              padding: "40px",
              position: "relative",
            }}
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

            <h3 className="title-md" style={{ margin: "0 0 10px 0" }}>
              Rate Your Experience
            </h3>
            <p className="text-muted" style={{ margin: "0 0 30px 0", fontSize: "0.9rem" }}>
              Help us improve by rating your food and delivery
            </p>

            <div style={{ marginBottom: "30px" }}>
              <label style={{ display: "block", marginBottom: "12px", fontWeight: "500", fontSize: "0.95rem" }}>
                Food Quality
              </label>
              <StarRating
                rating={foodRating}
                setRating={setFoodRating}
                hoveredStar={hoveredFoodStar}
                setHoveredStar={setHoveredFoodStar}
              />
            </div>

            <div style={{ marginBottom: "30px" }}>
              <label style={{ display: "block", marginBottom: "12px", fontWeight: "500", fontSize: "0.95rem" }}>
                Delivery Experience
              </label>
              <StarRating
                rating={deliveryRating}
                setRating={setDeliveryRating}
                hoveredStar={hoveredDeliveryStar}
                setHoveredStar={setHoveredDeliveryStar}
              />
            </div>

            <button
              className="btn btn-primary"
              style={{ width: "100%", opacity: foodRating === 0 && deliveryRating === 0 ? 0.5 : 1 }}
              onClick={handleRateOrder}
              disabled={foodRating === 0 && deliveryRating === 0}
            >
              Submit Rating
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(249, 115, 22, 0.1)", padding: "40px", textAlign: "center" }}>
        <p className="text-muted" style={{ margin: "0 0 8px 0", fontSize: "0.85rem" }}>
          Your favorite food, delivered fast
        </p>
        <p style={{ margin: 0, color: "#d4d4d8", fontSize: "0.75rem", letterSpacing: "2px" }}>
          © 2024 SD FOODS
        </p>
      </div>
    </div>
  );
}