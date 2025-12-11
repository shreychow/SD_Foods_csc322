import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, Plus, ArrowLeft, DollarSign, TrendingUp, Clock } from "lucide-react";
import client from "../api/client";

export default function WalletPage() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [amount, setAmount] = useState("");
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("customer");
    if (!stored) {
      alert("Please login first");
      navigate("/login");
      return;
    }
    const customerData = JSON.parse(stored);
    setCustomer(customerData);
    
    // Fetch real transactions
    fetchTransactions(customerData.customer_id || customerData.id);
  }, [navigate]);

  const fetchTransactions = async (customerId) => {
    try {
      // Fetch payment history (orders)
      const response = await client.get(`/orders/history?customer_id=${customerId}`);
      
      // Convert orders to transactions
      const orderTransactions = response.data.map(order => ({
        id: order.order_id,
        type: 'order',
        amount: -parseFloat(order.total_price), // Negative for spending
        date: new Date(order.created_at).toISOString().split('T')[0],
        description: `Order #${order.order_id}`
      }));
      
      setTransactions(orderTransactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setTransactions([]);
    }
  };


  const handleAddFunds = async (e) => {
    e.preventDefault();
    const depositAmount = parseFloat(amount);

    if (isNaN(depositAmount) || depositAmount < 5) {
      alert("Minimum deposit is $5.00");
      return;
    }

    setLoading(true);

    try {
      // ✅ FIXED: Use correct endpoint /users/{id}/balance
      const response = await client.put(`/users/${customer?.customer_id || customer?.id}/balance`, {
        action: 'add',
        amount: depositAmount
      });

      // ✅ FIXED: Get new_balance from response
      const newBalance = response.data.new_balance;

      // Update customer object with new balance
      const updatedCustomer = {
        ...customer,
        balance: newBalance
      };
      
      // Update state and localStorage
      setCustomer(updatedCustomer);
      localStorage.setItem("customer", JSON.stringify(updatedCustomer));

      // Add transaction to history
      setTransactions((prev) => [
        {
          id: Date.now(),
          type: "deposit",
          amount: depositAmount,
          date: new Date().toISOString().split("T")[0],
          description: "Wallet deposit",
        },
        ...prev,
      ]);

      alert(`Successfully added $${depositAmount.toFixed(2)}! New balance: $${newBalance.toFixed(2)}`);
      
      // Clear form
      setAmount("");
      setCardName("");
      setCardNumber("");
      setExpiry("");
      setCvv("");
      setShowAddFunds(false);
      
    } catch (error) {
      console.error("Deposit error:", error);
      alert(error.response?.data?.error || "Failed to add funds. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!customer) {
    return (
      <div className="page-center">
        <p>Loading...</p>
      </div>
    );
  }

  const totalSpent = Math.abs(
    transactions
      .filter((t) => t.type === "order")
      .reduce((s, t) => s + t.amount, 0)
  );

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: "900px" }}>
        <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>

        {/* Balance Card */}
        <div className="card" style={{ background: "linear-gradient(135deg, #f97316, #fb923c)", marginBottom: "30px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
            <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wallet size={36} color="white" />
            </div>
          </div>
          <p style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "0.9rem", letterSpacing: "2px", margin: "0 0 10px 0" }}>
            WALLET BALANCE
          </p>
          <h1 style={{ color: "white", fontSize: "3.5rem", fontWeight: "300", letterSpacing: "4px", margin: "0 0 20px 0" }}>
            ${(customer.balance || 0).toFixed(2)}
          </h1>
          <button className="btn btn-lg" style={{ background: "white", color: "#f97316" }} onClick={() => setShowAddFunds(true)}>
            <Plus size={20} /> Add Funds
          </button>
        </div>

        {/* Add Funds Form */}
        {showAddFunds && (
          <div className="card card-sm mb-3">
            <div className="flex-between mb-3">
              <h3 className="title-md" style={{ margin: 0 }}>Add Funds</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddFunds(false)}>Cancel</button>
            </div>

            <form onSubmit={handleAddFunds}>
              <div className="form-group">
                <label className="form-label">Amount</label>
                <input 
                  type="number" 
                  className="input" 
                  placeholder="50.00" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  min="5" 
                  step="0.01" 
                  required 
                />
                <p className="text-small text-muted" style={{ marginTop: "5px" }}>Minimum: $5.00</p>
              </div>

              <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                {[10, 25, 50, 100].map((amt) => (
                  <button 
                    key={amt} 
                    type="button" 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => setAmount(amt.toString())}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Name on Card</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="John Doe" 
                  value={cardName} 
                  onChange={(e) => setCardName(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Card Number</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="1234 5678 9012 3456" 
                  value={cardNumber} 
                  onChange={(e) => setCardNumber(e.target.value)} 
                  maxLength={19} 
                  required 
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "15px" }}>
                <div className="form-group">
                  <label className="form-label">Expiry Date</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="MM/YY" 
                    value={expiry} 
                    onChange={(e) => setExpiry(e.target.value)} 
                    maxLength={5} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CVV</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="123" 
                    value={cvv} 
                    onChange={(e) => setCvv(e.target.value)} 
                    maxLength={3} 
                    required 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-full" 
                disabled={loading}
              >
                {loading ? "Processing..." : `Add $${amount || "0.00"}`}
              </button>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-2 mb-3">
          <div className="card card-compact text-center">
            <TrendingUp size={24} style={{ color: "#dc2626", margin: "0 auto 10px" }} />
            <p className="text-small text-muted" style={{ margin: "0 0 5px 0" }}>Total Spent</p>
            <p style={{ margin: 0, fontSize: "1.3rem", fontWeight: "600", color: "#dc2626" }}>${totalSpent.toFixed(2)}</p>
          </div>
          <div className="card card-compact text-center">
            <Clock size={24} style={{ color: "#059669", margin: "0 auto 10px" }} />
            <p className="text-small text-muted" style={{ margin: "0 0 5px 0" }}>Transactions</p>
            <p style={{ margin: 0, fontSize: "1.3rem", fontWeight: "600", color: "#059669" }}>{transactions.length}</p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="card card-sm">
          <h3 className="title-md">Transaction History</h3>
          {transactions.length === 0 ? (
            <div className="text-center" style={{ padding: "40px 20px" }}>
              <p className="text-muted">No transactions yet</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {transactions.map((t) => (
                <div 
                  key={t.id} 
                  className="flex-between" 
                  style={{ 
                    padding: "15px", 
                    background: "rgba(249, 115, 22, 0.05)", 
                    borderRadius: "12px", 
                    border: "1px solid rgba(249, 115, 22, 0.1)" 
                  }}
                >
                  <div className="flex gap-md">
                    <div style={{ 
                      width: "40px", 
                      height: "40px", 
                      borderRadius: "50%", 
                      background: t.type === "deposit" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center" 
                    }}>
                      {t.type === "deposit" ? (
                        <Plus size={20} style={{ color: "#059669" }} />
                      ) : (
                        <DollarSign size={20} style={{ color: "#dc2626" }} />
                      )}
                    </div>
                    <div>
                      <p style={{ margin: "0 0 5px 0", fontWeight: "500", color: "#78716c" }}>
                        {t.description}
                      </p>
                      <p className="text-small text-muted" style={{ margin: 0 }}>
                        {t.date}
                      </p>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: "1.2rem", 
                    fontWeight: "600", 
                    color: t.type === "deposit" ? "#059669" : "#dc2626" 
                  }}>
                    {t.type === "deposit" ? "+" : ""}${Math.abs(t.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}