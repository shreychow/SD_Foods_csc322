// frontend/src/pages/Login.jsx - COMPLETE FIXED VERSION
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, User, Lock } from "lucide-react";
import client from "../api/client";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      alert("Please enter both username and password");
      return;
    }

    try {
      setLoading(true);
      console.log("🔑 Attempting login:", { username });

      const response = await client.post("/auth/login", {
        username: username,
        password: password,
      });

      const user = response.data;
      console.log("✅ Login successful:", user);
      console.log("👤 User role:", user.role);

      // Save to localStorage
      localStorage.setItem("customer", JSON.stringify(user));

      // ⭐ CRITICAL: Navigate based on role
      if (user.role === "chef") {
        console.log("🍳 Redirecting to /chef");
        navigate("/chef");
      } else if (user.role === "driver" || user.role === "delivery") {
        console.log("🚚 Redirecting to /delivery");
        navigate("/delivery");
      } else if (user.role === "manager") {
        console.log("👔 Redirecting to /manager");
        navigate("/manager");
      } else if (user.role === "customer") {
        console.log("🛒 Redirecting to /customer");
        navigate("/customer");
      } else {
        console.warn("⚠️ Unknown role, redirecting to home");
        navigate("/");
      }
    } catch (error) {
      console.error("❌ Login failed:", error);
      alert(error.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center">
      <div className="card" style={{ maxWidth: "400px", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <LogIn size={48} style={{ color: "#f97316", margin: "0 auto 15px" }} />
          <h2 className="title-lg">Welcome Back</h2>
          <p className="text-muted">Login to your account</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">
              <User size={16} /> Username
            </label>
            <input
              type="text"
              className="input"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              <Lock size={16} /> Password
            </label>
            <input
              type="password"
              className="input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <p className="text-small text-muted">
            Don't have an account?{" "}
            <a
              href="/register"
              style={{ color: "#f97316", textDecoration: "none" }}
            >
              Register here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}