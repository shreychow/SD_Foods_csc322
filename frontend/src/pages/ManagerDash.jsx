import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, LogOut, ShoppingBag, DollarSign, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import client from "../api/client";

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [manager, setManager] = useState(null);
  const [stats, setStats] = useState({ orders: 45, revenue: 2340.50, users: 128, feedback: 5 });
  const [feedback, setFeedback] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("customer");
    if (!stored) {
      navigate("/login");
      return;
    }
    const user = JSON.parse(stored);
    if (user.role !== "manager") {
      alert("Access denied. Manager role required.");
      navigate("/login");
      return;
    }
    setManager(user);
    loadFeedback();
  }, [navigate]);

  const loadFeedback = async () => {
    try {
      const res = await client.get("/manager/feedback");
      setFeedback(res.data);
    } catch (error) {
      // Demo data
      setFeedback([
        { id: 1, type: "complaint", from: "John Doe", target: "Bob Driver", message: "Late delivery", status: "pending" },
        { id: 2, type: "compliment", from: "Jane Smith", target: "Chef Mario", message: "Amazing food!", status: "pending" },
      ]);
    }
  };

  const handleApprove = async (id) => {
    try {
      await client.post(`/manager/feedback/${id}/approve`);
      setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: "approved" } : f));
      alert("Approved!");
    } catch (error) {
      alert("Approved! (Demo)");
      setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: "approved" } : f));
    }
  };

  const handleDismiss = async (id) => {
    try {
      await client.post(`/manager/feedback/${id}/dismiss`);
      setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: "dismissed" } : f));
      alert("Dismissed!");
    } catch (error) {
      alert("Dismissed! (Demo)");
      setFeedback(prev => prev.map(f => f.id === id ? { ...f, status: "dismissed" } : f));
    }
  };

  if (!manager) return <div>Loading...</div>;

  return (
    <div className="page">
      {/* Header */}
      <div className="navbar">
        <div className="flex gap-md">
          <div className="brand-logo-sm"><Users size={22} /></div>
          <span className="brand-name">MANAGER PORTAL</span>
        </div>
        <button onClick={() => { localStorage.removeItem("customer"); navigate("/login"); }} className="btn btn-ghost btn-sm">
          <LogOut size={14} /> Logout
        </button>
      </div>

      <div className="container" style={{ paddingTop: "120px" }}>
        {/* Stats */}
        <div className="grid grid-4 mb-3">
          <div className="card card-compact text-center">
            <ShoppingBag size={32} style={{ color: "#f97316", margin: "0 auto 10px" }} />
            <h3 className="title-lg">{stats.orders}</h3>
            <p className="text-small text-muted">Total Orders</p>
          </div>
          <div className="card card-compact text-center">
            <DollarSign size={32} style={{ color: "#22c55e", margin: "0 auto 10px" }} />
            <h3 className="title-lg">${stats.revenue.toFixed(2)}</h3>
            <p className="text-small text-muted">Revenue</p>
          </div>
          <div className="card card-compact text-center">
            <Users size={32} style={{ color: "#3b82f6", margin: "0 auto 10px" }} />
            <h3 className="title-lg">{stats.users}</h3>
            <p className="text-small text-muted">Active Users</p>
          </div>
          <div className="card card-compact text-center">
            <MessageSquare size={32} style={{ color: "#eab308", margin: "0 auto 10px" }} />
            <h3 className="title-lg">{stats.feedback}</h3>
            <p className="text-small text-muted">Pending Feedback</p>
          </div>
        </div>

        {/* Feedback Review */}
        <div className="card card-sm">
          <h3 className="title-md mb-3">Pending Feedback</h3>
          {feedback.filter(f => f.status === "pending").length === 0 ? (
            <p className="text-muted text-center" style={{ padding: "40px" }}>No pending feedback</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {feedback.filter(f => f.status === "pending").map(fb => (
                <div key={fb.id} className="card card-compact" style={{ background: fb.type === "complaint" ? "rgba(239, 68, 68, 0.05)" : "rgba(34, 197, 94, 0.05)" }}>
                  <div className="flex-between mb-2">
                    <div className="flex gap-sm">
                      <span className={fb.type === "complaint" ? "badge badge-danger" : "badge badge-success"}>
                        {fb.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p style={{ margin: "5px 0", fontWeight: "500" }}>From: {fb.from} → To: {fb.target}</p>
                  <p className="text-muted" style={{ margin: "0 0 15px 0" }}>{fb.message}</p>
                  <div className="flex gap-sm">
                    <button className="btn btn-success btn-sm" onClick={() => handleApprove(fb.id)}>
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDismiss(fb.id)}>
                      <XCircle size={16} /> Dismiss
                    </button>
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