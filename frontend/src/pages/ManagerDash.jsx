import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  LogOut,
  ShoppingBag,
  DollarSign,
  MessageSquare,
  CheckCircle,
  XCircle,
  UserX,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Award,
  BookOpen,
  Star,
  ThumbsDown,
} from "lucide-react";
import client from "../api/client";

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [manager, setManager] = useState(null);
  const [activeTab, setActiveTab] = useState("feedback");
  const [stats, setStats] = useState({
    orders: 0,
    revenue: 0,
    users: 0,
    feedback: 0,
  });
  const [feedback, setFeedback] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [flaggedKnowledge, setFlaggedKnowledge] = useState([]);
  const [pendingKnowledge, setPendingKnowledge] = useState([]);
  const [loading, setLoading] = useState(true);

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
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Stats
      const statsRes = await client.get("/manager/stats");
      setStats({
        orders: statsRes.data.total_orders || 0,
        revenue: parseFloat(statsRes.data.total_revenue || 0),
        users: statsRes.data.total_users || 0,
        feedback: statsRes.data.pending_feedback || 0,
      });

      await loadFeedback();
      await loadEmployees();
      await loadCustomers();
      await loadKnowledgeReview();
    } catch (error) {
      console.error("Failed to load manager dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedback = async () => {
    try {
      const res = await client.get("/manager/feedback");
      setFeedback(
        (res.data || []).map((fb) => ({
          id: fb.feedback_id,
          type: (fb.feedback_type || "").toLowerCase(),
          from: fb.from_name || `User #${fb.feedback_from}`,
          fromId: fb.feedback_from,
          target: fb.to_name || `User #${fb.feedback_for}`,
          targetId: fb.feedback_for,
          message: fb.message,
          status: (fb.complaint_status || "open").toLowerCase(),
        }))
      );
    } catch (error) {
      console.error("Failed to load feedback:", error);
      setFeedback([]);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await client.get("/manager/employees");
      setEmployees(res.data || []);
    } catch (error) {
      console.error("Failed to load employees:", error);
      setEmployees([]);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await client.get("/manager/customers");
      setCustomers(res.data || []);
    } catch (error) {
      console.error("Failed to load customers:", error);
      setCustomers([]);
    }
  };

  const loadKnowledgeReview = async () => {
    try {
      // Get flagged knowledge (rating 0)
      const flaggedRes = await client.get("/chat/knowledge/flagged");
      setFlaggedKnowledge(flaggedRes.data || []);

      // Get pending knowledge (needs approval)
      const pendingRes = await client.get("/chat/knowledge/pending");
      setPendingKnowledge(pendingRes.data || []);
    } catch (error) {
      console.error("Failed to load knowledge review:", error);
      setFlaggedKnowledge([]);
      setPendingKnowledge([]);
    }
  };

  const handleApproveFeedback = async (id, isComplaint) => {
    try {
      await client.post(`/manager/feedback/${id}/approve`);
      if (isComplaint) {
        alert("Complaint approved. Warning added to user.");
      } else {
        alert("Compliment approved!");
      }
      await loadFeedback();
      await loadEmployees();
      await loadCustomers();
      await loadDashboardData();
    } catch (error) {
      console.error("Approve failed:", error);
      alert("Failed to approve feedback.");
    }
  };

  const handleDismissFeedback = async (id, fromId) => {
    try {
      await client.post(`/manager/feedback/${id}/dismiss`, {
        reporter_id: fromId,
      });
      alert("Feedback dismissed. Warning added to reporter for false complaint.");
      await loadFeedback();
      await loadCustomers();
      await loadDashboardData();
    } catch (error) {
      console.error("Dismiss failed:", error);
      alert("Failed to dismiss feedback.");
    }
  };

  const handleFireEmployee = async (userId, role) => {
    if (!window.confirm(`Fire this ${role}?`)) return;
    try {
      await client.post(`/manager/employees/${userId}/fire`);
      alert(`${role} fired successfully`);
      await loadEmployees();
    } catch (error) {
      console.error("Fire failed:", error);
      alert("Failed to fire employee");
    }
  };

  const handlePromoteEmployee = async (userId, role) => {
    try {
      await client.post(`/manager/employees/${userId}/promote`);
      alert(`${role} promoted!`);
      await loadEmployees();
    } catch (error) {
      console.error("Promote failed:", error);
      alert("Failed to promote employee");
    }
  };

  const handleDemoteEmployee = async (userId, role) => {
    try {
      await client.post(`/manager/employees/${userId}/demote`);
      alert(`${role} demoted`);
      await loadEmployees();
    } catch (error) {
      console.error("Demote failed:", error);
      alert("Failed to demote employee");
    }
  };

  const handleDeregisterCustomer = async (userId) => {
    if (!window.confirm("Deregister this customer? They will be blacklisted.")) return;
    try {
      await client.post(`/manager/customers/${userId}/deregister`);
      alert("Customer deregistered and blacklisted");
      await loadCustomers();
    } catch (error) {
      console.error("Deregister failed:", error);
      alert("Failed to deregister customer");
    }
  };

  const handleReviewFlagged = async (ratingId, action) => {
    try {
      await client.post(`/chat/knowledge/review/${ratingId}`, {
        action: action,
        manager_id: manager.user_id || manager.id,
      });
      alert(`Knowledge ${action === "remove" ? "removed" : "kept"} successfully!`);
      await loadKnowledgeReview();
    } catch (error) {
      console.error("Review failed:", error);
      alert("Failed to review knowledge.");
    }
  };

  const handleApproveKnowledge = async (kbId) => {
    try {
      await client.post(`/chat/knowledge/approve/${kbId}`);
      alert("Knowledge approved!");
      await loadKnowledgeReview();
    } catch (error) {
      console.error("Approve failed:", error);
      alert("Failed to approve knowledge.");
    }
  };

  const handleRejectKnowledge = async (kbId) => {
    try {
      await client.post(`/chat/knowledge/reject/${kbId}`);
      alert("Knowledge rejected!");
      await loadKnowledgeReview();
    } catch (error) {
      console.error("Reject failed:", error);
      alert("Failed to reject knowledge.");
    }
  };

  if (!manager || loading)
    return (
      <div className="page-center">
        <p>Loading...</p>
      </div>
    );

  const pendingFeedback = feedback.filter(
    (f) =>
      f.type === "complaint" &&
      (f.status === "open" ||
        f.status === "pending" ||
        f.status === "under review")
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="navbar">
        <div className="flex gap-md">
          <div className="brand-logo-sm">
            <Users size={22} />
          </div>
          <span className="brand-name">MANAGER PORTAL</span>
        </div>
        <div className="flex gap-md">
          <span className="text-muted">Welcome, {manager.name}</span>
          <button
            onClick={() => {
              localStorage.removeItem("customer");
              navigate("/login");
            }}
            className="btn btn-ghost btn-sm"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: "120px" }}>
        {/* Stats */}
        <div className="grid grid-4 mb-3">
          <div className="card card-compact text-center">
            <ShoppingBag
              size={32}
              style={{ color: "#f97316", margin: "0 auto 10px" }}
            />
            <h3 className="title-lg">{stats.orders}</h3>
            <p className="text-small text-muted">Total Orders</p>
          </div>
          <div className="card card-compact text-center">
            <DollarSign
              size={32}
              style={{ color: "#22c55e", margin: "0 auto 10px" }}
            />
            <h3 className="title-lg">${stats.revenue.toFixed(2)}</h3>
            <p className="text-small text-muted">Revenue</p>
          </div>
          <div className="card card-compact text-center">
            <Users
              size={32}
              style={{ color: "#3b82f6", margin: "0 auto 10px" }}
            />
            <h3 className="title-lg">{stats.users}</h3>
            <p className="text-small text-muted">Active Users</p>
          </div>
          <div className="card card-compact text-center">
            <MessageSquare
              size={32}
              style={{ color: "#eab308", margin: "0 auto 10px" }}
            />
            <h3 className="title-lg">{stats.feedback}</h3>
            <p className="text-small text-muted">Pending Feedback</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs mb-3">
          <button
            className={activeTab === "feedback" ? "tab active" : "tab"}
            onClick={() => setActiveTab("feedback")}
          >
            Feedback ({pendingFeedback.length})
          </button>
          <button
            className={activeTab === "employees" ? "tab active" : "tab"}
            onClick={() => setActiveTab("employees")}
          >
            Employees ({employees.length})
          </button>
          <button
            className={activeTab === "customers" ? "tab active" : "tab"}
            onClick={() => setActiveTab("customers")}
          >
            Customers ({customers.length})
          </button>
          <button
            className={activeTab === "knowledge" ? "tab active" : "tab"}
            onClick={() => setActiveTab("knowledge")}
          >
            Knowledge ({flaggedKnowledge.length + pendingKnowledge.length})
          </button>
        </div>

        {/* FEEDBACK TAB */}
        {activeTab === "feedback" && (
          <div className="card card-sm">
            <h3 className="title-md mb-3">All Feedback</h3>
            {feedback.length === 0 ? (
              <p className="text-muted text-center" style={{ padding: "40px" }}>
                No feedback yet
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {feedback.map((fb) => (
                  <div
                    key={fb.id}
                    className="card card-compact"
                    style={{
                      background:
                        fb.type === "complaint"
                          ? "rgba(239, 68, 68, 0.05)"
                          : "rgba(34, 197, 94, 0.05)",
                    }}
                  >
                    <div className="flex-between mb-2">
                      <span
                        className={
                          fb.type === "complaint"
                            ? "badge badge-danger"
                            : "badge badge-success"
                        }
                      >
                        {fb.type.toUpperCase()}
                      </span>
                      {fb.status && (
                        <span className="text-small text-muted">
                          Status: {fb.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "5px 0", fontWeight: "500" }}>
                      <strong>From:</strong> {fb.from} →{" "}
                      <strong>To:</strong> {fb.target}
                    </p>
                    <p className="text-muted" style={{ margin: "0 0 15px 0" }}>
                      {fb.message}
                    </p>

                    {fb.type === "complaint" &&
                      (fb.status === "open" ||
                        fb.status === "pending" ||
                        fb.status === "under review") && (
                        <div className="flex gap-sm">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() =>
                              handleApproveFeedback(
                                fb.id,
                                fb.type === "complaint"
                              )
                            }
                          >
                            <CheckCircle size={16} /> Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() =>
                              handleDismissFeedback(fb.id, fb.fromId)
                            }
                          >
                            <XCircle size={16} /> Dismiss
                          </button>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* EMPLOYEES TAB */}
        {activeTab === "employees" && (
          <div className="card card-sm">
            <h3 className="title-md mb-3">Employee Management</h3>
            {employees.length === 0 ? (
              <p className="text-muted text-center" style={{ padding: "40px" }}>
                No employees found
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {employees.map((emp) => (
                  <div key={emp.user_id} className="card card-compact">
                    <div className="flex-between mb-2">
                      <div>
                        <h4 style={{ margin: "0 0 5px 0" }}>{emp.name}</h4>
                        <span className="badge">{emp.role.toUpperCase()}</span>
                        <p className="text-small text-muted">{emp.email}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p
                          style={{
                            margin: "0 0 5px 0",
                            fontWeight: "600",
                          }}
                        >
                          Salary: ${parseFloat(emp.salary || 0).toFixed(2)}
                        </p>
                        <p className="text-small text-muted">
                          Warnings: {emp.amount_warnings || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-sm mt-2">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() =>
                          handlePromoteEmployee(emp.user_id, emp.role)
                        }
                      >
                        <TrendingUp size={14} /> Promote
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          handleDemoteEmployee(emp.user_id, emp.role)
                        }
                      >
                        <TrendingDown size={14} /> Demote
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          handleFireEmployee(emp.user_id, emp.role)
                        }
                      >
                        <UserX size={14} /> Fire
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === "customers" && (
          <div className="card card-sm">
            <h3 className="title-md mb-3">Customer Management</h3>
            {customers.length === 0 ? (
              <p className="text-muted text-center" style={{ padding: "40px" }}>
                No customers found
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {customers.map((cust) => {
                  const warnings = cust.amount_warnings || 0;
                  const isVIP = !!cust.is_vip;
                  const needsAction = warnings >= (isVIP ? 2 : 3);
                  return (
                    <div
                      key={cust.user_id}
                      className="card card-compact"
                      style={{
                        background: needsAction
                          ? "rgba(239, 68, 68, 0.05)"
                          : undefined,
                      }}
                    >
                      <div className="flex-between mb-2">
                        <div>
                          <div className="flex gap-sm mb-1">
                            <h4 style={{ margin: 0 }}>{cust.name}</h4>
                            {isVIP && (
                              <Award
                                size={16}
                                style={{ color: "#f97316" }}
                              />
                            )}
                          </div>
                          <p className="text-small text-muted">
                            {cust.email}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ margin: "0 0 5px 0" }}>
                            Balance: $
                            {parseFloat(cust.total_balance || 0).toFixed(2)}
                          </p>
                          <p
                            className="text-small"
                            style={{
                              color:
                                warnings >= 2 ? "#ef4444" : "#78716c",
                            }}
                          >
                            <AlertTriangle
                              size={14}
                              style={{ verticalAlign: "middle" }}
                            />{" "}
                            {warnings} Warning(s)
                          </p>
                        </div>
                      </div>
                      {needsAction && (
                        <div className="alert alert-error mb-2">
                          {isVIP
                            ? "VIP with 2+ warnings - should be demoted to regular customer (warnings cleared per spec)"
                            : "Customer with 3+ warnings - should be deregistered"}
                        </div>
                      )}
                      <div className="flex gap-sm">
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            handleDeregisterCustomer(cust.user_id)
                          }
                        >
                          <UserX size={14} /> Deregister & Blacklist
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* KNOWLEDGE TAB */}
        {activeTab === "knowledge" && (
          <div>
            {/* Flagged Knowledge Section */}
            {flaggedKnowledge.length > 0 && (
              <div className="card card-sm mb-3">
                <h3 className="title-md mb-3">
                  <AlertTriangle size={20} style={{ color: "#ef4444", verticalAlign: "middle" }} />{" "}
                  Flagged Knowledge ({flaggedKnowledge.length})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  {flaggedKnowledge.map((item) => (
                    <div key={item.rating_id} className="card card-compact" style={{ background: "rgba(239, 68, 68, 0.05)" }}>
                      <div className="flex-between mb-2">
                        <span className="badge badge-danger">
                          <ThumbsDown size={14} /> Flagged by User
                        </span>
                        <span className="text-small text-muted">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <strong>User Question:</strong>
                        <p className="text-small text-muted">{item.question}</p>
                      </div>

                      <div className="mb-2">
                        <strong>KB Answer:</strong>
                        <p style={{ margin: "5px 0", padding: "10px", background: "rgba(249, 115, 22, 0.05)", borderRadius: "8px" }}>
                          {item.answer}
                        </p>
                      </div>

                      {item.feedback && (
                        <div className="mb-2">
                          <strong>User Feedback:</strong>
                          <p className="text-small">"{item.feedback}"</p>
                        </div>
                      )}

                      {item.author_name && (
                        <div className="mb-2 text-small text-muted">
                          <strong>Created by:</strong> {item.author_name}
                        </div>
                      )}

                      <div className="flex gap-sm" style={{ borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: "12px" }}>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleReviewFlagged(item.rating_id, "remove")}
                        >
                          <XCircle size={16} /> Remove & Warn Author
                        </button>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleReviewFlagged(item.rating_id, "keep")}
                        >
                          <CheckCircle size={16} /> Keep Knowledge
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Knowledge Section */}
            {pendingKnowledge.length > 0 && (
              <div className="card card-sm">
                <h3 className="title-md mb-3">
                  <BookOpen size={20} style={{ color: "#f97316", verticalAlign: "middle" }} />{" "}
                  Pending Approval ({pendingKnowledge.length})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  {pendingKnowledge.map((item) => (
                    <div key={item.kb_id} className="card card-compact" style={{ background: "rgba(249, 115, 22, 0.05)" }}>
                      <div className="flex-between mb-2">
                        <span className="badge">Pending Approval</span>
                        <span className="text-small text-muted">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="mb-2">
                        <strong>Question:</strong>
                        <p>{item.question}</p>
                      </div>

                      <div className="mb-2">
                        <strong>Answer:</strong>
                        <p style={{ margin: "5px 0", padding: "10px", background: "white", borderRadius: "8px" }}>
                          {item.answer}
                        </p>
                      </div>

                      <div className="mb-2 text-small text-muted">
                        <strong>Category:</strong> {item.category} | <strong>Submitted by:</strong> {item.author_name}
                      </div>

                      <div className="flex gap-sm" style={{ borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: "12px" }}>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleApproveKnowledge(item.kb_id)}
                        >
                          <CheckCircle size={16} /> Approve
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRejectKnowledge(item.kb_id)}
                        >
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {flaggedKnowledge.length === 0 && pendingKnowledge.length === 0 && (
              <div className="card card-sm">
                <div className="text-center" style={{ padding: "60px 20px" }}>
                  <CheckCircle size={48} style={{ color: "#22c55e", margin: "0 auto 15px" }} />
                  <h3 className="title-md mb-2">All Clear!</h3>
                  <p className="text-muted">No knowledge entries need review at this time.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Users,
//   LogOut,
//   ShoppingBag,
//   DollarSign,
//   MessageSquare,
//   CheckCircle,
//   XCircle,
//   UserX,
//   AlertTriangle,
//   TrendingUp,
//   TrendingDown,
//   Award,
// } from "lucide-react";
// import client from "../api/client";

// export default function ManagerDashboard() {
//   const navigate = useNavigate();
//   const [manager, setManager] = useState(null);
//   const [activeTab, setActiveTab] = useState("feedback");
//   const [stats, setStats] = useState({
//     orders: 0,
//     revenue: 0,
//     users: 0,
//     feedback: 0,
//   });
//   const [feedback, setFeedback] = useState([]);
//   const [employees, setEmployees] = useState([]);
//   const [customers, setCustomers] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const stored = localStorage.getItem("customer");
//     if (!stored) {
//       navigate("/login");
//       return;
//     }
//     const user = JSON.parse(stored);
//     if (user.role !== "manager") {
//       alert("Access denied. Manager role required.");
//       navigate("/login");
//       return;
//     }
//     setManager(user);
//     loadDashboardData();
//   }, [navigate]);

//   const loadDashboardData = async () => {
//     try {
//       setLoading(true);

//       // Stats
//       const statsRes = await client.get("/manager/stats");
//       setStats({
//         orders: statsRes.data.total_orders || 0,
//         revenue: parseFloat(statsRes.data.total_revenue || 0),
//         users: statsRes.data.total_users || 0,
//         feedback: statsRes.data.pending_feedback || 0,
//       });

//       await loadFeedback();
//       await loadEmployees();
//       await loadCustomers();
//     } catch (error) {
//       console.error("Failed to load manager dashboard:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadFeedback = async () => {
//     try {
//       const res = await client.get("/manager/feedback");
//       setFeedback(
//         (res.data || []).map((fb) => ({
//           id: fb.feedback_id,
//           type: (fb.feedback_type || "").toLowerCase(), // complaint / compliment
//           from: fb.from_name || `User #${fb.feedback_from}`,
//           fromId: fb.feedback_from,
//           target: fb.to_name || `User #${fb.feedback_for}`,
//           targetId: fb.feedback_for,
//           message: fb.message,
//           status: (fb.complaint_status || "open").toLowerCase(), // open / resolved / dismissed / n/a / under review
//         }))
//       );
//     } catch (error) {
//       console.error("Failed to load feedback:", error);
//       setFeedback([]);
//     }
//   };

//   const loadEmployees = async () => {
//     try {
//       const res = await client.get("/manager/employees");
//       setEmployees(res.data || []);
//     } catch (error) {
//       console.error("Failed to load employees:", error);
//       setEmployees([]);
//     }
//   };

//   const loadCustomers = async () => {
//     try {
//       const res = await client.get("/manager/customers");
//       setCustomers(res.data || []);
//     } catch (error) {
//       console.error("Failed to load customers:", error);
//       setCustomers([]);
//     }
//   };

//   const handleApproveFeedback = async (id, isComplaint) => {
//     try {
//       await client.post(`/manager/feedback/${id}/approve`);
//       if (isComplaint) {
//         alert("Complaint approved. Warning added to user.");
//       } else {
//         alert("Compliment approved!");
//       }
//       await loadFeedback();
//       await loadEmployees();
//       await loadCustomers();
//       await loadDashboardData(); // refresh stats count
//     } catch (error) {
//       console.error("Approve failed:", error);
//       alert("Failed to approve feedback.");
//     }
//   };

//   const handleDismissFeedback = async (id, fromId) => {
//     try {
//       await client.post(`/manager/feedback/${id}/dismiss`, {
//         reporter_id: fromId,
//       });
//       alert("Feedback dismissed. Warning added to reporter for false complaint.");
//       await loadFeedback();
//       await loadCustomers();
//       await loadDashboardData();
//     } catch (error) {
//       console.error("Dismiss failed:", error);
//       alert("Failed to dismiss feedback.");
//     }
//   };

//   const handleFireEmployee = async (userId, role) => {
//     if (!window.confirm(`Fire this ${role}?`)) return;
//     try {
//       await client.post(`/manager/employees/${userId}/fire`);
//       alert(`${role} fired successfully`);
//       await loadEmployees();
//     } catch (error) {
//       console.error("Fire failed:", error);
//       alert("Failed to fire employee");
//     }
//   };

//   const handlePromoteEmployee = async (userId, role) => {
//     try {
//       await client.post(`/manager/employees/${userId}/promote`);
//       alert(`${role} promoted!`);
//       await loadEmployees();
//     } catch (error) {
//       console.error("Promote failed:", error);
//       alert("Failed to promote employee");
//     }
//   };

//   const handleDemoteEmployee = async (userId, role) => {
//     try {
//       await client.post(`/manager/employees/${userId}/demote`);
//       alert(`${role} demoted`);
//       await loadEmployees();
//     } catch (error) {
//       console.error("Demote failed:", error);
//       alert("Failed to demote employee");
//     }
//   };

//   const handleDeregisterCustomer = async (userId) => {
//     if (!window.confirm("Deregister this customer? They will be blacklisted.")) return;
//     try {
//       await client.post(`/manager/customers/${userId}/deregister`);
//       alert("Customer deregistered and blacklisted");
//       await loadCustomers();
//     } catch (error) {
//       console.error("Deregister failed:", error);
//       alert("Failed to deregister customer");
//     }
//   };

//   if (!manager || loading)
//     return (
//       <div className="page-center">
//         <p>Loading...</p>
//       </div>
//     );

//   // For tab badge: only treat open/pending/under review complaints as "pending"
//   const pendingFeedback = feedback.filter(
//     (f) =>
//       f.type === "complaint" &&
//       (f.status === "open" ||
//         f.status === "pending" ||
//         f.status === "under review")
//   );

//   return (
//     <div className="page">
//       {/* Header */}
//       <div className="navbar">
//         <div className="flex gap-md">
//           <div className="brand-logo-sm">
//             <Users size={22} />
//           </div>
//           <span className="brand-name">MANAGER PORTAL</span>
//         </div>
//         <div className="flex gap-md">
//           <span className="text-muted">Welcome, {manager.name}</span>
//           <button
//             onClick={() => {
//               localStorage.removeItem("customer");
//               navigate("/login");
//             }}
//             className="btn btn-ghost btn-sm"
//           >
//             <LogOut size={14} /> Logout
//           </button>
//         </div>
//       </div>

//       <div className="container" style={{ paddingTop: "120px" }}>
//         {/* Stats */}
//         <div className="grid grid-4 mb-3">
//           <div className="card card-compact text-center">
//             <ShoppingBag
//               size={32}
//               style={{ color: "#f97316", margin: "0 auto 10px" }}
//             />
//             <h3 className="title-lg">{stats.orders}</h3>
//             <p className="text-small text-muted">Total Orders</p>
//           </div>
//           <div className="card card-compact text-center">
//             <DollarSign
//               size={32}
//               style={{ color: "#22c55e", margin: "0 auto 10px" }}
//             />
//             <h3 className="title-lg">${stats.revenue.toFixed(2)}</h3>
//             <p className="text-small text-muted">Revenue</p>
//           </div>
//           <div className="card card-compact text-center">
//             <Users
//               size={32}
//               style={{ color: "#3b82f6", margin: "0 auto 10px" }}
//             />
//             <h3 className="title-lg">{stats.users}</h3>
//             <p className="text-small text-muted">Active Users</p>
//           </div>
//           <div className="card card-compact text-center">
//             <MessageSquare
//               size={32}
//               style={{ color: "#eab308", margin: "0 auto 10px" }}
//             />
//             <h3 className="title-lg">{stats.feedback}</h3>
//             <p className="text-small text-muted">Pending Feedback</p>
//           </div>
//         </div>

//         {/* Tabs */}
//         <div className="tabs mb-3">
//           <button
//             className={activeTab === "feedback" ? "tab active" : "tab"}
//             onClick={() => setActiveTab("feedback")}
//           >
//             Feedback ({pendingFeedback.length})
//           </button>
//           <button
//             className={activeTab === "employees" ? "tab active" : "tab"}
//             onClick={() => setActiveTab("employees")}
//           >
//             Employees ({employees.length})
//           </button>
//           <button
//             className={activeTab === "customers" ? "tab active" : "tab"}
//             onClick={() => setActiveTab("customers")}
//           >
//             Customers ({customers.length})
//           </button>
//         </div>

//         {/* FEEDBACK TAB */}
//         {activeTab === "feedback" && (
//           <div className="card card-sm">
//             <h3 className="title-md mb-3">All Feedback</h3>
//             {feedback.length === 0 ? (
//               <p className="text-muted text-center" style={{ padding: "40px" }}>
//                 No feedback yet
//               </p>
//             ) : (
//               <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
//                 {feedback.map((fb) => (
//                   <div
//                     key={fb.id}
//                     className="card card-compact"
//                     style={{
//                       background:
//                         fb.type === "complaint"
//                           ? "rgba(239, 68, 68, 0.05)"
//                           : "rgba(34, 197, 94, 0.05)",
//                     }}
//                   >
//                     <div className="flex-between mb-2">
//                       <span
//                         className={
//                           fb.type === "complaint"
//                             ? "badge badge-danger"
//                             : "badge badge-success"
//                         }
//                       >
//                         {fb.type.toUpperCase()}
//                       </span>
//                       {fb.status && (
//                         <span className="text-small text-muted">
//                           Status: {fb.status.toUpperCase()}
//                         </span>
//                       )}
//                     </div>
//                     <p style={{ margin: "5px 0", fontWeight: "500" }}>
//                       <strong>From:</strong> {fb.from} →{" "}
//                       <strong>To:</strong> {fb.target}
//                     </p>
//                     <p className="text-muted" style={{ margin: "0 0 15px 0" }}>
//                       {fb.message}
//                     </p>

//                     {fb.type === "complaint" &&
//                       (fb.status === "open" ||
//                         fb.status === "pending" ||
//                         fb.status === "under review") && (
//                         <div className="flex gap-sm">
//                           <button
//                             className="btn btn-success btn-sm"
//                             onClick={() =>
//                               handleApproveFeedback(
//                                 fb.id,
//                                 fb.type === "complaint"
//                               )
//                             }
//                           >
//                             <CheckCircle size={16} /> Approve
//                           </button>
//                           <button
//                             className="btn btn-danger btn-sm"
//                             onClick={() =>
//                               handleDismissFeedback(fb.id, fb.fromId)
//                             }
//                           >
//                             <XCircle size={16} /> Dismiss
//                           </button>
//                         </div>
//                       )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}

//         {/* EMPLOYEES TAB */}
//         {activeTab === "employees" && (
//           <div className="card card-sm">
//             <h3 className="title-md mb-3">Employee Management</h3>
//             {employees.length === 0 ? (
//               <p className="text-muted text-center" style={{ padding: "40px" }}>
//                 No employees found
//               </p>
//             ) : (
//               <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
//                 {employees.map((emp) => (
//                   <div key={emp.user_id} className="card card-compact">
//                     <div className="flex-between mb-2">
//                       <div>
//                         <h4 style={{ margin: "0 0 5px 0" }}>{emp.name}</h4>
//                         <span className="badge">{emp.role.toUpperCase()}</span>
//                         <p className="text-small text-muted">{emp.email}</p>
//                       </div>
//                       <div style={{ textAlign: "right" }}>
//                         <p
//                           style={{
//                             margin: "0 0 5px 0",
//                             fontWeight: "600",
//                           }}
//                         >
//                           Salary: ${parseFloat(emp.salary || 0).toFixed(2)}
//                         </p>
//                         <p className="text-small text-muted">
//                           Warnings: {emp.amount_warnings || 0}
//                         </p>
//                       </div>
//                     </div>
//                     <div className="flex gap-sm mt-2">
//                       <button
//                         className="btn btn-success btn-sm"
//                         onClick={() =>
//                           handlePromoteEmployee(emp.user_id, emp.role)
//                         }
//                       >
//                         <TrendingUp size={14} /> Promote
//                       </button>
//                       <button
//                         className="btn btn-secondary btn-sm"
//                         onClick={() =>
//                           handleDemoteEmployee(emp.user_id, emp.role)
//                         }
//                       >
//                         <TrendingDown size={14} /> Demote
//                       </button>
//                       <button
//                         className="btn btn-danger btn-sm"
//                         onClick={() =>
//                           handleFireEmployee(emp.user_id, emp.role)
//                         }
//                       >
//                         <UserX size={14} /> Fire
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}

//         {/* CUSTOMERS TAB */}
//         {activeTab === "customers" && (
//           <div className="card card-sm">
//             <h3 className="title-md mb-3">Customer Management</h3>
//             {customers.length === 0 ? (
//               <p className="text-muted text-center" style={{ padding: "40px" }}>
//                 No customers found
//               </p>
//             ) : (
//               <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
//                 {customers.map((cust) => {
//                   const warnings = cust.amount_warnings || 0;
//                   const isVIP = !!cust.is_vip;
//                   const needsAction = warnings >= (isVIP ? 2 : 3);
//                   return (
//                     <div
//                       key={cust.user_id}
//                       className="card card-compact"
//                       style={{
//                         background: needsAction
//                           ? "rgba(239, 68, 68, 0.05)"
//                           : undefined,
//                       }}
//                     >
//                       <div className="flex-between mb-2">
//                         <div>
//                           <div className="flex gap-sm mb-1">
//                             <h4 style={{ margin: 0 }}>{cust.name}</h4>
//                             {isVIP && (
//                               <Award
//                                 size={16}
//                                 style={{ color: "#f97316" }}
//                               />
//                             )}
//                           </div>
//                           <p className="text-small text-muted">
//                             {cust.email}
//                           </p>
//                         </div>
//                         <div style={{ textAlign: "right" }}>
//                           <p style={{ margin: "0 0 5px 0" }}>
//                             Balance: $
//                             {parseFloat(cust.total_balance || 0).toFixed(2)}
//                           </p>
//                           <p
//                             className="text-small"
//                             style={{
//                               color:
//                                 warnings >= 2 ? "#ef4444" : "#78716c",
//                             }}
//                           >
//                             <AlertTriangle
//                               size={14}
//                               style={{ verticalAlign: "middle" }}
//                             />{" "}
//                             {warnings} Warning(s)
//                           </p>
//                         </div>
//                       </div>
//                       {needsAction && (
//                         <div className="alert alert-error mb-2">
//                           {isVIP
//                             ? "VIP with 2+ warnings - should be demoted to regular customer (warnings cleared per spec)"
//                             : "Customer with 3+ warnings - should be deregistered"}
//                         </div>
//                       )}
//                       <div className="flex gap-sm">
//                         <button
//                           className="btn btn-danger btn-sm"
//                           onClick={() =>
//                             handleDeregisterCustomer(cust.user_id)
//                           }
//                         >
//                           <UserX size={14} /> Deregister & Blacklist
//                         </button>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
