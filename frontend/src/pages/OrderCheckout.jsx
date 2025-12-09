import { useState } from "react";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Wallet,
} from "lucide-react";

export default function OrderCheckout({
  cart,
  updateQuantity,
  removeFromCart,
  placeOrder,
}) {
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [zip, setZip] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const deliveryFee = subtotal > 0 ? 3.99 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  const handlePlaceOrder = () => {
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

    if (paymentMethod === "card" && !cardNumber.trim()) {
      alert("Please enter your card number.");
      return;
    }

    placeOrder({
      items: cart,
      total,
      status: "confirmed",
    });

    alert("Order placed successfully!");

    // reset form
    setAddressLine1("");
    setCity("");
    setStateRegion("");
    setZip("");
    setPhoneNumber("");
    setCardNumber("");
  };

  // Empty cart state
  if (cart.length === 0) {
    return (
      <div className="checkout-empty-card">
        <ShoppingBag className="checkout-empty-icon" />
        <h3>Your cart is empty</h3>
        <p>Add some delicious items to get started!</p>
      </div>
    );
  }

  return (
    <div className="checkout-grid">
      {/* Left: Cart Items + Delivery */}
      <div className="checkout-left">
        {/* Cart items */}
        <div className="checkout-card">
          <div className="checkout-card-header">
            <h3>Your Cart ({cart.length} items)</h3>
            <p className="checkout-subtext">
              Review your order before checking out
            </p>
          </div>
          <div className="checkout-card-body">
            {cart.map((item) => (
              <div key={item.id} className="checkout-cart-row">
                <div className="checkout-cart-main">
                  <div className="checkout-cart-image" />
                  <div className="checkout-cart-info">
                    <h4>{item.name}</h4>
                    <p className="checkout-price">
                      ${item.price.toFixed(2)}
                    </p>
                    <div className="checkout-qty-row">
                      <button
                        type="button"
                        className="checkout-qty-btn"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Minus className="checkout-qty-icon" />
                      </button>
                      <span className="checkout-qty-value">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="checkout-qty-btn"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus className="checkout-qty-icon" />
                      </button>
                      <button
                        type="button"
                        className="checkout-remove-btn"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="checkout-remove-icon" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="checkout-line-total">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery details */}
        <div className="checkout-card">
          <div className="checkout-card-header">
            <h3>Delivery Details</h3>
          </div>
          <div className="checkout-card-body checkout-form-grid">
            <label className="form-label">
              Address line
              <input
                className="input"
                placeholder="Street and number"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
              />
            </label>
            <label className="form-label">
              City
              <input
                className="input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </label>
            <label className="form-label">
              State / Region
              <input
                className="input"
                value={stateRegion}
                onChange={(e) => setStateRegion(e.target.value)}
              />
            </label>
            <label className="form-label">
              ZIP code
              <input
                className="input"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
              />
            </label>
            <label className="form-label form-label-full">
              Phone number
              <input
                className="input"
                type="tel"
                placeholder="For delivery updates"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Right: Summary + Payment */}
      <div className="checkout-right">
        {/* Order summary */}
        <div className="checkout-card">
          <div className="checkout-card-header">
            <h3>Order Summary</h3>
          </div>
          <div className="checkout-card-body checkout-summary">
            <div className="checkout-summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="checkout-summary-row">
              <span>Delivery fee</span>
              <span>${deliveryFee.toFixed(2)}</span>
            </div>
            <div className="checkout-summary-row">
              <span>Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="checkout-summary-divider" />
            <div className="checkout-summary-row checkout-summary-total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="checkout-card">
          <div className="checkout-card-header">
            <h3>Payment Method</h3>
          </div>
          <div className="checkout-card-body checkout-payment">
            <button
              type="button"
              className={
                "checkout-pay-option" +
                (paymentMethod === "card" ? " checkout-pay-option-active" : "")
              }
              onClick={() => setPaymentMethod("card")}
            >
              <CreditCard className="checkout-pay-icon" />
              <span>Credit / Debit Card</span>
            </button>
            <button
              type="button"
              className={
                "checkout-pay-option" +
                (paymentMethod === "cash" ? " checkout-pay-option-active" : "")
              }
              onClick={() => setPaymentMethod("cash")}
            >
              <Wallet className="checkout-pay-icon" />
              <span>Cash on Delivery</span>
            </button>

            {paymentMethod === "card" && (
              <div className="checkout-card-input">
                <label className="form-label">
                  Card number
                  <input
                    className="input"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    maxLength={19}
                  />
                </label>
                <p className="checkout-hint">
                  For demo, you can type any 16-digit number.
                </p>
              </div>
            )}
          </div>
          <div className="checkout-card-footer">
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={handlePlaceOrder}
            >
              Place order · ${total.toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
