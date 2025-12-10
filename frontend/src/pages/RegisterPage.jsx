import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UtensilsCrossed, UserPlus, ArrowLeft } from "lucide-react";
import client from "../api/client";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    try {
      await client.post("/auth/register", {
        username: form.username,
        password: form.password,
        name: form.name,
        email: form.email,
        phone: form.phone,
        home_address: `${form.street}, ${form.city}, ${form.state} ${form.zip}`.trim()
      });
      setSuccess("Account created! Redirecting to login…");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
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

      <div className="container-md">
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div className="brand-logo" style={{ width: "70px", height: "70px" }}>
            <UtensilsCrossed size={36} />
          </div>
          <h1 className="title-xl" style={{ fontSize: "2.2rem" }}>SD FOODS</h1>
          <p className="tagline" style={{ fontSize: "0.85rem" }}>
            Your favorite food, delivered fast
          </p>
        </div>

        {/* Auth Card */}
        <div className="card" style={{ padding: "40px" }}>
          <h2 className="title-lg" style={{ fontSize: "1.6rem" }}>Create Account</h2>
          <p className="subtitle" style={{ fontSize: "0.8rem" }}>
            Sign up once and checkout becomes much faster
          </p>

          {/* Tabs */}
          <div className="tabs">
            <button type="button" className="tab" onClick={() => navigate("/login")}>
              Login
            </button>
            <button type="button" className="tab active">Register</button>
          </div>

          {/* Alerts */}
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Register Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="input"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="input"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone (Optional)</label>
              <input
                className="input"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Street Address</label>
              <input
                className="input"
                name="street"
                value={form.street}
                onChange={handleChange}
                placeholder="123 Main St Apt 4B"
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "15px" }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  className="input"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">State</label>
                <input
                  className="input"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="NY"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Zip Code</label>
              <input
                className="input"
                name="zip"
                value={form.zip}
                onChange={handleChange}
                placeholder="10031"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="input"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="input"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="input"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? "Creating account…" : (
                <>
                  <UserPlus size={18} />
                  Register
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-small text-center text-muted" style={{ marginTop: "20px" }}>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
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
              Login here
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-muted" style={{ 
          marginTop: "25px", 
          fontSize: "0.75rem", 
          letterSpacing: "2px" 
        }}>
          © 2024 SD FOODS
        </p>
      </div>
    </div>
  );
}