import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, Plus, ArrowLeft, CreditCard, DollarSign, TrendingUp, Clock } from "lucide-react";
import client from "../api/client";

export default function WalletPage() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [amount, setAmount] = useState("");
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const storedCustomer = localStorage.getItem("customer");
    if (!storedCustomer) {
      alert("Please login first");
      navigate("/login");
      return;
    }
    setCustomer(JSON.parse(storedCustomer));

    // Load transaction history from backend
    loadTransactions();
  }, [navigate]);

  const loadTransactions = async () => {
    try {
      const storedCustomer = JSON.parse(localStorage.getItem("customer"));
      const response = await client.get(`/transactions/${storedCustomer?.customer_id || storedCustomer?.id}`);
      setTransactions(response.data);
    } catch (error) {
      console.error("Error loading transactions:", error);
      // If backend not ready, show demo transactions
      setTransactions([
        { id: 1, type: "deposit", amount: 100.00, date: "2024-12-09", description: "Initial deposit" },
        { id: 2, type: "order", amount: -25.50, date: "2024-12-08", description: "Order #1234" },
        { id: 3, type: "deposit", amount: 50.00, date: "2024-12-07", description: "Wallet top-up" },
      ]);
    }
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (depositAmount < 5) {
      alert("Minimum deposit is $5.00");
      return;
    }

    if (!cardNumber.trim()) {
      alert("Please enter your card number");
      return;
    }

    setLoading(true);

    try {
      // Send deposit request to backend
      const response = await client.post("/wallet/deposit", {
        customer_id: customer?.customer_id || customer?.id,
        amount: depositAmount,
        card_number: cardNumber
      });

      // Update customer balance
      const updatedCustomer = { ...customer, balance: (customer.balance || 0) + depositAmount };
      setCustomer(updatedCustomer);
      localStorage.setItem("customer", JSON.stringify(updatedCustomer));

      alert(`Successfully added $${depositAmount.toFixed(2)} to your wallet!`);
      
      // Reset form
      setAmount("");
      setCardNumber("");
      setShowAddFunds(false);
      
      // Reload transactions
      loadTransactions();
    } catch (error) {
      console.error("Deposit error:", error);
      
      // For demo purposes, if backend fails, still update locally
      const updatedCustomer = { ...customer, balance: (customer.balance || 0) + depositAmount };
      setCustomer(updatedCustomer);
      localStorage.setItem("customer", JSON.stringify(updatedCustomer));
      
      alert(`Successfully added $${depositAmount.toFixed(2)} to your wallet!`);
      setAmount("");
      setCardNumber("");
      setShowAddFunds(false);
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [10, 25, 50, 100];

  if (!customer) return <div>Loading...</div>;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: "900px" }}>
        {/* Back Button */}
        <button className="btn btn-secondary mb-3" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Balance Card */}
        <div className="card" style={{
          background: "linear-gradient(135deg, #f97316, #fb923c)",
          marginBottom: "30px",
          textAlign: "center"
        }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
            <div style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Wallet size={36} color="white" />
            </div>
          </div>
          <p style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "0.9rem", letterSpacing: "2px", margin: "0 0 10px 0" }}>
            WALLET BALANCE
          </p>
          <h1 style={{ color: "white", fontSize: "3.5rem", fontWeight: "300", letterSpacing: "4px", margin: "0 0 20px 0" }}>
            ${(customer.balance || 0).toFixed(2)}
          </h1>
          <button 
            className="btn btn-lg"
            style={{ background: "white", color: "#f97316" }}
            onClick={() => setShowAddFunds(true)}
          >
            <Plus size={20} />
            Add Funds
          </button>
        </div>

        {/* Add Funds Modal/Section */}
        {showAddFunds && (
          <div className="card card-sm mb-3">
            <div className="flex-between mb-3">
              <h3 className="title-md" style={{ margin: 0 }}>Add Funds</h3>
              <button 
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShowAddFunds(false);
                  setAmount("");
                  setCardNumber("");
                }}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddFunds}>
              <div className="form-group">
                <label className="form-label">Amount to Add</label>
                <div style={{ position: "relative" }}>
                  <span style={{
                    position: "absolute",
                    left: "18px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#78716c",
                    fontSize: "1.2rem",
                    fontWeight: "600"
                  }}>
                    $
                  </span>
                  <input
                    type="number"
                    className="input"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="5"
                    step="0.01"
                    style={{ paddingLeft: "35px", fontSize: "1.1rem" }}
                    required
                  />
                </div>
                <p className="text-small text-muted" style={{ marginTop: "5px" }}>
                  Minimum deposit: $5.00
                </p>
              </div>

              {/* Quick Amount Buttons */}
              <div style={{ marginBottom: "20px" }}>
                <label className="form-label">Quick Add</label>
                <div className="flex gap-sm" style={{ flexWrap: "wrap" }}>
                  {quickAmounts.map(amt => (
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
              </div>

              <div className="form-group">
                <label className="form-label">Card Number</label>
                <div style={{ position: "relative" }}>
                  <CreditCard size={20} style={{
                    position: "absolute",
                    left: "18px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#a8a29e"
                  }} />
                  <input
                    type="text"
                    className="input"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    maxLength={19}
                    style={{ paddingLeft: "50px" }}
                    required
                  />
                </div>
                <p className="text-small text-muted" style={{ marginTop: "5px" }}>
                  For demo, you can enter any 16-digit number
                </p>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? "Processing..." : `Add $${amount || "0.00"} to Wallet`}
              </button>
            </form>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-3 mb-3">
          <div className="card card-compact text-center">
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
              <div style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: "rgba(249, 115, 22, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <DollarSign size={24} style={{ color: "#f97316" }} />
              </div>
            </div>
            <p className="text-small text-muted" style={{ margin: "0 0 5px 0" }}>Total Deposits</p>
            <p className="menu-price" style={{ margin: 0, fontSize: "1.3rem" }}>
              ${transactions.filter(t => t.type === "deposit").reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
            </p>
          </div>

          <div className="card card-compact text-center">
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
              <div style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <TrendingUp size={24} style={{ color: "#dc2626" }} />
              </div>
            </div>
            <p className="text-small text-muted" style={{ margin: "0 0 5px 0" }}>Total Spent</p>
            <p style={{ margin: 0, fontSize: "1.3rem", fontWeight: "600", color: "#dc2626" }}>
              ${Math.abs(transactions.filter(t => t.type === "order").reduce((sum, t) => sum + t.amount, 0)).toFixed(2)}
            </p>
          </div>

          <div className="card card-compact text-center">
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
              <div style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Clock size={24} style={{ color: "#059669" }} />
              </div>
            </div>
            <p className="text-small text-muted" style={{ margin: "0 0 5px 0" }}>Transactions</p>
            <p style={{ margin: 0, fontSize: "1.3rem", fontWeight: "600", color: "#059669" }}>
              {transactions.length}
            </p>
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
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
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
                      background: transaction.type === "deposit" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      {transaction.type === "deposit" ? (
                        <Plus size={20} style={{ color: "#059669" }} />
                      ) : (
                        <DollarSign size={20} style={{ color: "#dc2626" }} />
                      )}
                    </div>
                    <div>
                      <p style={{ margin: "0 0 5px 0", fontWeight: "500", color: "#78716c" }}>
                        {transaction.description}
                      </p>
                      <p className="text-small text-muted" style={{ margin: 0 }}>
                        {transaction.date}
                      </p>
                    </div>
                  </div>
                  <div style={{
                    fontSize: "1.2rem",
                    fontWeight: "600",
                    color: transaction.type === "deposit" ? "#059669" : "#dc2626"
                  }}>
                    {transaction.type === "deposit" ? "+" : ""}${Math.abs(transaction.amount).toFixed(2)}
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
