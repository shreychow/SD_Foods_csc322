import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UtensilsCrossed,
  ShoppingBag,
  User,
  LogOut,
  Award,
  ChevronRight,
  Sparkles,
  Star,
  Clock,
  Heart,
  Wallet,
} from "lucide-react";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("customer");
    if (!stored) {
      navigate("/login");
      return;
    }
    setCustomer(JSON.parse(stored));

    const storedCart = localStorage.getItem("cart");
    if (storedCart) setCart(JSON.parse(storedCart));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("customer");
    localStorage.removeItem("cart");
    navigate("/login");
  };

  if (!customer) return <div>Loading...</div>;

  const isVIP = customer.vip_status;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #fff7ed 0%, #ffe9dd 30%, #ffffff 100%)" }}>
      {/* Top Nav */}
      <nav className="navbar">
        <div className="flex gap-md">
          <div className="brand-logo-sm">
            <UtensilsCrossed size={22} />
          </div>
          <span className="brand-name">SD FOODS</span>
        </div>

        <div className="nav-links">
          {[
            { label: "Menu", path: "/menu" },
            { label: "Orders", path: "/orders" },
            { label: "AI Chat", path: "/chat" },
            { label: "Feedback", path: "/feedback" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="nav-link"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex gap-md">
          <button
            onClick={() => navigate("/checkout")}
            className="nav-link"
            style={{ position: "relative", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <ShoppingBag size={22} />
            Cart
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>

          <button
            onClick={() => navigate("/wallet")}
            className="badge"
            style={{ cursor: "pointer", transition: "all 0.2s" }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(249, 115, 22, 0.15)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(249, 115, 22, 0.08)"}
          >
            <Wallet size={16} />
            Wallet
          </button>

          <div className="badge">
            <User size={18} />
            {customer.name || customer.username}
            {isVIP && <Award size={16} />}
          </div>

          <button onClick={handleLogout} className="btn btn-ghost btn-sm">
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ paddingTop: "140px", paddingBottom: "80px", textAlign: "center" }}>
        {customer.warnings > 0 && (
          <div className="alert alert-error" style={{ maxWidth: "550px", margin: "0 auto 30px" }}>
             You have {customer.warnings} warning(s). Please review our policies.
          </div>
        )}

        {isVIP && (
          <div className="badge" style={{ margin: "0 auto 25px" }}>
            <Sparkles size={16} />
            VIP MEMBER
          </div>
        )}

        <h1 className="title-hero">Culinary Excellence</h1>
        <p className="tagline" style={{ fontSize: "1.1rem", margin: "0 0 50px 0" }}>
          Delivered to your door
        </p>

        <button onClick={() => navigate("/menu")} className="btn btn-primary btn-lg">
          Explore Menu
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Features */}
      <div className="container">
        <div className="grid grid-3 mb-4">
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

      {/* CTA */}
      <div className="container" style={{ maxWidth: "800px", margin: "80px auto 100px" }}>
        <div
          className="card"
          style={{
            padding: "60px 40px",
            textAlign: "center",
            background: "linear-gradient(135deg, #f97316, #fb923c)",
            boxShadow: "0 30px 80px rgba(249, 115, 22, 0.25)",
          }}
        >
          <h2 className="title-lg" style={{ fontSize: "2.5rem", color: "white", margin: "0 0 20px 0" }}>
            Ready to Order?
          </h2>
          <p style={{ fontSize: "1rem", color: "rgba(255, 255, 255, 0.9)", margin: "0 0 35px 0", letterSpacing: "2px" }}>
            Browse our menu and find your favorite dish
          </p>
          <button
            onClick={() => navigate("/menu")}
            className="btn btn-lg"
            style={{ background: "white", color: "#f97316" }}
          >
            Browse Menu
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(249, 115, 22, 0.1)", padding: "40px", textAlign: "center" }}>
        <p className="text-muted" style={{ margin: "0 0 8px 0", fontSize: "0.85rem" }}>
          Your favorite food, delivered fast
        </p>
        <p style={{ margin: 0, color: "#d4d4d8", fontSize: "0.75rem", letterSpacing: "2px" }}>
          © 2024 SD FOODS
        </p>
      </div>
    </div>
  );
}