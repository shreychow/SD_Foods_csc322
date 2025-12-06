CREATE DATABASE IF NOT EXISTS restaurant_database; -- create a db if called restaurant if it doesn't already exist 
USE restaurant_database; -- work inside this database for the following commands.

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
    -- auto increase foe every new customer by 1, primary key = customer id will be the identifier for this table if we need to refer to it again 
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL, 
    -- password should be hashed and not in plain text
    password_hash VARCHAR (255) NOT NULL, 
    -- name can be up to 100 letters, cannot be left blank 
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
    table_number INT NOT NULL UNIQUE,      --  table number (e.g., 5, 10)
    seating_capacity INT NOT NULL,         -- How many guests it can seat
    area VARCHAR(50),                       -- Optional: 'Main Dining', 'Patio', 'Bar',highchair
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
    role_type VARCHAR(100) NOT NULL, -- chef,admin,driver,customer
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* PERMISSIONS TABLE */
CREATE TABLE permissions(
    permissions_id INT AUTO_INCREMENT PRIMARY KEY,
    permissions_type VARCHAR(255) NOT NULL, -- chef,admin,driver,customer
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* MENU TABLE */
CREATE TABLE menu_items(
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    price DECIMAL(10,2) NOT NULL,
    -- APPETIZER,MAIN COURSE,DINNER,DESSERT
    category INT NOT NULL, 
    FOREIGN KEY (category) REFERENCES category(category_id) ON DELETE CASCADE,
    -- lunch,dinner,breakfast
    is_time_limited BOOLEAN NOT NULL DEFAULT FALSE,
    in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    image_url VARCHAR(255) UNIQUE,
    -- employee id of who last modified item  (should be a chef)   
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
    -- the foreign key will connect table a to table b, so reservation must be connected to a user
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
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE, -- should be customer 
    FOREIGN KEY (delivered_by) REFERENCES users(user_id) ON DELETE CASCADE, -- should be a chef 
    delivery_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    total_price DECIMAL(10,2) NOT NULL,
    delivery_date DATE NOT NULL,
    delivery_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* PAYMENT TABLE */
CREATE TABLE payment(
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,                -- link to the order being paid
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
    order_id INT NOT NULL,      -- links to orders table
    item_id INT NOT NULL,       -- links to menu_items table
    quantity INT NOT NULL,      -- how many of this item in the order
    item_price DECIMAL(10,2) NOT NULL,  -- price at time of order
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
    FOREIGN KEY (feedback_for) REFERENCES users(user_id) ON DELETE CASCADE, -- role should be chef or driver
    feedback_type VARCHAR(50) NOT NULL, -- should only be compliment or complaint
    complaint_status VARCHAR(50) NOT NULL DEFAULT 'Open', -- only for complaints
    message VARCHAR(300) NOT NULL,
    related_order INT NULL,
    FOREIGN KEY (related_order) REFERENCES orders(order_id) ON DELETE CASCADE, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* ROLE_PERMISSIONS TABLE (join table) */
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
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE CASCADE -- should be a customer
);