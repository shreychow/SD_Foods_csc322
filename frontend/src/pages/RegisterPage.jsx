import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { UtensilsCrossed } from "lucide-react";

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
    zip: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const home_address = `${form.street}, ${form.city}, ${form.state} ${form.zip}`.trim();

    setLoading(true);

    try {
      await client.post("/auth/register", {
        username: form.username,
        password: form.password,
        name: form.name,
        email: form.email,
        phone: form.phone,
        home_address, // send combined address string to backend
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
    <div className="auth-page-light">
      {/* Logo / Brand header */}
      <div className="brand-header">
        <div className="brand-icon">
          <UtensilsCrossed />
        </div>
        <div className="brand-name">SD Foods</div>
        <div className="brand-tagline">Your favorite food, delivered fast</div>
      </div>

      {/* Card */}
      <div className="auth-card-simple">
        <h2 className="auth-title-main">Create an account</h2>
        <p className="auth-subtitle-main">
          Sign up once and checkout becomes much faster.
        </p>

        {/* Tabs */}
        <div className="tab-switch">
          <button
            type="button"
            className="tab-btn"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
          <button
            type="button"
            className="tab-btn active"
            onClick={() => navigate("/register")}
          >
            Register
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert">{success}</div>}

        <form onSubmit={handleSubmit} className="form">
          <label className="form-label">
            Full Name
            <input
              className="input"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-label">
            Email
            <input
              type="email"
              className="input"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-label">
            Phone (optional)
            <input
              className="input"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
          </label>

          {/* Address broken into components */}
          <label className="form-label">
            Street Address
            <input
              className="input"
              name="street"
              value={form.street}
              onChange={handleChange}
              placeholder="123 Main St Apt 4B"
              required
            />
          </label>

          <div className="form-row-two">
            <label className="form-label">
              City
              <input
                className="input"
                name="city"
                value={form.city}
                onChange={handleChange}
                required
              />
            </label>

            <label className="form-label">
              State
              <input
                className="input"
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="NY"
                required
              />
            </label>
          </div>

          <label className="form-label">
            Zip Code
            <input
              className="input"
              name="zip"
              value={form.zip}
              onChange={handleChange}
              placeholder="10031"
              required
            />
          </label>

          <label className="form-label">
            Username
            <input
              className="input"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-label">
            Password
            <input
              type="password"
              className="input"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-label">
            Confirm Password
            <input
              type="password"
              className="input"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </label>

          <button
            className="btn btn-primary w-100"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating account…" : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}
