CREATE DATABASE IF NOT EXISTS resturant_database; -- create a db if called resturant if it doesnt alreasy exists 
USE resturant_database; -- work inside this database for the following commands.

/* USER TABLE */
CREATE TABLE users(
    -- auto incrase foe every new customer by 1, primary key = customer id will be the indeifer for this table if we need to refer to it again 
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL, 
    -- password should be hased and not in plain text
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

/* RESERVATIONS TABLE */
CREATE TABLE reservations(
    reservation_id INT AUTO_INCREMENT PRIMARY KEY,
    -- the forgein key will connect table a to table b, so reservation must be connected to a user
    customer_id INT NOT NULL,
    user_table_id INT NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    duration INT NOT NULL,
    reservation_status VARCHAR (50) NOT NULL, 
    number_of_guest INT NOT NULL,
    special_request VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(user_id),
    FOREIGN KEY (user_table_id) REFERENCES tables(tables_id)
);

/* CATEGORY TABLE */
CREATE TABLE category(
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* MENU TABLE */
CREATE TABLE menu_items(
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    price DECIMAL(10,2) NOT NULL,
    -- APPETIZER,MAIN COURSE,DINNER,DESSERT
    cateogory INT NOT NULL, 
    FOREIGN KEY (cateogory) REFERENCES category(category_id),
    -- luch,dinner,breakfest
    is_time_limited BOOLEAN NOT NULL DEFAULT FALSE,
    in_stock BOOLEAN NOT NULL DEFAULT TRUE,
    image_url VARCHAR(255) UNIQUE,
    ---- employee id of who last modified item  (should be a chef)   
    created_by INT NOT NULL, --- should be a chef
    updated_by INT NOT NULL, --- should be a chef 
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id),
    dietary_restrictions BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* ORDERS TABLE */
CREATE TABLE orders(
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    delivered_by INT NOT NULL,
    delivered_to VARCHAR(255) NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES users(user_id), -- should be cistomer 
    FOREIGN KEY (delivered_by) REFERENCES users(user_id), -- should be a chef 
    delivery_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    total_price DECIMAL(10,2) NOT NULL,
    order_date DATE NOT NULL,
    order_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* PAYMENT TABLE */
CREATE TABLE payment(
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,                -- link to the order being paid
    payed_by INT NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_sucessful BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (payed_by) REFERENCES users(user_id)
);

/* ORDER ITEM TABLE */
CREATE TABLE order_items(
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,      -- links to orders table
    item_id INT NOT NULL,       -- links to menu_items table
    quantity INT NOT NULL,      -- how many of this item in the order
    item_price DECIMAL(10,2) NOT NULL,  -- price at time of order
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (item_id) REFERENCES menu_items(item_id)
);

/* NOTIFICATION TABLE */
CREATE TABLE notifications(
    notifcations_id INT AUTO_INCREMENT PRIMARY KEY,
    notify_user INT NOT NULL,
    FOREIGN KEY (notify_user) REFERENCES users(user_id),
    time_sent TIME NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* FEEDBACK TABLE */
CREATE TABLE feedback(
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    feedback_from INT NOT NULL,
    FOREIGN KEY (feedback_from) REFERENCES users(user_id),
    feedback_for INT NOT NULL,
    FOREIGN KEY (feedback_for) REFERENCES users(user_id), -- role should be chef or driver
    feedback_type VARCHAR(50) NOT NULL, -- should only be compliment or complaint
    complaint_status VARCHAR(50) NOT NULL DEFAULT 'Open', -- only for complaints
    message VARCHAR(300) NOT NULL,
    time_sent TIME NOT NULL,
    related_order INT NULL,
    FOREIGN KEY (related_order) REFERENCES orders(order_id), 
    date_sent DATE NOT NULL,
    feedback_status VARCHAR(50),
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
    permissions_type VARCHAR(100) NOT NULL, -- chef,admin,driver,customer
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* ROLE PERMISSIONS TABLE */
CREATE TABLE role_permissions(
    role_permissions_id INT AUTO_INCREMENT PRIMARY KEY,
    user_role INT NOT NULL,
    FOREIGN KEY (user_role) REFERENCES role(role_id), 
    user_permissions INT NOT NULL,
    FOREIGN KEY (user_permissions) REFERENCES permissions(permissions_id), 
    UNIQUE (user_role, user_permissions),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* TABLES AVAILABLE */
CREATE TABLE tables (
    table_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    table_number INT NOT NULL UNIQUE,      --  table number (e.g., 5, 10)
    seating_capacity INT NOT NULL,         -- How many guests it can seat
    area VARCHAR(50)                       -- Optional: 'Main Dining', 'Patio', 'Bar',highcair
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
/* REVIEWS TABLE */
CREATE TABLE reviews(
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    message TEXT,
    amount_stars INT NOT NULL,
    item_reviewed INT NOT NULL,
    FOREIGN KEY (item_reviewed) REFERENCES menu_items(item_id), 
    reviewed_by INT NOT NULL,
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id,) -- should be a customer 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
