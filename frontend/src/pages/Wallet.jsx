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
    setCustomer(JSON.parse(stored));
  }, [navigate]);

  // 🔥 FIXED — REAL BACKEND CALL
  const handleAddFunds = async (e) => {
    e.preventDefault();
    const depositAmount = parseFloat(amount);

    if (isNaN(depositAmount) || depositAmount < 5) {
      alert("Minimum deposit is $5.00");
      return;
    }

    setLoading(true);

    try {
      // 🔥 backend API call
      const res = await client.post("/wallet/deposit", {
        customer_id: customer.customer_id,
        amount: depositAmount,
      });

      // Backend returns updated balance
      const updatedBalance = res.data.balance;

      const updatedCustomer = {
        ...customer,
        balance: updatedBalance, // 🔥 sync with backend
      };

      setCustomer(updatedCustomer);
      localStorage.setItem("customer", JSON.stringify(updatedCustomer));

      // Add to transaction list
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

      alert(`Successfully added $${depositAmount.toFixed(2)}!`);
      setAmount("");
      setShowAddFunds(false);

    } catch (err) {
      console.error("Deposit error:", err);
      alert("Failed to deposit funds. Please try again.");
    }

    setLoading(false);
  };

  if (!customer) {
    return (
      <div className="page-center">
        <p>Loading...</p>
      </div>
    );
  }

  const totalDeposits = transactions
    .filter((t) => t.type === "deposit")
    .reduce((s, t) => s + t.amount, 0);

  const totalSpent = Math.abs(
    transactions.filter((t) => t.type === "order").reduce((s, t) => s + t.amount, 0)
  );

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: "900px" }}>

        <button className="btn btn-secondary wallet-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>

        {/* Balance Card */}
        <div className="card wallet-card">
          <div className="wallet-icon-wrapper">
            <div className="wallet-icon-circle">
              <Wallet size={36} color="white" />
            </div>
          </div>
          <p className="wallet-balance-label">WALLET BALANCE</p>

          {/* 🔥 uses backend-synced balance */}
          <h1 className="wallet-balance-amount">
            ${(customer.balance || 0).toFixed(2)}
          </h1>

          <button
            className="btn btn-lg"
            style={{ background: "white", color: "#f97316" }}
            onClick={() => setShowAddFunds(true)}
          >
            <Plus size={20} /> Add Funds
          </button>
        </div>

        {/* Add Funds Form */}
        {showAddFunds && (
          <div className="card card-sm mb-3">
            <div className="flex-between mb-3">
              <h3 className="title-md">Add Funds</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAddFunds(false)}>
                Cancel
              </button>
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
                  required
                />
              </div>

              <div className="flex gap-md mb-2">
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
                  required
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Expiry Date</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
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
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? "Processing..." : `Add $${amount || "0.00"}`}
              </button>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-3 mb-3">
          <div className="card card-compact text-center">
            <DollarSign size={24} />
            <p className="text-small text-muted mb-1">Total Deposits</p>
            <p className="wallet-stat-amount">${totalDeposits.toFixed(2)}</p>
          </div>

          <div className="card card-compact text-center">
            <TrendingUp size={24} />
            <p className="text-small text-muted mb-1">Total Spent</p>
            <p className="wallet-stat-amount">${totalSpent.toFixed(2)}</p>
          </div>

          <div className="card card-compact text-center">
            <Clock size={24} />
            <p className="text-small text-muted mb-1">Transactions</p>
            <p className="wallet-stat-amount">{transactions.length}</p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="card card-sm">
          <h3 className="title-md">Transaction History</h3>

          {transactions.length === 0 ? (
            <div className="text-center wallet-empty">
              <p className="text-muted">No transactions yet</p>
            </div>
          ) : (
            <div className="wallet-tx-list">
              {transactions.map((t) => (
                <div key={t.id} className="wallet-tx-row flex-between">
                  <div className="flex gap-md">
                    <div className={"wallet-tx-icon-circle " + (t.type === "deposit" ? "deposit" : "order")}>
                      {t.type === "deposit" ? (
                        <Plus size={20} style={{ color: "#059669" }} />
                      ) : (
                        <DollarSign size={20} style={{ color: "#dc2626" }} />
                      )}
                    </div>
                    <div>
                      <p className="wallet-tx-title">{t.description}</p>
                      <p className="text-small text-muted wallet-tx-date">{t.date}</p>
                    </div>
                  </div>

                  <div className={"wallet-tx-amount " + (t.type === "deposit" ? "deposit" : "order")}>
                    {t.type === "deposit" ? "+" : "-"}${Math.abs(t.amount).toFixed(2)}
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

