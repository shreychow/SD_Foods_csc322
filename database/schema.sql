CREATE DATABASE IF NOT EXISTS restaurant_database;
USE restaurant_database;

DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS role;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS payment;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS restaurant_tables;
DROP TABLE IF EXISTS users;

/* USER TABLE */
CREATE TABLE users(
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL, 
    password_hash VARCHAR (255) NOT NULL, 
    name VARCHAR(100) NOT NULL, 
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    home_address VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    total_balance INT NOT NULL,
    amount_warnings INT NOT NULL,
    vip_status BOOLEAN NOT NULL DEFAULT FALSE,
    is_blacklisted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* TABLES AVAILABLE */
CREATE TABLE restaurant_tables (
    table_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    table_number INT NOT NULL UNIQUE,
    seating_capacity INT NOT NULL,
    area VARCHAR(50),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* CATEGORY TABLE */
CREATE TABLE category(
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* ROLE TABLE */
CREATE TABLE role (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* PERMISSIONS TABLE */
CREATE TABLE permissions(
    permissions_id INT AUTO_INCREMENT PRIMARY KEY,
    permissions_type VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* MENU TABLE */
CREATE TABLE menu_items(
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    price DECIMAL(10,2) NOT NULL,
    category INT NOT NULL, 
    FOREIGN KEY (category) REFERENCES category(category_id) ON DELETE CASCADE,
    is_time_limited BOOLEAN NOT NULL DEFAULT FALSE,
    in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    image_url VARCHAR(255) UNIQUE,
    created_by INT NOT NULL, 
    updated_by INT NOT NULL, 
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE CASCADE,
    dietary_restrictions BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* RESERVATIONS TABLE */
CREATE TABLE reservations(
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    table_id INT NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    duration INT NOT NULL,
    reservation_status VARCHAR (50) NOT NULL, 
    number_of_guest INT NOT NULL,
    special_request VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(table_id) ON DELETE CASCADE
);

/* ORDERS TABLE */
CREATE TABLE orders(
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    delivered_by INT NOT NULL,
    delivered_to VARCHAR(255) NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (delivered_by) REFERENCES users(user_id) ON DELETE CASCADE,
    delivery_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    total_price DECIMAL(10,2) NOT NULL,
    delivery_date DATE NOT NULL,
    delivery_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* PAYMENT TABLE */
CREATE TABLE payment(
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payed_by INT NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_successful BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (payed_by) REFERENCES users(user_id) ON DELETE CASCADE
);

/* ORDER ITEM TABLE */
CREATE TABLE order_items(
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    item_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES menu_items(item_id) ON DELETE CASCADE
);

/* NOTIFICATION TABLE */
CREATE TABLE notifications(
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    notify_user INT NOT NULL,
    message VARCHAR(255) NOT NULL,
    FOREIGN KEY (notify_user) REFERENCES users(user_id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* FEEDBACK TABLE */
CREATE TABLE feedback(
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    feedback_from INT NOT NULL,
    FOREIGN KEY (feedback_from) REFERENCES users(user_id) ON DELETE CASCADE,
    feedback_for INT NOT NULL,
    FOREIGN KEY (feedback_for) REFERENCES users(user_id) ON DELETE CASCADE,
    feedback_type VARCHAR(50) NOT NULL,
    complaint_status VARCHAR(50) NOT NULL DEFAULT 'Open',
    message VARCHAR(300) NOT NULL,
    related_order INT NULL,
    FOREIGN KEY (related_order) REFERENCES orders(order_id) ON DELETE CASCADE, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* ROLE_PERMISSIONS TABLE */
CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permissions_id INT NOT NULL,
    PRIMARY KEY (role_id, permissions_id),
    FOREIGN KEY (role_id) REFERENCES role(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permissions_id) REFERENCES permissions(permissions_id) ON DELETE CASCADE
);

/* REVIEWS TABLE */
CREATE TABLE reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    message VARCHAR(255),
    amount_stars INT NOT NULL,
    item_reviewed INT NOT NULL,
    reviewed_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_reviewed) REFERENCES menu_items(item_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Insert sample users (password for all: "password123")
INSERT INTO users (username, password_hash, name, email, phone, home_address, role, total_balance, amount_warnings) VALUES
('testuser', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKYVMz3z2e', 'Test User', 'test@test.com', '1234567890', '123 Test St', 'customer', 500, 0),
('chef123', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKYVMz3z2e', 'Head Chef', 'chef@sdfoods.com', '1234567891', '123 Kitchen St', 'chef', 0, 0),
('driver123', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKYVMz3z2e', 'Delivery Driver', 'driver@sdfoods.com', '1234567892', '123 Road St', 'driver', 0, 0),
('admin123', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKYVMz3z2e', 'Admin User', 'admin@sdfoods.com', '1234567893', '123 Office St', 'admin', 0, 0),
('manager123', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYKYVMz3z2e', 'Restaurant Manager', 'manager@sdfoods.com', '1234567894', '123 Manager St', 'manager', 0, 0);

-- Insert categories
INSERT INTO category (category_type) VALUES 
('Burgers'),
('Appetizers'),
('Main Course'),
('Desserts'),
('Beverages'),
('Sides');

-- Insert restaurant tables
INSERT INTO restaurant_tables (table_number, seating_capacity, area, is_available) VALUES
(1, 2, 'Main Dining', TRUE),
(2, 4, 'Main Dining', TRUE),
(3, 4, 'Main Dining', TRUE),
(4, 6, 'Main Dining', TRUE),
(5, 8, 'Private Room', TRUE),
(6, 2, 'Patio', TRUE),
(7, 4, 'Patio', TRUE),
(8, 2, 'Bar', TRUE);

-- Insert menu items
INSERT INTO menu_items (name, description, price, category, created_by, updated_by, image_url, in_stock, is_time_limited, dietary_restrictions) VALUES 
-- BURGERS
('Classic Cheeseburger', 'Juicy beef patty with cheddar cheese, lettuce, tomato, and special sauce', 12.99, 1, 2, 2, 'https://images.unsplash.com/photo-1722125680299-783f98369451', TRUE, FALSE, FALSE),
('Bacon Deluxe Burger', 'Double beef patty with crispy bacon, cheese, and caramelized onions', 15.99, 1, 2, 2, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd', TRUE, FALSE, FALSE),
('Veggie Burger', 'Plant-based patty with avocado, sprouts, and chipotle mayo', 11.99, 1, 2, 2, 'https://images.unsplash.com/photo-1520072959219-c595dc870360', TRUE, FALSE, TRUE),

-- APPETIZERS
('Mozzarella Sticks', 'Golden fried mozzarella with marinara sauce', 7.99, 2, 2, 2, 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7', TRUE, FALSE, FALSE),
('Loaded Nachos', 'Tortilla chips with cheese, jalapeños, sour cream, and guacamole', 9.99, 2, 2, 2, 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d', TRUE, FALSE, FALSE),
('Buffalo Wings', '10 crispy wings tossed in spicy buffalo sauce', 10.99, 2, 2, 2, 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7', TRUE, FALSE, FALSE),

-- MAIN COURSE
('Grilled Salmon', 'Fresh Atlantic salmon with lemon butter and seasonal vegetables', 18.99, 3, 2, 2, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288', TRUE, FALSE, FALSE),
('Chicken Alfredo Pasta', 'Fettuccine pasta in creamy Alfredo sauce with grilled chicken', 14.99, 3, 2, 2, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9', TRUE, FALSE, FALSE),
('Steak and Fries', '8oz ribeye steak cooked to perfection with seasoned fries', 22.99, 3, 2, 2, 'https://images.unsplash.com/photo-1600891964092-4316c288032e', TRUE, FALSE, FALSE),

-- DESSERTS
('Chocolate Lava Cake', 'Warm chocolate cake with molten center, served with vanilla ice cream', 6.99, 4, 2, 2, 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51', TRUE, FALSE, FALSE),
('New York Cheesecake', 'Classic creamy cheesecake with berry compote', 5.99, 4, 2, 2, 'https://images.unsplash.com/photo-1533134242820-b8f73c8354e2', TRUE, FALSE, FALSE),
('Apple Pie', 'Traditional apple pie with cinnamon and flaky crust', 4.99, 4, 2, 2, 'https://images.unsplash.com/photo-1535920527002-b35e96722eb9', TRUE, FALSE, FALSE),

-- BEVERAGES
('Fresh Lemonade', 'Homemade lemonade with mint', 3.99, 5, 2, 2, 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f04', TRUE, FALSE, FALSE),
('Iced Coffee', 'Cold brew coffee with your choice of milk', 4.99, 5, 2, 2, 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7', TRUE, FALSE, FALSE),
('Milkshake', 'Thick and creamy - vanilla, chocolate, or strawberry', 5.99, 5, 2, 2, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699', TRUE, FALSE, FALSE),

-- SIDES
('French Fries', 'Crispy golden fries with sea salt', 3.99, 6, 2, 2, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877', TRUE, FALSE, FALSE),
('Onion Rings', 'Beer-battered onion rings with ranch dipping sauce', 4.99, 6, 2, 2, 'https://images.unsplash.com/photo-1639024471283-03518883512d', TRUE, FALSE, FALSE),
('Caesar Salad', 'Romaine lettuce, parmesan, croutons, and Caesar dressing', 6.99, 6, 2, 2, 'https://images.unsplash.com/photo-1546793665-c74683f339c1', TRUE, FALSE, FALSE);

-- Verify data
SELECT 'Database setup complete!' as message;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_menu_items FROM menu_items;
SELECT COUNT(*) as total_categories FROM category;
SELECT COUNT(*) as total_tables FROM restaurant_tables;