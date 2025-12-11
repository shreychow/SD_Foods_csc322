import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Search, ArrowLeft, Star, LogIn } from "lucide-react";
import client from "../api/client";

export default function MenuPage() {
  const navigate = useNavigate();
  const [quantities, setQuantities] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("customer");
    if (stored) {
      setCustomer(JSON.parse(stored));
    }

    const storedCart = localStorage.getItem("cart");
    if (storedCart) setCart(JSON.parse(storedCart));

    // ✅ FETCH MENU ITEMS FROM DATABASE
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await client.get('/menu');
      
      console.log("✅ Fetched menu items:", response.data);
      
      // Map database items to frontend format
      const items = response.data.map(item => ({
        id: item.item_id.toString(),  // ✅ Use item_id from database
        item_id: item.item_id,          // ✅ Keep item_id for backend
        name: item.name,
        description: item.description || "Delicious dish from our kitchen",
        price: parseFloat(item.price),
        category: item.category_name ? item.category_name.toLowerCase() : "other",
        image: item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        rating: 4.5, // Default rating
        popular: false,
        in_stock: item.in_stock
      }));

      setMenuItems(items);

      // Extract unique categories
      const uniqueCategories = [...new Set(items.map(item => item.category))];
      setCategories(['all', ...uniqueCategories]);

    } catch (error) {
      console.error("❌ Failed to fetch menu items:", error);
      alert("Failed to load menu. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (itemId, delta) => {
    setQuantities(prev => ({ ...prev, [itemId]: Math.max(0, (prev[itemId] || 0) + delta) }));
  };

  const addToCart = (item) => {
    if (!customer) {
      alert("Please login to place orders!");
      navigate("/login");
      return;
    }

    const quantity = quantities[item.id] || 1;
    const storedCart = localStorage.getItem("cart");
    let currentCart = storedCart ? JSON.parse(storedCart) : [];
    const existingItemIndex = currentCart.findIndex(cartItem => cartItem.id === item.id);

    if (existingItemIndex !== -1) {
      currentCart[existingItemIndex].quantity += quantity;
    } else {
      // ✅ Store with correct item_id from database
      currentCart.push({ 
        id: item.id,           // String version for cart operations
        item_id: item.item_id, // Integer version for backend
        name: item.name, 
        price: item.price, 
        quantity: quantity, 
        image: item.image 
      });
    }

    localStorage.setItem("cart", JSON.stringify(currentCart));
    setCart(currentCart);
    setQuantities(prev => ({ ...prev, [item.id]: 0 }));
    setSuccessMessage(`Added ${quantity}x ${item.name} to cart!`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const filtered = menuItems.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === "all" || item.category === selectedCategory;
    const inStock = item.in_stock !== false; // Show items that are in stock
    return matchSearch && matchCategory && inStock;
  });

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="page-center">
        <p style={{ fontSize: "1.2rem", color: "#78716c" }}>Loading menu...</p>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Top Bar */}
      <div className="card card-compact flex-between mb-3">
        <button className="btn btn-secondary" onClick={() => navigate(customer ? "/customer" : "/")}>
          <ArrowLeft size={18} /> Back
        </button>
        <h2 className="title-md" style={{ margin: 0 }}>Our Menu</h2>
        {customer ? (
          <button className="btn btn-primary" onClick={() => navigate("/checkout")} style={{ position: "relative" }}>
            <ShoppingCart size={18} /> Cart
            {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => navigate("/login")}>
            <LogIn size={18} /> Login to Order
          </button>
        )}
      </div>

      {/* Visitor Notice */}
      {!customer && (
        <div className="alert alert-info mb-3">
          <p style={{ margin: 0 }}>
            Browsing as a visitor. <strong>Login or register</strong> to place orders!{" "}
            <button
              onClick={() => navigate("/register")}
              style={{
                background: "none",
                border: "none",
                color: "#f97316",
                textDecoration: "underline",
                cursor: "pointer",
                fontWeight: "600"
              }}
            >
              Apply now
            </button>
          </p>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="alert alert-success" style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 1000,
          minWidth: "300px"
        }}>
          {successMessage}
        </div>
      )}

      {/* Search Bar */}
      <div style={{ position: "relative", marginBottom: "25px" }}>
        <Search size={20} style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", color: "#a8a29e" }} />
        <input
          type="text"
          placeholder="Search dishes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input search-input"
        />
      </div>

      {/* Category Buttons */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "30px", flexWrap: "wrap" }}>
        {categories.map(cat => (
          <button
            key={cat}
            className={selectedCategory === cat ? "tag" : "btn btn-secondary btn-sm"}
            style={{
              background: selectedCategory === cat ? "linear-gradient(135deg, #f97316, #fb923c)" : undefined,
              color: selectedCategory === cat ? "white" : undefined,
              boxShadow: selectedCategory === cat ? "0 4px 12px rgba(249, 115, 22, 0.3)" : undefined
            }}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-auto">
        {filtered.map((item) => {
          const quantity = quantities[item.id] || 0;
          return (
            <div key={item.id} className="menu-card">
              <div
                className="menu-image"
                style={{
                  backgroundImage: `url(${item.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              >
                {item.popular && (
                  <span className="badge badge-danger" style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px"
                  }}>
                    POPULAR
                  </span>
                )}
              </div>
              <div className="menu-body">
                <h3 className="menu-title">{item.name}</h3>
                <p className="menu-description">{item.description}</p>
                <div className="flex-between mb-2">
                  <p className="menu-price">${item.price.toFixed(2)}</p>
                  <div className="menu-rating">
                    <Star size={16} fill="#f97316" color="#f97316" />
                    {item.rating}
                  </div>
                </div>
                <div className="flex gap-sm">
                  {quantity > 0 ? (
                    <>
                      <button className="btn-icon" onClick={() => handleQuantityChange(item.id, -1)}>
                        -
                      </button>
                      <span style={{
                        padding: "8px 16px",
                        minWidth: "50px",
                        textAlign: "center",
                        fontWeight: "600",
                        color: "#78716c",
                        fontSize: "1.1rem"
                      }}>
                        {quantity}
                      </span>
                      <button className="btn-icon" onClick={() => handleQuantityChange(item.id, 1)}>
                        +
                      </button>
                      <button 
                        className="btn btn-primary" 
                        style={{ flex: 1 }} 
                        onClick={() => addToCart(item)}
                      >
                        Add to Cart
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-primary w-full"
                      onClick={() => {
                        if (!customer) {
                          alert("Please login to place orders!");
                          navigate("/login");
                        } else {
                          setQuantities((prev) => ({ ...prev, [item.id]: 1 }));
                        }
                      }}
                    >
                      {customer ? "Add to Cart" : "Login to Order"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && !loading && (
        <div className="text-center mt-4">
          <p className="text-muted" style={{ fontSize: "1.1rem", marginBottom: "20px" }}>
            No matching menu items found.
          </p>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}