import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  MessageSquare,
  User,
  UtensilsCrossed,
  Truck 
} from "lucide-react";

import client from "../api/client";

export default function FeedbackPage() {
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState("submit");

  // Form fields
  const [feedbackType, setFeedbackType] = useState("compliment");
  const [targetType, setTargetType] = useState("chef");
  const [targetId, setTargetId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Data loaded from backend
  const [myFeedback, setMyFeedback] = useState([]);
  const [feedbackReceived, setFeedbackReceived] = useState([]);

  // Load user + fetch history
  useEffect(() => {
    const stored = localStorage.getItem("customer");
    if (!stored) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    const user = JSON.parse(stored);
    setCustomer(user);

    fetchFeedbackHistory(user.customer_id || user.id);
  }, [navigate]);

  // Fetch feedback from backend
  const fetchFeedbackHistory = async (customerId) => {
    try {
      const sentRes = await client.get(`/feedback/sent/${customerId}`);
      const receivedRes = await client.get(`/feedback/received/${customerId}`);

      setMyFeedback(sentRes.data || []);
      setFeedbackReceived(receivedRes.data || []);
    } catch (err) {
      console.error("Error loading feedback history:", err);
      setMyFeedback([]);
      setFeedbackReceived([]);
    }
  };

  // Submit feedback
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!targetId.trim() || !message.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      await client.post("/feedback/submit", {
        customer_id: customer.customer_id || customer.id,
        type: feedbackType,
        target_type: targetType,
        target_id: targetId,
        order_id: orderId || null,
        message: message.trim(),
      });

      alert("Feedback submitted successfully!");

      // Reset form
      setMessage("");
      setTargetId("");
      setOrderId("");

      // Reload history from backend
      fetchFeedbackHistory(customer.customer_id || customer.id);

    } catch (err) {
      console.error("Submit feedback failed:", err);
      alert(err.response?.data?.error || "Unable to submit feedback");
    }

    setLoading(false);
  };

  // Submit dispute
  const handleDispute = async (id) => {
    if (!window.confirm("Are you sure you want to dispute this complaint?")) return;

    try {
      await client.post(`/feedback/dispute/${id}`, {
        customer_id: customer.customer_id || customer.id,
      });

      alert("Dispute submitted!");
      fetchFeedbackHistory(customer.customer_id || customer.id);
    } catch (err) {
      alert(err.response?.data?.error || "Unable to dispute feedback");
    }
  };

  if (!customer) return <div className="page-center"><p>Loading...</p></div>;

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: "1000px" }}>
        
        {/* Back button */}
        <button className="btn btn-secondary mb-3" onClick={() => navigate("/customer")}>
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <div className="card card-sm mb-3">
          <h2 className="title-md">Feedback & Reputation</h2>
          <p className="text-muted text-small">
            Send compliments or complaints and view your feedback history.
          </p>
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

        {/* SUBMIT FEEDBACK */}
        {activeTab === "submit" && (
          <div className="card card-sm">
            <form onSubmit={handleSubmit}>
              
              {/* Feedback Type */}
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

              {/* Target */}
              <div className="form-group">
                <label className="form-label">Target</label>
                <div className="flex gap-sm">
                  <button type="button" className={targetType === "chef" ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"} onClick={() => setTargetType("chef")}>
                    <UtensilsCrossed size={16} /> Chef
                  </button>
                  <button type="button" className={targetType === "delivery" ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"} onClick={() => setTargetType("delivery")}>
                    <Truck size={16} /> Delivery
                  </button>
                  <button type="button" className={targetType === "customer" ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"} onClick={() => setTargetType("customer")}>
                    <User size={16} /> Customer
                  </button>
                </div>
              </div>

              {/* Target ID */}
              <div className="form-group">
                <label className="form-label">
                  {targetType === "chef" ? "Chef" : targetType === "delivery" ? "Delivery Person" : "Customer"} ID
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter ID"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  required
                />
              </div>

              {/* Order ID (optional) */}
              <div className="form-group">
                <label className="form-label">Order ID (Optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Order ID"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                />
              </div>

              {/* Message */}
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  className="input"
                  rows="5"
                  placeholder={`Write your ${feedbackType}...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              <div className="alert alert-info">
                <AlertCircle size={16} />
                Please be respectful and accurate. Managers review all feedback.
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? "Submitting..." : "Submit Feedback"}
              </button>

            </form>
          </div>
        )}

        {/* SENT FEEDBACK */}
        {activeTab === "sent" && (
          <div className="card card-sm">
            <h3 className="title-md">My Submitted Feedback</h3>

            {myFeedback.length === 0 ? (
              <div className="text-center" style={{ padding: "40px 20px" }}>
                <MessageSquare size={48} style={{ color: "#a8a29e", marginBottom: "10px" }} />
                <p className="text-muted">No feedback submitted yet</p>
              </div>
            ) : (
              myFeedback.map((fb) => (
                <div key={fb.id} className="card card-compact">
                  <div className="flex-between mb-2">
                    <span className="badge">{fb.type.toUpperCase()}</span>
                    <span className="text-small text-muted">{fb.date}</span>
                  </div>
                  <p><strong>To:</strong> {fb.target_type} (ID: {fb.target_id})</p>
                  <p>{fb.message}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* RECEIVED FEEDBACK */}
        {activeTab === "received" && (
          <div className="card card-sm">
            <h3 className="title-md">Feedback I Received</h3>

            {feedbackReceived.length === 0 ? (
              <div className="text-center" style={{ padding: "40px 20px" }}>
                <MessageSquare size={48} style={{ color: "#a8a29e", marginBottom: "10px" }} />
                <p className="text-muted">You haven't received feedback yet</p>
              </div>
            ) : (
              feedbackReceived.map((fb) => (
                <div key={fb.id} className="card card-compact">
                  <div className="flex-between mb-2">
                    <span className="badge">{fb.type.toUpperCase()}</span>
                    <span className="text-small text-muted">{fb.date}</span>
                  </div>
                  <p><strong>From:</strong> {fb.from_name}</p>
                  <p>{fb.message}</p>

                  {fb.type === "complaint" && fb.status === "pending" && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleDispute(fb.id)}>
                      <AlertCircle size={16} />
                      Dispute
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
