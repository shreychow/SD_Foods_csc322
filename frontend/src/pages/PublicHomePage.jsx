import { useNavigate } from "react-router-dom";
import { UtensilsCrossed, LogIn, UserPlus, MessageSquare, Star, Clock, Heart } from "lucide-react";

export default function PublicHomePage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #fff7ed 0%, #ffe9dd 30%, #ffffff 100%)" }}>
      {/* Top Nav for Visitors */}
      <nav className="navbar">
        <div className="flex gap-md">
          <div className="brand-logo-sm">
            <UtensilsCrossed size={22} />
          </div>
          <span className="brand-name">SD FOODS</span>
        </div>

        <div className="flex gap-md">
          <button onClick={() => navigate("/menu")} className="btn btn-ghost">
            Browse Menu
          </button>
          <button onClick={() => navigate("/chat")} className="btn btn-ghost">
            <MessageSquare size={18} />
            Ask Questions
          </button>
          <button onClick={() => navigate("/login")} className="btn btn-secondary">
            <LogIn size={18} />
            Login
          </button>
          <button onClick={() => navigate("/register")} className="btn btn-primary">
            <UserPlus size={18} />
            Apply to Register
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{ paddingTop: "140px", paddingBottom: "80px", textAlign: "center" }}>
        <div className="brand-logo" style={{ margin: "0 auto 30px" }}>
          <UtensilsCrossed size={60} />
        </div>
        <h1 className="title-hero">Welcome to SD FOODS</h1>
        <p className="tagline" style={{ fontSize: "1.2rem", margin: "0 0 50px 0" }}>
          Your favorite food, delivered fast
        </p>

        <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/menu")} className="btn btn-primary btn-lg">
            Browse Our Menu
          </button>
          <button onClick={() => navigate("/register")} className="btn btn-secondary btn-lg">
            <UserPlus size={20} />
            Become a Customer
          </button>
        </div>

        <p className="text-muted" style={{ marginTop: "20px", fontSize: "0.9rem" }}>
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            style={{
              background: "none",
              border: "none",
              color: "#f97316",
              cursor: "pointer",
              textDecoration: "underline",
              fontWeight: "500",
            }}
          >
            Login here
          </button>
        </p>
      </div>

      {/* Features */}
      <div className="container" style={{ marginBottom: "100px" }}>
        <div className="grid grid-3">
          {[
            { icon: Star, title: "Premium Quality", desc: "Finest ingredients, expert chefs" },
            { icon: Clock, title: "Fast Delivery", desc: "Fresh and hot within 30 minutes" },
            { icon: Heart, title: "Customer Care", desc: "Dedicated support for you" },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: "center", padding: "30px 20px" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "rgba(249, 115, 22, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  border: "1px solid rgba(249, 115, 22, 0.2)",
                }}
              >
                <item.icon size={28} style={{ color: "#f97316" }} />
              </div>
              <h3 className="title-md" style={{ fontSize: "1.1rem", margin: "0 0 10px 0" }}>
                {item.title}
              </h3>
              <p className="text-muted" style={{ fontSize: "0.85rem", margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(249, 115, 22, 0.1)", padding: "40px", textAlign: "center" }}>
        <p className="text-muted" style={{ margin: "0 0 8px 0", fontSize: "0.85rem" }}>
          Your favorite food, delivered fast
        </p>
        <p style={{ margin: 0, color: "#d4d4d8", fontSize: "0.75rem", letterSpacing: "2px" }}>
          © 2025 SD FOODS
        </p>
      </div>
    </div>
  );
}
