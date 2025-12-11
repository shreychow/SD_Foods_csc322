import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UtensilsCrossed, LogIn, ArrowLeft } from "lucide-react";
import client from "../api/client";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await client.post("/auth/login", {
        username: username.trim(),
        password,
      });

      // Save logged-in user
      localStorage.setItem("customer", JSON.stringify(res.data));

      // Determine role
      const role = res.data.role || res.data.user_type;

      navigate(
        role === "manager" ? "/manager" :
        role === "chef" ? "/chef" :
        role === "delivery" ? "/delivery" :
        "/customer"
      );

    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center">

      {/* Back Button */}
      <button 
        onClick={() => navigate("/")} 
        className="btn btn-ghost btn-sm"
        style={{ position: "absolute", top: "20px", left: "20px" }}
      >
        <ArrowLeft size={16} /> Back to Home
      </button>

      <div className="container-sm">

        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <div className="brand-logo">
            <UtensilsCrossed size={40} />
          </div>
          <h1 className="title-xl">SD FOODS</h1>
          <p className="tagline">Your favorite food, delivered fast</p>
        </div>

        {/* Login Card */}
        <div className="card">
          <h2 className="title-lg">Welcome Back</h2>
          <p className="subtitle">Login to your account to continue</p>

          {/* Tabs */}
          <div className="tabs">
            <button type="button" className="tab active">Login</button>
            <button type="button" className="tab" onClick={() => navigate("/register")}>
              Register
            </button>
          </div>

          {/* Error Alert */}
          {error && <div className="alert alert-error">{error}</div>}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? "Logging in..." : (
                <>
                  <LogIn size={18} />
                  Login
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-small text-center text-muted" style={{ marginTop: "25px" }}>
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              style={{
                background: "none",
                border: "none",
                color: "#f97316",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: "500",
                textDecoration: "underline"
              }}
            >
              Create one now
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-muted" style={{ 
          marginTop: "30px", 
          fontSize: "0.75rem", 
          letterSpacing: "2px" 
        }}>
          © 2024 SD FOODS
        </p>

      </div>
    </div>
  );
}
