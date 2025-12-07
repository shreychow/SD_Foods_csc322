import { useNavigate } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="auth-page-light">
      {/* Brand */}
      <div className="brand-header">
        <div className="brand-icon">
          <UtensilsCrossed className="brand-icon-svg" />
        </div>
        <div className="brand-name">SD Foods</div>
        <div className="brand-tagline">
          Your favorite food, delivered fast
        </div>
      </div>

      {/* Card */}
      <div className="auth-card-simple">
        <h1 className="auth-title-main">Welcome!</h1>
        <p className="auth-subtitle-main">
          Login or create an account to get started
        </p>

        {/* Tabs (visual, route-based) */}
        <div className="tab-switch">
          <button className="tab-btn active">Login</button>
          <button className="tab-btn" onClick={() => navigate("/register")}>
            Register
          </button>
        </div>

        <form className="form">
          <label className="form-label">
            Username
            <input className="input" placeholder="Enter your username" />
          </label>

          <label className="form-label">
            Password
            <input
              type="password"
              className="input"
              placeholder="Enter your password"
            />
          </label>

          <button
            className="btn btn-primary w-100"
            onClick={(e) => {
              e.preventDefault();
              navigate("/customer");
            }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
