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
  Truck,
  Package,
  Star,
  Crown,
  UserCheck,
} from "lucide-react";
import client from "../api/client";
import KnowledgeReview from "../components/KnowledgeReview"; // 👈 ADDED

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [manager, setManager] = useState(null);
  const [activeTab, setActiveTab] = useState("feedback");
  const [stats, setStats] = useState({
    orders: 0,
    revenue: 0,
    users: 0,
    employees: 0,
    feedback: 0,
    bids: 0,
    vipRequests: 0,
  });
  const [feedback, setFeedback] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [pendingBids, setPendingBids] = useState([]);
  const [vipRequests, setVipRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidJustification, setBidJustification] = useState({});

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
        employees: statsRes.data.employee_count || 0,
        feedback: statsRes.data.pending_feedback || 0,
        bids: statsRes.data.pending_bids || 0,
        vipRequests: statsRes.data.vip_requests || 0,
      });

      await Promise.all([
        loadFeedback(),
        loadEmployees(),
        loadCustomers(),
        loadPendingBids(),
        loadVipRequests(),
      ]);
    } catch (error) {
      console.error("Failed to load manager dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedback = async () => {
    try {
      const res = await client.get("/manager/feedback");
      setFeedback(res.data || []);
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

  const loadPendingBids = async () => {
    try {
      const res = await client.get("/manager/bids/pending");
      setPendingBids(res.data || []);
    } catch (error) {
      console.error("Failed to load bids:", error);
      setPendingBids([]);
    }
  };

  const loadVipRequests = async () => {
    try {
      const res = await client.get("/manager/vip/requests");
      setVipRequests(res.data || []);
    } catch (error) {
      console.error("Failed to load VIP requests:", error);
      setVipRequests([]);
    }
  };

  const handleApproveFeedback = async (id) => {
    try {
      await client.post(`/manager/feedback/${id}/approve`);
      alert("Feedback approved. Warning added to user.");
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
      alert("Feedback dismissed. Warning added to reporter.");
      await loadDashboardData();
    } catch (error) {
      console.error("Dismiss failed:", error);
      alert("Failed to dismiss feedback.");
    }
  };

  const handleApproveBid = async (bidId, isLowest) => {
    try {
      const justification = bidJustification[bidId] || "";

      if (!isLowest && !justification) {
        alert("Please enter justification for approving higher bid");
        return;
      }

      await client.post(`/manager/bids/${bidId}/approve`, {
        justification: justification,
      });

      alert("Bid approved! Driver assigned to order.");
      setBidJustification({ ...bidJustification, [bidId]: "" });
      await loadDashboardData();
    } catch (error) {
      console.error("Approve bid failed:", error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert("Failed to approve bid");
      }
    }
  };

  const handleRejectBid = async (bidId) => {
    try {
      await client.post(`/manager/bids/${bidId}/reject`);
      alert("Bid rejected");
      await loadDashboardData();
    } catch (error) {
      console.error("Reject bid failed:", error);
      alert("Failed to reject bid");
    }
  };

  const handleApproveVip = async (requestId) => {
    try {
      await client.post(`/manager/vip/${requestId}/approve`);
      alert("VIP request approved!");
      await loadDashboardData();
    } catch (error) {
      console.error("Approve VIP failed:", error);
      alert("Failed to approve VIP request");
    }
  };

  const handleRejectVip = async (requestId) => {
    try {
      await client.post(`/manager/vip/${requestId}/reject`);
      alert("VIP request rejected");
      await loadDashboardData();
    } catch (error) {
      console.error("Reject VIP failed:", error);
      alert("Failed to reject VIP request");
    }
  };

  const handleDemoteVip = async (customerId) => {
    if (!window.confirm("Demote this VIP to regular customer?")) return;
    try {
      await client.post(`/manager/vip/${customerId}/demote`);
      alert("VIP demoted to regular customer");
      await loadDashboardData();
    } catch (error) {
      console.error("Demote VIP failed:", error);
      alert("Failed to demote VIP");
    }
  };

  const handleFireEmployee = async (userId, name) => {
    if (!window.confirm(`Fire ${name}?`)) return;
    try {
      await client.post(`/manager/employees/${userId}/fire`);
      alert(`${name} fired successfully`);
      await loadDashboardData();
    } catch (error) {
      console.error("Fire failed:", error);
      alert("Failed to fire employee");
    }
  };

  const handlePromoteEmployee = async (userId, name) => {
    try {
      await client.post(`/manager/employees/${userId}/promote`);
      alert(`${name} promoted! Salary increased by 10%`);
      await loadDashboardData();
    } catch (error) {
      console.error("Promote failed:", error);
      alert("Failed to promote employee");
    }
  };

  const handleDemoteEmployee = async (userId, name) => {
    try {
      await client.post(`/manager/employees/${userId}/demote`);
      alert(`${name} demoted. Salary decreased by 10%`);
      await loadDashboardData();
    } catch (error) {
      console.error("Demote failed:", error);
      alert("Failed to demote employee");
    }
  };

  const handleDeregisterCustomer = async (userId, name) => {
    if (!window.confirm(`Deregister ${name}? They will be blacklisted.`)) return;
    try {
      await client.post(`/manager/customers/${userId}/deregister`);
      alert(`${name} deregistered and blacklisted`);
      await loadDashboardData();
    } catch (error) {
      console.error("Deregister failed:", error);
      alert("Failed to deregister customer");
    }
  };

  if (!manager || loading) {
    return (
      <div className="page-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Group bids by order
  const bidsByOrder = {};
  pendingBids.forEach((bid) => {
    if (!bidsByOrder[bid.order_id]) {
      bidsByOrder[bid.order_id] = {
        order_id: bid.order_id,
        customer_name: bid.customer_name,
        delivered_to: bid.delivered_to,
        order_total: bid.order_total,
        bids: [],
      };
    }
    bidsByOrder[bid.order_id].bids.push(bid);
  });

  const pendingComplaints = feedback.filter(
    (f) =>
      f.feedback_type === "complaint" &&
      ["Open", "Pending", "Under Review"].includes(f.complaint_status)
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
        {/* Stats Cards */}
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
            <h3 className="title-lg">{stats.employees}</h3>
            <p className="text-small text-muted">Employees</p>
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
            Feedback ({pendingComplaints.length})
          </button>
          <button
            className={activeTab === "bids" ? "tab active" : "tab"}
            onClick={() => setActiveTab("bids")}
          >
            Bids ({Object.keys(bidsByOrder).length})
          </button>
          <button
            className={activeTab === "vip" ? "tab active" : "tab"}
            onClick={() => setActiveTab("vip")}
          >
            VIP Requests ({vipRequests.length})
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
          {/* 🔹 NEW KNOWLEDGE TAB */}
          <button
            className={activeTab === "knowledge" ? "tab active" : "tab"}
            onClick={() => setActiveTab("knowledge")}
          >
            Knowledge Review
          </button>
        </div>

        {/* FEEDBACK TAB */}
        {activeTab === "feedback" && (
          <div className="card card-sm">
            <h3 className="title-md mb-3">
              <MessageSquare size={20} /> Pending Complaints (
              {pendingComplaints.length})
            </h3>
            {pendingComplaints.length === 0 ? (
              <p className="text-muted text-center" style={{ padding: "40px" }}>
                No pending complaints
              </p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                }}
              >
                {pendingComplaints.map((fb) => (
                  <div
                    key={fb.feedback_id}
                    className="card card-compact"
                    style={{ background: "rgba(239, 68, 68, 0.05)" }}
                  >
                    <div className="flex-between mb-2">
                      <span className="badge badge-danger">COMPLAINT</span>
                      <span className="text-small text-muted">
                        {fb.complaint_status.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ margin: "5px 0", fontWeight: "500" }}>
                      <strong>From:</strong> {fb.from_name} →{" "}
                      <strong>To:</strong> {fb.to_name} ({fb.target_role})
                    </p>
                    <p
                      className="text-muted"
                      style={{ margin: "0 0 15px 0" }}
                    >
                      {fb.message}
                    </p>

                    <div className="flex gap-sm">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleApproveFeedback(fb.feedback_id)}
                      >
                        <CheckCircle size={16} /> Approve & Warn Target
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          handleDismissFeedback(
                            fb.feedback_id,
                            fb.feedback_from
                          )
                        }
                      >
                        <XCircle size={16} /> Dismiss & Warn Reporter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BIDS TAB */}
        {activeTab === "bids" && (
          <div className="card card-sm">
            <h3 className="title-md mb-3">
              <Truck size={20} /> Pending Delivery Bids (
              {Object.keys(bidsByOrder).length} Orders)
            </h3>
            {Object.keys(bidsByOrder).length === 0 ? (
              <p className="text-muted text-center" style={{ padding: "40px" }}>
                No pending bids
              </p>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "20px" }}
              >
                {Object.values(bidsByOrder).map((order) => {
                  const lowestBid = Math.min(
                    ...order.bids.map((b) => b.bid_amount)
                  );

                  return (
                    <div
                      key={order.order_id}
                      className="card card-compact"
                      style={{ background: "rgba(59, 130, 246, 0.05)" }}
                    >
                      <h4 className="title-md mb-2">
                        Order #{order.order_id}
                      </h4>
                      <p style={{ margin: "5px 0" }}>
                        <strong>Customer:</strong> {order.customer_name}
                      </p>
                      <p style={{ margin: "5px 0" }}>
                        <strong>Delivery To:</strong> {order.delivered_to}
                      </p>
                      <p
                        className="menu-price"
                        style={{ margin: "10px 0" }}
                      >
                        Order Total: ${order.order_total.toFixed(2)}
                      </p>

                      <div
                        style={{
                          background: "rgba(249, 115, 22, 0.05)",
                          padding: "12px",
                          borderRadius: "8px",
                          marginTop: "10px",
                        }}
                      >
                        <p
                          className="text-small"
                          style={{ margin: "0 0 10px 0" }}
                        >
                          <strong>{order.bids.length} Bid(s):</strong>
                        </p>
                        {order.bids.map((bid) => {
                          const isLowest = bid.bid_amount === lowestBid;
                          return (
                            <div
                              key={bid.bid_id}
                              className="card card-compact"
                              style={{
                                marginBottom: "10px",
                                background: isLowest
                                  ? "rgba(34, 197, 94, 0.1)"
                                  : "white",
                              }}
                            >
                              <div className="flex-between mb-2">
                                <div>
                                  <strong>{bid.driver_name}</strong>
                                  {isLowest && (
                                    <span
                                      style={{
                                        marginLeft: "8px",
                                        color: "#22c55e",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      🏆 LOWEST
                                    </span>
                                  )}
                                </div>
                                <strong
                                  style={{
                                    color: isLowest ? "#22c55e" : "#f97316",
                                  }}
                                >
                                  ${bid.bid_amount.toFixed(2)}
                                </strong>
                              </div>

                              {!isLowest && (
                                <div className="mb-2">
                                  <input
                                    type="text"
                                    className="input input-sm"
                                    placeholder="Justification required for higher bid"
                                    value={bidJustification[bid.bid_id] || ""}
                                    onChange={(e) =>
                                      setBidJustification({
                                        ...bidJustification,
                                        [bid.bid_id]: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              )}

                              <div className="flex gap-sm">
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() =>
                                    handleApproveBid(bid.bid_id, isLowest)
                                  }
                                >
                                  <CheckCircle size={16} /> Approve
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() =>
                                    handleRejectBid(bid.bid_id)
                                  }
                                >
                                  <XCircle size={16} /> Reject
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIP REQUESTS TAB */}
        {activeTab === "vip" && (
          <div>
            {/* Pending VIP Requests */}
            {vipRequests.length > 0 && (
              <div className="card card-sm mb-3">
                <h3 className="title-md mb-3">
                  <Crown size={20} style={{ color: "#f97316" }} /> Pending VIP
                  Requests ({vipRequests.length})
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px",
                  }}
                >
                  {vipRequests.map((req) => (
                    <div
                      key={req.request_id}
                      className="card card-compact"
                      style={{ background: "rgba(249, 115, 22, 0.05)" }}
                    >
                      <div className="flex-between mb-2">
                        <h4 style={{ margin: 0 }}>{req.customer_name}</h4>
                        <span className="badge">PENDING</span>
                      </div>
                      <p
                        className="text-small text-muted"
                        style={{ margin: "5px 0" }}
                      >
                        {req.email}
                      </p>
                      <div style={{ margin: "10px 0" }}>
                        <p className="text-small">
                          <strong>Balance:</strong> $
                          {req.total_balance.toFixed(2)}
                        </p>
                        <p className="text-small">
                          <strong>Total Orders:</strong> {req.total_orders}
                        </p>
                        <p className="text-small">
                          <strong>Warnings:</strong> {req.amount_warnings}
                        </p>
                      </div>
                      <div className="flex gap-sm">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleApproveVip(req.request_id)}
                        >
                          <CheckCircle size={16} /> Approve VIP
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRejectVip(req.request_id)}
                        >
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current VIP Customers */}
            <div className="card card-sm">
              <h3 className="title-md mb-3">
                <Star size={20} style={{ color: "#eab308" }} /> Current VIP
                Customers
              </h3>
              {customers.filter((c) => c.vip_status).length === 0 ? (
                <p className="text-muted text-center" style={{ padding: "40px" }}>
                  No VIP customers yet
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px",
                  }}
                >
                  {customers
                    .filter((c) => c.vip_status)
                    .map((cust) => (
                      <div
                        key={cust.user_id}
                        className="card card-compact"
                        style={{
                          background: "rgba(234, 179, 8, 0.05)",
                        }}
                      >
                        <div className="flex-between mb-2">
                          <div className="flex gap-sm">
                            <Crown
                              size={20}
                              style={{ color: "#f97316" }}
                            />
                            <h4 style={{ margin: 0 }}>{cust.name}</h4>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ margin: 0 }}>
                              ${cust.total_balance.toFixed(2)}
                            </p>
                            <p className="text-small text-muted">
                              {cust.amount_warnings} Warnings
                            </p>
                          </div>
                        </div>
                        <p className="text-small text-muted">{cust.email}</p>
                        {cust.amount_warnings >= 2 && (
                          <div
                            className="alert alert-warning mb-2"
                            style={{ padding: "8px", fontSize: "14px" }}
                          >
                            <AlertTriangle size={16} /> VIP with 2+ warnings -
                            consider demotion
                          </div>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDemoteVip(cust.user_id)}
                        >
                          <TrendingDown size={16} /> Demote to Regular
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {vipRequests.length === 0 &&
              customers.filter((c) => c.vip_status).length === 0 && (
                <div className="card card-sm">
                  <div
                    className="text-center"
                    style={{ padding: "60px 20px" }}
                  >
                    <Crown
                      size={48}
                      style={{
                        color: "#f97316",
                        margin: "0 auto 15px",
                      }}
                    />
                    <h3 className="title-md mb-2">No VIP Activity</h3>
                    <p className="text-muted">
                      No pending requests or current VIP customers
                    </p>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* EMPLOYEES TAB */}
        {activeTab === "employees" && (
          <div className="card card-sm">
            <h3 className="title-md mb-3">
              <UserCheck size={20} /> Employee Management ({employees.length})
            </h3>
            {employees.length === 0 ? (
              <p className="text-muted text-center" style={{ padding: "40px" }}>
                No employees found
              </p>
            ) : (
              <div className="grid grid-2">
                {employees.map((emp) => (
                  <div
                    key={emp.user_id}
                    className="card card-compact"
                    style={{
                      background:
                        emp.role === "chef"
                          ? "rgba(249, 115, 22, 0.05)"
                          : "rgba(59, 130, 246, 0.05)",
                    }}
                  >
                    <div className="flex-between mb-2">
                      <div>
                        <h4 style={{ margin: "0 0 5px 0" }}>{emp.name}</h4>
                        <span
                          className="badge"
                          style={{
                            background:
                              emp.role === "chef" ? "#f97316" : "#3b82f6",
                            color: "white",
                          }}
                        >
                          {emp.role.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p
                          className="menu-price"
                          style={{ margin: "0 0 5px 0" }}
                        >
                          ${emp.salary.toFixed(2)}
                        </p>
                        <p className="text-small text-muted">
                          {emp.amount_warnings} Warnings
                        </p>
                      </div>
                    </div>
                    <p className="text-small text-muted">{emp.email}</p>
                    <div className="flex gap-sm mt-2">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() =>
                          handlePromoteEmployee(emp.user_id, emp.name)
                        }
                      >
                        <TrendingUp size={14} /> +10%
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          handleDemoteEmployee(emp.user_id, emp.name)
                        }
                      >
                        <TrendingDown size={14} /> -10%
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          handleFireEmployee(emp.user_id, emp.name)
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
            <h3 className="title-md mb-3">
              <Users size={20} /> Customer Management ({customers.length})
            </h3>
            {customers.length === 0 ? (
              <p className="text-muted text-center" style={{ padding: "40px" }}>
                No customers found
              </p>
            ) : (
              <div className="grid grid-2">
                {customers.map((cust) => {
                  const needsAction = cust.amount_warnings >= 3;
                  return (
                    <div
                      key={cust.user_id}
                      className="card card-compact"
                      style={{
                        background: needsAction
                          ? "rgba(239, 68, 68, 0.05)"
                          : cust.vip_status
                          ? "rgba(234, 179, 8, 0.05)"
                          : undefined,
                      }}
                    >
                      <div className="flex-between mb-2">
                        <div className="flex gap-sm">
                          {cust.vip_status && (
                            <Crown
                              size={16}
                              style={{ color: "#f97316" }}
                            />
                          )}
                          <h4 style={{ margin: 0 }}>{cust.name}</h4>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ margin: "0 0 5px 0" }}>
                            ${cust.total_balance.toFixed(2)}
                          </p>
                          <p
                            className="text-small"
                            style={{
                              color:
                                cust.amount_warnings >= 3
                                  ? "#ef4444"
                                  : "#78716c",
                            }}
                          >
                            <AlertTriangle size={14} /> {cust.amount_warnings}{" "}
                            Warning(s)
                          </p>
                        </div>
                      </div>
                      <p className="text-small text-muted">{cust.email}</p>
                      {needsAction && (
                        <div
                          className="alert alert-error mb-2"
                          style={{ padding: "8px", fontSize: "14px" }}
                        >
                          3+ warnings - should be deregistered
                        </div>
                      )}
                      <button
                        className="btn btn-danger btn-sm w-full"
                        onClick={() =>
                          handleDeregisterCustomer(cust.user_id, cust.name)
                        }
                      >
                        <UserX size={14} /> Deregister & Blacklist
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* KNOWLEDGE REVIEW TAB */}
        {activeTab === "knowledge" && (
          <KnowledgeReview manager={manager} />
        )}
      </div>
    </div>
  );
}
