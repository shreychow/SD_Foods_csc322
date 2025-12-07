import { useState } from "react";

export default function MenuPage() {
  const [quantities, setQuantities] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const menuItems = [
    {
      id: "1",
      name: "Classic Cheeseburger",
      description: "Juicy beef patty with cheddar, lettuce, tomato, and special sauce",
      price: 12.99,
      category: "burgers",
      image: "https://images.unsplash.com/photo-1722125680299-783f98369451",
      rating: 4.5,
      popular: true,
    },
    {
      id: "2",
      name: "Margherita Pizza",
      description: "Fresh mozzarella, tomatoes, basil, and olive oil",
      price: 14.99,
      category: "pizza",
      image: "https://images.unsplash.com/photo-1667422542005-eb6909ac24c2",
      rating: 4.8,
      isVegetarian: true,
      popular: true,
    },
    {
      id: "3",
      name: "Creamy Carbonara",
      description: "Italian pasta with pancetta, egg, and parmesan",
      price: 16.99,
      category: "pasta",
      image: "https://images.unsplash.com/photo-1749169337822-d875fd6f4c9d",
      rating: 4.6,
    },
    {
      id: "4",
      name: "Caesar Salad",
      description: "Romaine, parmesan, croutons, caesar dressing",
      price: 9.99,
      category: "salads",
      image: "https://images.unsplash.com/photo-1651352650142-385087834d9d",
      rating: 4.3,
      isVegetarian: true,
    },
    {
      id: "5",
      name: "Sushi Platter",
      description: "Assorted sushi rolls with wasabi & ginger",
      price: 24.99,
      category: "sushi",
      image: "https://images.unsplash.com/photo-1700324822763-956100f79b0d",
      rating: 4.9,
      popular: true,
    },
    {
      id: "6",
      name: "Chocolate Lava Cake",
      description: "Warm chocolate cake with ice cream",
      price: 7.99,
      category: "desserts",
      image: "https://images.unsplash.com/photo-1655633584060-c875b9821061",
      rating: 4.7,
      isVegetarian: true,
    }
  ];

  const handleQuantityChange = (itemId, delta) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta),
    }));
  };

  const filtered = menuItems.filter(item => {
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory =
      selectedCategory === "all" || item.category === selectedCategory;

    return matchSearch && matchCategory;
  });

  return (
    <div className="page">
      {/* Header */}
      <div className="section-header">
        <h2>Browse Our Menu</h2>
      </div>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search dishes..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="input"
        style={{ marginBottom: "12px" }}
      />

      {/* Category Buttons */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {["all", "burgers", "pizza", "pasta", "salads", "sushi", "desserts"].map(cat => (
          <button
            key={cat}
            className="btn"
            style={{
              background: selectedCategory === cat ? "#f97316" : "#e5e7eb",
              color: selectedCategory === cat ? "white" : "black",
            }}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Menu Items Grid */}
      <div className="grid">
        {filtered.map((item) => {
          const quantity = quantities[item.id] || 0;

          return (
            <div className="card dish-card" key={item.id}>
              <div
                className="dish-image"
                style={{
                  backgroundImage: `url(${item.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>

              <div className="dish-body">
                <h3>{item.name}</h3>
                <p className="muted">{item.description}</p>
                <p className="price">${item.price.toFixed(2)}</p>

                {/* Quantity + Add Controls */}
                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  {quantity > 0 ? (
                    <>
                      <button
                        className="btn-icon"
                        onClick={() => handleQuantityChange(item.id, -1)}
                      >-</button>

                      <span>{quantity}</span>

                      <button
                        className="btn-icon"
                        onClick={() => handleQuantityChange(item.id, 1)}
                      >+</button>

                      <button className="btn btn-primary" style={{ flex: 1 }}>
                        Add to Cart
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-primary w-100"
                      onClick={() =>
                        setQuantities((prev) => ({ ...prev, [item.id]: 1 }))
                      }
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

      {filtered.length === 0 && (
        <p style={{ textAlign: "center", marginTop: "20px" }}>
          No matching menu items found.
        </p>
      )}
    </div>
  );
}
