import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Wallet,
  AlertCircle,
} from "lucide-react";
import client from "../api/client";

export default function OrderCheckout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [zip, setZip] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(true);

  useEffect(() => {
    const storedCustomer = localStorage.getItem("customer");
    if (!storedCustomer) {
      alert("Please login first");
      navigate("/login");
      return;
    }
    
    const customerData = JSON.parse(storedCustomer);
    setCustomer(customerData);

    // Fetch fresh balance from database
    fetchFreshBalance(customerData.customer_id || customerData.id);

    const storedCart = localStorage.getItem("cart");
    if (storedCart) setCart(JSON.parse(storedCart));
  }, [navigate]);

  // Fetch current balance from backend
  const fetchFreshBalance = async (customerId) => {
    try {
      setBalanceLoading(true);
      const response = await client.get(`/users/${customerId}`);
      
      const storedCustomer = JSON.parse(localStorage.getItem("customer"));
      const updatedCustomer = {
        ...storedCustomer,
        balance: response.data.balance
      };
      
      setCustomer(updatedCustomer);
      localStorage.setItem("customer", JSON.stringify(updatedCustomer));
    } catch (error) {
      console.error("❌ Failed to fetch balance:", error);
    } finally {
      setBalanceLoading(false);
    }
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    const updatedCart = cart.map((item) =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const removeFromCart = (itemId) => {
    const updatedCart = cart.filter((item) => item.id !== itemId);
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = subtotal > 0 ? 3.99 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  const currentBalance = Number(customer?.balance ?? 0);
  const remainingBalance = currentBalance - total;
  const hasSufficientFunds = remainingBalance >= 0;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    if (
      !addressLine1.trim() ||
      !city.trim() ||
      !stateRegion.trim() ||
      !zip.trim() ||
      !phoneNumber.trim()
    ) {
      alert("Please fill in all delivery details.");
      return;
    }

    if (!hasSufficientFunds) {
      alert("Insufficient balance! Please deposit funds to your wallet.");
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        customer_id: customer?.customer_id || customer?.user_id || customer?.id,
        items: cart.map((item) => ({
          dish_id: parseInt(item.id) || parseInt(item.item_id),  // ✅ Convert to integer
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price),
        })),
        delivery_address: `${addressLine1}, ${city}, ${stateRegion} ${zip}`,
        phone: phoneNumber,
        total_amount: parseFloat(total.toFixed(2)),
      };

      console.log("📦 Sending order data:", orderData);

      await client.post("/orders/", orderData);
      
      alert("Order placed successfully!");

      // Refresh balance after order
      await fetchFreshBalance(customer?.customer_id || customer?.user_id || customer?.id);

      setCart([]);
      localStorage.removeItem("cart");
      setAddressLine1("");
      setCity("");
      setStateRegion("");
      setZip("");
      setPhoneNumber("");

      navigate("/customer");
    } catch (error) {
      console.error("❌ Order error:", error);
      console.error("❌ Error details:", error.response?.data);
      
      // Show more helpful error message
      const errorMsg = error.response?.data?.error || "Failed to place order";
      alert(`Order failed: ${errorMsg}\n\nPlease check the console for details.`);
    } finally {
      setLoading(false);
    }
  };

  // Empty cart state
  if (cart.length === 0) {
    return (
      <div className="page-center">
        <div className="container-sm text-center">
          <ShoppingBag
            size={80}
            style={{
              color: "#a8a29e",
              margin: "0 auto 20px",
              display: "block",
            }}
          />
          <h3 className="title-md">Your cart is empty</h3>
          <p className="text-muted mb-3">
            Add some delicious items to get started!
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/menu")}>
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        <button
          className="btn btn-secondary mb-3"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="card card-sm mb-3">
          <div className="flex-between">
            <div>
              <p
                className="text-small text-muted"
                style={{ margin: "0 0 5px 0" }}
              >
                Your Wallet Balance
              </p>
              <h2
                className="menu-price"
                style={{ fontSize: "2rem", margin: 0 }}
              >
                {balanceLoading ? (
                  <span style={{ color: "#a8a29e" }}>Loading...</span>
                ) : (
                  `$${currentBalance.toFixed(2)}`
                )}
              </h2>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/wallet")}
            >
              <Wallet size={18} />
              Add Funds
            </button>
          </div>
        </div>

        <div className="grid grid-2" style={{ alignItems: "start" }}>
          <div
            className="flex"
            style={{ flexDirection: "column", gap: "20px" }}
          >
            <div className="card card-sm">
              <h3 className="title-md">Your Cart ({cart.length} items)</h3>
              <p className="text-muted text-small mb-3">
                Review your order before checking out
              </p>

              <div
                className="flex"
                style={{ flexDirection: "column", gap: "12px" }}
              >
                {cart.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px",
                      background: "rgba(249, 115, 22, 0.05)",
                      borderRadius: "12px",
                      border: "1px solid rgba(249, 115, 22, 0.1)",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h4
                        style={{
                          margin: "0 0 5px 0",
                          fontSize: "1rem",
                          color: "#78716c",
                        }}
                      >
                        {item.name}
                      </h4>
                      <p
                        className="menu-price"
                        style={{ margin: "0 0 8px 0" }}
                      >
                        ${item.price.toFixed(2)}
                      </p>
                      <div className="flex gap-sm">
                        <button
                          className="btn-icon"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Minus size={14} />
                        </button>
                        <span
                          style={{
                            minWidth: "30px",
                            textAlign: "center",
                            fontWeight: "600",
                            color: "#78716c",
                          }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          className="btn-icon"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => removeFromCart(item.id)}
                          style={{
                            marginLeft: "10px",
                            background: "#fee2e2",
                            borderColor: "#fecaca",
                            color: "#dc2626",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div
                      className="menu-price"
                      style={{ minWidth: "80px", textAlign: "right" }}
                    >
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card card-sm">
              <h3 className="title-md">Delivery Details</h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                }}
              >
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Address Line</label>
                  <input
                    className="input"
                    placeholder="Street and number"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    className="input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">State / Region</label>
                  <input
                    className="input"
                    value={stateRegion}
                    onChange={(e) => setStateRegion(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ZIP Code</label>
                  <input
                    className="input"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Phone Number</label>
                  <input
                    className="input"
                    type="tel"
                    placeholder="For delivery updates"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className="flex"
            style={{ flexDirection: "column", gap: "20px" }}
          >
            <div className="card card-sm">
              <h3 className="title-md">Order Summary</h3>
              <div
                className="flex"
                style={{ flexDirection: "column", gap: "10px" }}
              >
                <div className="flex-between">
                  <span className="text-muted">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex-between">
                  <span className="text-muted">Delivery fee</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex-between">
                  <span className="text-muted">Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div
                  style={{
                    height: "1px",
                    background: "rgba(249, 115, 22, 0.2)",
                    margin: "5px 0",
                  }}
                />
                <div
                  className="flex-between"
                  style={{
                    fontWeight: "600",
                    fontSize: "1.2rem",
                    color: "#78716c",
                  }}
                >
                  <span>Total</span>
                  <span className="menu-price">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="card card-sm">
              <h3 className="title-md">Payment</h3>

              <div
                className="flex"
                style={{ flexDirection: "column", gap: "12px" }}
              >
                <div
                  className="flex-between"
                  style={{
                    padding: "12px",
                    background: "rgba(249, 115, 22, 0.05)",
                    borderRadius: "12px",
                  }}
                >
                  <span className="text-muted">Current Balance</span>
                  <span style={{ fontWeight: "600" }}>
                    {balanceLoading ? "..." : `$${currentBalance.toFixed(2)}`}
                  </span>
                </div>
                <div
                  className="flex-between"
                  style={{
                    padding: "12px",
                    background: "rgba(249, 115, 22, 0.05)",
                    borderRadius: "12px",
                  }}
                >
                  <span className="text-muted">Order Total</span>
                  <span style={{ fontWeight: "600" }}>
                    ${total.toFixed(2)}
                  </span>
                </div>
                <div
                  className="flex-between"
                  style={{
                    padding: "12px",
                    background: hasSufficientFunds
                      ? "rgba(16, 185, 129, 0.1)"
                      : "rgba(239, 68, 68, 0.1)",
                    borderRadius: "12px",
                    border: `1px solid ${
                      hasSufficientFunds
                        ? "rgba(16, 185, 129, 0.3)"
                        : "rgba(239, 68, 68, 0.3)"
                    }`,
                  }}
                >
                  <span
                    style={{
                      fontWeight: "600",
                      color: hasSufficientFunds ? "#059669" : "#dc2626",
                    }}
                  >
                    Remaining Balance
                  </span>
                  <span
                    style={{
                      fontWeight: "600",
                      fontSize: "1.1rem",
                      color: hasSufficientFunds ? "#059669" : "#dc2626",
                    }}
                  >
                    {balanceLoading ? "..." : `$${remainingBalance.toFixed(2)}`}
                  </span>
                </div>

                {!hasSufficientFunds && !balanceLoading && (
                  <div className="alert alert-error" style={{ marginTop: "10px" }}>
                    <div
                      className="flex gap-sm"
                      style={{ alignItems: "flex-start" }}
                    >
                      <AlertCircle
                        size={20}
                        style={{ flexShrink: 0, marginTop: "2px" }}
                      />
                      <div>
                        <p
                          style={{
                            margin: "0 0 8px 0",
                            fontWeight: "600",
                          }}
                        >
                          Insufficient Balance
                        </p>
                        <p
                          style={{
                            margin: "0 0 8px 0",
                            fontSize: "0.85rem",
                          }}
                        >
                          You need $
                          {Math.abs(remainingBalance).toFixed(2)} more to place
                          this order.
                        </p>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate("/wallet")}
                          style={{ marginTop: "5px" }}
                        >
                          <Wallet size={16} />
                          Add Funds
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn btn-primary btn-lg w-full"
                onClick={handlePlaceOrder}
                disabled={loading || !hasSufficientFunds || balanceLoading}
                style={{ marginTop: "15px" }}
              >
                {loading
                  ? "Placing order..."
                  : balanceLoading
                  ? "Loading balance..."
                  : `Place Order · $${total.toFixed(2)}`}
              </button>

              {!hasSufficientFunds && !balanceLoading && (
                <p
                  className="text-small text-muted text-center"
                  style={{ marginTop: "10px" }}
                >
                  Please add funds to your wallet to continue
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}