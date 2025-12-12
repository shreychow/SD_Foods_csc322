-- SD FOODS RESTAURANT DATABASE - COMPLETE SCHEMA WITH ALL TEST USERS

CREATE DATABASE IF NOT EXISTS restaurant_database;
USE restaurant_database;

-- Drop existing tables 
DROP TABLE IF EXISTS chat_ratings;
DROP TABLE IF EXISTS chat_history;
DROP TABLE IF EXISTS knowledge_base;
DROP TABLE IF EXISTS delivery_bids;
DROP TABLE IF EXISTS vip_requests;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS role;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS payment;
DROP TABLE IF EXISTS delivery_assignments;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS menu_items;
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS restaurant_tables;
DROP TABLE IF EXISTS users;


-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users(
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL, 
    password_hash VARCHAR(255) NOT NULL, 
    name VARCHAR(100) NOT NULL, 
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    home_address VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    total_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
    salary DECIMAL(10,2) DEFAULT 0,
    amount_warnings INT NOT NULL DEFAULT 0,
    vip_status BOOLEAN NOT NULL DEFAULT FALSE,
    is_blacklisted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- OTHER TABLES
-- ============================================

CREATE TABLE restaurant_tables (
    table_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    table_number INT NOT NULL UNIQUE,
    seating_capacity INT NOT NULL,
    area VARCHAR(50),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE category(
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions(
    permissions_id INT AUTO_INCREMENT PRIMARY KEY,
    permissions_type VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE menu_items(
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    price DECIMAL(10,2) NOT NULL,
    category INT NOT NULL, 
    FOREIGN KEY (category) REFERENCES category(category_id) ON DELETE CASCADE,
    is_time_limited BOOLEAN NOT NULL DEFAULT FALSE,
    in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    image_url VARCHAR(255),
    created_by INT NOT NULL, 
    updated_by INT NOT NULL, 
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE CASCADE,
    dietary_restrictions BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reservations(
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    table_id INT NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    duration INT NOT NULL,
    reservation_status VARCHAR(50) NOT NULL, 
    number_of_guest INT NOT NULL,
    special_request VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (table_id) REFERENCES restaurant_tables(table_id) ON DELETE CASCADE
);

CREATE TABLE orders(
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    prepared_by INT NULL,
    delivered_by INT NULL,
    delivered_to VARCHAR(255) NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (prepared_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (delivered_by) REFERENCES users(user_id) ON DELETE SET NULL,
    delivery_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    total_price DECIMAL(10,2) NOT NULL,
    delivery_date DATE NOT NULL,
    delivery_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_delivered_by (delivered_by),
    INDEX idx_prepared_by (prepared_by)
);

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

CREATE TABLE notifications(
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    notify_user INT NOT NULL,
    message VARCHAR(255) NOT NULL,
    FOREIGN KEY (notify_user) REFERENCES users(user_id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permissions_id INT NOT NULL,
    PRIMARY KEY (role_id, permissions_id),
    FOREIGN KEY (role_id) REFERENCES role(role_id) ON DELETE CASCADE,
    FOREIGN KEY (permissions_id) REFERENCES permissions(permissions_id) ON DELETE CASCADE
);

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


-- AI CHAT SYSTEM TABLES


CREATE TABLE knowledge_base (
    kb_id INT AUTO_INCREMENT PRIMARY KEY,
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    created_by INT NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE,
    is_approved BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    total_ratings INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_question (question(100)),
    INDEX idx_category (category),
    INDEX idx_active (is_active)
);

CREATE TABLE chat_history (
    chat_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    source VARCHAR(50) NOT NULL,
    kb_id INT,
    FOREIGN KEY (kb_id) REFERENCES knowledge_base(kb_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_session (session_id),
    INDEX idx_source (source)
);

CREATE TABLE chat_ratings (
    rating_id INT AUTO_INCREMENT PRIMARY KEY,
    chat_id INT NOT NULL,
    FOREIGN KEY (chat_id) REFERENCES chat_history(chat_id) ON DELETE CASCADE,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 0 AND 5),
    feedback TEXT,
    is_flagged BOOLEAN DEFAULT FALSE,
    reviewed_by INT,
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    review_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_flagged (is_flagged),
    INDEX idx_review_status (review_status)
);


-- DELIVERY BIDDING SYSTEM


CREATE TABLE delivery_bids (
    bid_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    driver_id INT NOT NULL,
    bid_amount DECIMAL(10,2) NOT NULL,
    bid_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    justification TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_order (order_id),
    INDEX idx_driver (driver_id),
    INDEX idx_status (bid_status)
);


-- VIP REQUESTS


CREATE TABLE vip_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    request_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_date TIMESTAMP NULL,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_status (request_status),
    INDEX idx_customer (customer_id)
);


-- INSERT SAMPLE DATA


-- ALL TEST USERS 
INSERT INTO users (username, password_hash, name, email, phone, home_address, role, total_balance, salary, amount_warnings, vip_status) VALUES
-- Customers
('testuser', '$2b$12$sdaOVQmBeUJLYvEiI2QXFO5/HN2QZshqZjgMWyuhUQ6Uu1MsZ0Xaa', 'Test User', 'test@test.com', '1234567890', '123 Test St', 'customer', 1000.00, 0, 0, 0),
('customer1', '$2b$12$A.IO1io9EsxavEM6K1aiHuV/eTrrMLqL2UWo0HpFaSQJFhWO6H5uG', 'Customer One', 'customer1@test.com', '1234567891', '124 Customer St', 'customer', 1000.00, 0, 0, 0),

-- Chefs
('chef123', '$2b$12$ILBE6BtEqTJe65.PRRQswOZPvBgZXNBSaw8Bl9hdpw4RSvIQz0e5C', 'Default Chef', 'chef@sdfoods.com', '1234567892', '125 Kitchen St', 'chef', 0, 3000.00, 0, 0),
('Headchef', '$2b$12$JJESfhu0jNbRPxVXBkLPWOOos98zGBRbrcH1DIgudHZ9zO/cV3M2e', 'Head Chef 1', 'headchef1@sdfoods.com', '1234567893', '126 Kitchen Ave', 'chef', 0, 3000.00, 0, 0),
('Headchef2', '$2b$12$0yX22rO29HAAvuZjq9800.wqnLssE1GaL7SUMwNCGd4Ig4dB0299y', 'Head Chef 2', 'headchef2@sdfoods.com', '1234567894', '127 Kitchen Ave', 'chef', 0, 3000.00, 0, 0),

-- Delivery Drivers
('driver123', '$2b$12$jj/nDvVEwjcJtYMbSGIaX.TSDSuHew9zQb5xQFF9De8jwdox1dhe.', 'Default Driver', 'driver@sdfoods.com', '1234567895', '128 Road St', 'driver', 0, 500.00, 0, 0),
('deliverydriver', '$2b$12$0NWXYvV2dVzGpfB6Mt6ivuCWNZgJqbtZmVyq34AC2XbYs4aTsRxRq', 'Delivery Driver 1', 'driver1@sdfoods.com', '1234567896', '129 Road St', 'driver', 0, 500.00, 0, 0),
('deliverydriver2', '$2b$12$JBnd39WZWcwGicUMIuvnL.af4LQ/AyIA1I48YhW1LVDkGDZ1A8hAm', 'Delivery Driver 2', 'driver2@sdfoods.com', '1234567897', '130 Road St', 'driver', 0, 500.00, 0, 0),

-- Managers/Admins
('admin123', '$2b$12$o3bBcavOOJRZ3eAt8YSmWuPkln5/JhDJN/bXXZtJBCgv9nsoZrRma', 'Admin User', 'admin@sdfoods.com', '1234567898', '131 Office St', 'admin', 0, 7500.00, 0, 0),
('manager123', '$2b$12$yYL2CDC4NmdoWky60GzgtOtshIYqUtjGVmLCa6LriYnps91IEKt1C', 'Default Manager', 'manager@sdfoods.com', '1234567899', '132 Manager St', 'manager', 0, 5000.00, 0, 0),
('manager', '$2b$12$rui5wKppwA3GRyWycRMBX.oSaNkDnGEJVTQPiM5fbSLhL9FRp.hnq', 'Restaurant Manager', 'manager2@sdfoods.com', '1234567900', '133 Manager St', 'manager', 0, 5000.00, 0, 0);

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
INSERT INTO menu_items (name, description, price, category, created_by, updated_by, image_url, in_stock) VALUES 
-- BURGERS
('Classic Cheeseburger', 'Juicy beef patty with cheddar cheese, lettuce, tomato', 12.99, 1, 3, 3, 'https://images.unsplash.com/photo-1722125680299-783f98369451', TRUE),
('Bacon Deluxe Burger', 'Double beef patty with crispy bacon and cheese', 15.99, 1, 3, 3, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd', TRUE),
('Veggie Burger', 'Plant-based patty with avocado and sprouts', 11.99, 1, 3, 3, 'https://images.unsplash.com/photo-1520072959219-c595dc870360', TRUE),

-- APPETIZERS
('Mozzarella Sticks', 'Golden fried mozzarella with marinara', 7.99, 2, 3, 3, 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7', TRUE),
('Loaded Nachos', 'Tortilla chips with cheese and jalapeños', 9.99, 2, 3, 3, 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d', TRUE),

-- DESSERTS
('Chocolate Lava Cake', 'Warm chocolate cake with ice cream', 6.99, 4, 3, 3, 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51', TRUE),
('Cheesecake', 'Classic creamy cheesecake', 5.99, 4, 3, 3, 'https://images.unsplash.com/photo-1533134242820-b8f73c8354e2', TRUE);

-- Insert knowledge base
INSERT INTO knowledge_base (question, answer, category, created_by) VALUES
('What are your hours?', 'We are open daily from 11:00 AM to 10:00 PM.', 'Hours', 3),
('Do you offer delivery?', 'Yes! We offer delivery within 5 miles. Delivery takes 30-45 minutes.', 'Delivery', 3),
('How do I become VIP?', 'Spend over $100 or complete 3 orders. VIP gets 5% off all orders!', 'VIP', 3),
('Can I track my order?', 'Yes! Check the Orders section to see your order status in real-time.', 'Orders', 3);


-- VERIFY 


SELECT 'Database setup complete!' as message;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_menu_items FROM menu_items;
SELECT COUNT(*) as total_categories FROM category;

-- Show all fake accounts made
SELECT 
    user_id,
    username,
    password_hash as password,
    role,
    name
FROM users
ORDER BY role, user_id;











