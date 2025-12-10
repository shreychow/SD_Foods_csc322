import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ThumbsUp, ThumbsDown, AlertCircle, MessageSquare, User, UtensilsCrossed, Truck } from "lucide-react";
import client from "../api/client";

export default function FeedbackPage() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState("submit");
  const [feedbackType, setFeedbackType] = useState("compliment");
  const [targetType, setTargetType] = useState("chef");
  const [targetId, setTargetId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [myFeedback, setMyFeedback] = useState([]);
  const [feedbackReceived, setFeedbackReceived] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("customer");
    if (!stored) {
      alert("Please login first");
      navigate("/login");
      return;
    }
    setCustomer(JSON.parse(stored));
    loadFeedbackHistory();
  }, [navigate]);

  const loadFeedbackHistory = () => {
    // Demo data - replace with API call
    setMyFeedback([
      { id: 1, type: "compliment", targetType: "chef", targetName: "Chef Mario", orderId: "ORD-1234", message: "Amazing pizza!", status: "approved", date: "2024-12-08" },
      { id: 2, type: "complaint", targetType: "delivery", targetName: "John Driver", orderId: "ORD-1235", message: "Late delivery", status: "pending", date: "2024-12-07" },
    ]);
    setFeedbackReceived([
      { id: 3, type: "compliment", fromName: "Sarah M.", message: "Great service!", status: "approved", date: "2024-12-06", canDispute: false },
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !targetId.trim()) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await client.post("/feedback/submit", {
        customer_id: customer?.customer_id || customer?.id,
        type: feedbackType,
        target_type: targetType,
        target_id: targetId,
        order_id: orderId,
        message: message.trim()
      });

      alert(`${feedbackType === "compliment" ? "Compliment" : "Complaint"} submitted successfully!`);
      setMessage("");
      setTargetId("");
      setOrderId("");
      loadFeedbackHistory();
    } catch (error) {
      console.error("Feedback error:", error);
      alert("Submitted! (Demo mode - backend not connected)");
      setMessage("");
      setTargetId("");
      setOrderId("");
    } finally {
      setLoading(false);
    }
  };

  const handleDispute = async (feedbackId) => {
    if (!window.confirm("Are you sure you want to dispute this complaint?")) return;
    
    try {
      await client.post(`/feedback/dispute/${feedbackId}`, {
        customer_id: customer?.customer_id || customer?.id
      });
      alert("Dispute submitted! A manager will review it.");
      loadFeedbackHistory();
    } catch (error) {
      alert("Dispute submitted! (Demo mode)");
    }
  };

  if (!customer) return <div className="page-center"><p>Loading...</p></div>;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: "1000px" }}>
        <button className="btn btn-secondary mb-3" onClick={() => navigate("/customer")}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <div className="card card-sm mb-3">
          <h2 className="title-md">Feedback & Reputation</h2>
          <p className="text-muted text-small">Submit compliments or complaints, and manage your feedback history</p>
        </div>

        {/* Tabs */}
        <div className="tabs mb-3">
          <button className={activeTab === "submit" ? "tab active" : "tab"} onClick={() => setActiveTab("submit")}>
            Submit Feedback
          </button>
          <button className={activeTab === "sent" ? "tab active" : "tab"} onClick={() => setActiveTab("sent")}>
            My Feedback ({myFeedback.length})
          </button>
          <button className={activeTab === "received" ? "tab active" : "tab"} onClick={() => setActiveTab("received")}>
            Received ({feedbackReceived.length})
          </button>
        </div>

        {/* Submit Feedback Tab */}
        {activeTab === "submit" && (
          <div className="card card-sm">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Feedback Type</label>
                <div className="flex gap-sm">
                  <button
                    type="button"
                    className={feedbackType === "compliment" ? "btn btn-primary" : "btn btn-secondary"}
                    onClick={() => setFeedbackType("compliment")}
                  >
                    <ThumbsUp size={18} /> Compliment
                  </button>
                  <button
                    type="button"
                    className={feedbackType === "complaint" ? "btn btn-primary" : "btn btn-secondary"}
                    onClick={() => setFeedbackType("complaint")}
                  >
                    <ThumbsDown size={18} /> Complaint
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Target</label>
                <div className="flex gap-sm">
                  <button
                    type="button"
                    className={targetType === "chef" ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
                    onClick={() => setTargetType("chef")}
                  >
                    <UtensilsCrossed size={16} /> Chef
                  </button>
                  <button
                    type="button"
                    className={targetType === "delivery" ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
                    onClick={() => setTargetType("delivery")}
                  >
                    <Truck size={16} /> Delivery Person
                  </button>
                  <button
                    type="button"
                    className={targetType === "customer" ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
                    onClick={() => setTargetType("customer")}
                  >
                    <User size={16} /> Customer
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{targetType === "chef" ? "Chef" : targetType === "delivery" ? "Delivery Person" : "Customer"} ID/Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder={`Enter ${targetType} ID or name`}
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  required
                />
                <p className="text-small text-muted" style={{ marginTop: "5px" }}>
                  You can find this in your order history
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Order ID (Optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="ORD-1234"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  className="input"
                  rows="5"
                  placeholder={`Write your ${feedbackType} here...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  style={{ resize: "vertical" }}
                />
                <p className="text-small text-muted" style={{ marginTop: "5px" }}>
                  Be specific and professional. All feedback is reviewed by managers.
                </p>
              </div>

              <div className="alert alert-info">
                <AlertCircle size={15} /> <strong>Important:</strong> False complaints may result in warnings. Provide accurate and honest feedback.
                <div style={{ flex: 1, marginLeft: "10px" }}>
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? "Submitting..." : `Submit ${feedbackType === "compliment" ? "Compliment" : "Complaint"}`}
              </button>
            </form>
          </div>
        )}

        {/* My Feedback Tab */}
        {activeTab === "sent" && (
          <div className="card card-sm">
            <h3 className="title-md">Feedback I've Submitted</h3>
            {myFeedback.length === 0 ? (
              <div className="text-center" style={{ padding: "40px 20px" }}>
                <MessageSquare size={48} style={{ color: "#a8a29e", margin: "0 auto 15px", display: "block" }} />
                <p className="text-muted">You haven't submitted any feedback yet</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {myFeedback.map((fb) => (
                  <div key={fb.id} className="card card-compact" style={{ background: "rgba(249, 115, 22, 0.05)" }}>
                    <div className="flex-between mb-2">
                      <div className="flex gap-sm">
                        <span className={fb.type === "compliment" ? "badge badge-success" : "badge badge-danger"}>
                          {fb.type === "compliment" ? <ThumbsUp size={14} /> : <ThumbsDown size={14} />}
                          {fb.type.toUpperCase()}
                        </span>
                        <span className="badge">{fb.targetType.toUpperCase()}</span>
                        <span className={`badge ${fb.status === "approved" ? "badge-success" : fb.status === "dismissed" ? "badge-danger" : "badge-warning"}`}>
                          {fb.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-small text-muted">{fb.date}</span>
                    </div>
                    <p style={{ margin: "5px 0", fontWeight: "500", color: "#78716c" }}>
                      To: {fb.targetName} {fb.orderId && `(Order: ${fb.orderId})`}
                    </p>
                    <p className="text-muted" style={{ margin: 0 }}>{fb.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Received Feedback Tab */}
        {activeTab === "received" && (
          <div className="card card-sm">
            <h3 className="title-md">Feedback I've Received</h3>
            {feedbackReceived.length === 0 ? (
              <div className="text-center" style={{ padding: "40px 20px" }}>
                <MessageSquare size={48} style={{ color: "#a8a29e", margin: "0 auto 15px", display: "block" }} />
                <p className="text-muted">You haven't received any feedback yet</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {feedbackReceived.map((fb) => (
                  <div key={fb.id} className="card card-compact" style={{ background: fb.type === "complaint" ? "rgba(239, 68, 68, 0.05)" : "rgba(16, 185, 129, 0.05)" }}>
                    <div className="flex-between mb-2">
                      <div className="flex gap-sm">
                        <span className={fb.type === "compliment" ? "badge badge-success" : "badge badge-danger"}>
                          {fb.type === "compliment" ? <ThumbsUp size={14} /> : <ThumbsDown size={14} />}
                          {fb.type.toUpperCase()}
                        </span>
                        <span className={`badge ${fb.status === "approved" ? "badge-success" : fb.status === "dismissed" ? "badge-danger" : "badge-warning"}`}>
                          {fb.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-small text-muted">{fb.date}</span>
                    </div>
                    <p style={{ margin: "5px 0", fontWeight: "500", color: "#78716c" }}>
                      From: {fb.fromName}
                    </p>
                    <p className="text-muted" style={{ margin: "0 0 10px 0" }}>{fb.message}</p>
                    
                    {fb.type === "complaint" && fb.status === "pending" && (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDispute(fb.id)}
                      >
                        <AlertCircle size={16} />
                        Dispute This Complaint
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}