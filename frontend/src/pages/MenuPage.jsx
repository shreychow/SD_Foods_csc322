import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Search, ArrowLeft, Star } from "lucide-react";

export default function MenuPage() {
  const navigate = useNavigate();
  const [quantities, setQuantities] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const menuItems = [
    { id: "1", name: "Classic Cheeseburger", description: "Juicy beef patty with cheddar, lettuce, tomato, and special sauce", price: 12.99, category: "burgers", image: "https://images.unsplash.com/photo-1722125680299-783f98369451", rating: 4.5, popular: true },
    { id: "2", name: "Margherita Pizza", description: "Fresh mozzarella, tomatoes, basil, and olive oil", price: 14.99, category: "pizza", image: "https://images.unsplash.com/photo-1667422542005-eb6909ac24c2", rating: 4.8, popular: true },
    { id: "3", name: "Creamy Carbonara", description: "Italian pasta with pancetta, egg, and parmesan", price: 16.99, category: "pasta", image: "https://images.unsplash.com/photo-1749169337822-d875fd6f4c9d", rating: 4.6 },
    { id: "4", name: "Caesar Salad", description: "Romaine, parmesan, croutons, caesar dressing", price: 9.99, category: "salads", image: "https://images.unsplash.com/photo-1651352650142-385087834d9d", rating: 4.3 },
    { id: "5", name: "Sushi Platter", description: "Assorted sushi rolls with wasabi & ginger", price: 24.99, category: "sushi", image: "https://images.unsplash.com/photo-1700324822763-956100f79b0d", rating: 4.9, popular: true },
    { id: "6", name: "Chocolate Lava Cake", description: "Warm chocolate cake with ice cream", price: 7.99, category: "desserts", image: "https://images.unsplash.com/photo-1655633584060-c875b9821061", rating: 4.7 }
  ];

  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) setCart(JSON.parse(storedCart));
  }, []);

  const handleQuantityChange = (itemId, delta) => {
    setQuantities(prev => ({ ...prev, [itemId]: Math.max(0, (prev[itemId] || 0) + delta) }));
  };

  const addToCart = (item) => {
    const quantity = quantities[item.id] || 1;
    const storedCart = localStorage.getItem("cart");
    let currentCart = storedCart ? JSON.parse(storedCart) : [];
    const existingItemIndex = currentCart.findIndex(cartItem => cartItem.id === item.id);

    if (existingItemIndex !== -1) {
      currentCart[existingItemIndex].quantity += quantity;
    } else {
      currentCart.push({ id: item.id, name: item.name, price: item.price, quantity: quantity, image: item.image });
    }

    localStorage.setItem("cart", JSON.stringify(currentCart));
    setCart(currentCart);
    setQuantities(prev => ({ ...prev, [item.id]: 0 }));
    setSuccessMessage(`Added ${quantity}x ${item.name} to cart!`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const filtered = menuItems.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="page">
      {/* Top Bar */}
      <div className="card card-compact flex-between mb-3">
        <button className="btn btn-secondary" onClick={() => navigate("/customer")}>
          <ArrowLeft size={18} /> Back
        </button>
        <h2 className="title-md" style={{ margin: 0 }}>Our Menu</h2>
        <button className="btn btn-primary" onClick={() => navigate("/checkout")} style={{ position: "relative" }}>
          <ShoppingCart size={18} /> Cart
          {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
        </button>
      </div>

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
        {["all", "burgers", "pizza", "pasta", "salads", "sushi", "desserts"].map(cat => (
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
                      <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => addToCart(item)}>
                        Add to Cart
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-primary w-full"
                      onClick={() => setQuantities((prev) => ({ ...prev, [item.id]: 1 }))}
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
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