import React, { useState } from "react";
import { Star, Package, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function OrderHistory() {
  console.log("OrderHistory component loaded");

  const [orders, setOrders] = useState([
    {
      id: "001",
      date: "2025-02-06T10:00",
      status: "delivered",
      rating: 0,
      deliveryRating: 0,
      total: 29.97,
      items: [
        { name: "Pizza", quantity: 1, price: 14.99, image: "" },
        { name: "Salad", quantity: 2, price: 9.99, image: "" },
      ],
      expanded: false,
    }
  ]);
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [foodRating, setFoodRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [hoveredFoodStar, setHoveredFoodStar] = useState(0);
  const [hoveredDeliveryStar, setHoveredDeliveryStar] = useState(0);

  const updateRating = () => {};

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
        return "bg-blue-200 text-blue-800";
      case "preparing":
        return "bg-yellow-200 text-yellow-800";
      case "delivered":
        return "bg-green-200 text-green-800";
      case "cancelled":
        return "bg-red-200 text-red-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const toggleExpand = (id) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, expanded: !o.expanded } : o
      )
    );
  };

  const StarRating = ({ rating, setRating, hoveredStar, setHoveredStar }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHoveredStar(star)}
          onMouseLeave={() => setHoveredStar(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`size-8 ${
              star <= (hoveredStar || rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );

  if (!orders || orders.length === 0) {
    return (
      <div className="card p-6 text-center">
        <Package className="size-16 text-gray-300 mb-4" />
        <h3 className="text-gray-600 mb-2">No orders yet</h3>
        <p className="text-gray-500">Your order history will appear here</p>
      </div>
    );
  }

  return (
    <div className="page space-y-6">
      <div>
        <h2 className="text-gray-900 mb-2">Order History</h2>
        <p className="text-gray-600">View and rate your past orders</p>
      </div>

      {orders.map((order) => (
        <div key={order.id} className="card dish-card p-4 space-y-4">
          
          <div className="flex justify-between items-start">
            <div>
              <strong className="flex items-center gap-2">
                Order #{order.id}
                <span className={`px-2 py-1 rounded text-sm ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="ml-1 capitalize">{order.status}</span>
                </span>
              </strong>
              <p className="muted">{new Date(order.date).toLocaleString()}</p>
            </div>

            <div className="text-right">
              <p className="price">${order.total.toFixed(2)}</p>
            </div>
          </div>

          <button
            className="btn btn-primary w-full"
            onClick={() => toggleExpand(order.id)}
          >
            {order.expanded ? "Hide Details" : "View Details"}
          </button>

          {order.expanded && (
            <div className="space-y-2 mt-2">
              <h4 className="text-gray-700 font-semibold">Items:</h4>

              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.quantity} × {item.name}</span>
                  <span>${(item.quantity * item.price).toFixed(2)}</span>
                </div>
              ))}

              <div className="mt-4">
                <h4 className="text-gray-700 font-semibold">Rate This Order</h4>

                <p className="mt-2 text-sm">Food Quality</p>
                <StarRating
                  rating={foodRating}
                  setRating={setFoodRating}
                  hoveredStar={hoveredFoodStar}
                  setHoveredStar={setHoveredFoodStar}
                />

                <p className="mt-4 text-sm">Delivery Experience</p>
                <StarRating
                  rating={deliveryRating}
                  setRating={setDeliveryRating}
                  hoveredStar={hoveredDeliveryStar}
                  setHoveredStar={setHoveredDeliveryStar}
                />

                <button className="btn btn-primary w-full mt-4">
                  Submit Rating
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
