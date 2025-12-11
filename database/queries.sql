-- ========== PARENT TABLES (No foreign keys) ==========

-- USERS INSERT QUERIES (Create new user/register account)
INSERT INTO users
(username,password_hash,name,email,phone,home_address,
role,total_balance,amount_warnings,vip_status,is_blacklisted)
VALUES 
('username123', 'password123', 'Jane Doe', 
'jane@example.com', '1234567890', 
'160 Convent Ave,New York, NY,10031', 'customer', 100, 0, FALSE, FALSE),
('chef123', 'password456', 'John Chef', 
'chef@example.com', '0987654321', 
'123 Kitchen St,New York, NY,10031', 'chef', 0, 0, FALSE, FALSE),
('driver123', 'password789', 'Mike Driver', 
'driver@example.com', '5551234567', 
'456 Road Ave,New York, NY,10031', 'driver', 0, 0, FALSE, FALSE),
('admin123', 'password000', 'Admin Boss', 
'admin@example.com', '9998887777', 
'789 Admin Blvd,New York, NY,10031', 'admin', 0, 0, FALSE, FALSE); -- ADDED ADMIN USER

-- USERS TABLE SELECT QUERIES(get user_data/login) --- 
SELECT * FROM users; -- get all users (admin purposes)
SELECT * FROM users WHERE user_id=1; -- get specific user from user_id 
SELECT * FROM users WHERE username='username123'; -- get by username 
SELECT * FROM users WHERE email='jane@example.com'; -- get by email
SELECT * FROM users WHERE phone='1234567890'; -- get by phone number
SELECT * FROM users WHERE vip_status=TRUE; -- fixed typo: vip_staus -> vip_status
SELECT * FROM users WHERE is_blacklisted=TRUE; -- get blacklisted users
SELECT * FROM users WHERE role = 'customer'; -- get user by role 
SELECT * FROM users WHERE role = 'admin'; -- get admin users 
-- USERS TABLE UPDATE QUERIES(update user_data) --- 
UPDATE users SET password_hash = 'new_password' WHERE user_id=1; -- update a user's password
UPDATE users SET phone = '987654321' , home_address = '321 Convent Ave', email='jane1@example.com' WHERE user_id=1; -- update a user's phone, address,email
UPDATE users SET total_balance = total_balance-20 WHERE user_id=1; -- decrease total_balance (order placed)
UPDATE users SET total_balance = total_balance+20 WHERE user_id=1; -- increase total_balance (money added)
UPDATE users SET amount_warnings = amount_warnings + 1, is_blacklisted = TRUE, vip_status = FALSE WHERE user_id = 1; -- Update warnings, blacklist, and balance in one query
UPDATE users SET vip_status = TRUE WHERE user_id=1;


-- INSERT ROLE (ADD NEW ROLE)
INSERT INTO role (role_type)
VALUES ('Chef'), ('Driver'), ('Customer'), ('Admin'); -- 

-- INSERT PERMISSIONS
INSERT INTO permissions (permissions_type) VALUES 
('Update menu items'),
('Receive feedback'),
('Deliver food'),
('Bid for delivery'),
('Browse and order food'),
('Can receive complaints and warnings'),
('Manage all users'), 
('Manage all orders'), 
('Manage all reservations');  -- FIXED: ADDED SEMICOLON HERE

-- INSERT CATEGORY TABLE QUERY (Create new category)
INSERT INTO category (category_type)
VALUES ('Dessert'), ('Appetizer'), ('Main Course');

-- CATEGORY TABLE SELECT QUERIES(get categories) --- 
SELECT * FROM category; -- Get all categories
SELECT * FROM category WHERE category_type = 'Dessert'; -- fixed column name: name -> category_type
-- CATEGORY TABLE UPDATE QUERIES(update category type) --- 
UPDATE category SET category_type = 'Appetizer' WHERE category_id=1; -- update category type
-- CATEGORY TABLE DELETE QUERY (delete category) -- MOVED TO END OF FILE
-- DELETE FROM category WHERE category_id = 1;

-- INSERT TABLES_AVAILABLE (ADD NEW AVAILABLE TABLE)
INSERT INTO restaurant_tables (table_number, seating_capacity, area,is_available)
VALUES (12, 4, 'Balcony',TRUE), (5, 2, 'Main Dining',TRUE), (8, 6, 'Patio',FALSE);
-- SELECT TABLE_AVAILABLE QUERIES (GET TABLE DATA)
SELECT * FROM restaurant_tables;                              -- Get all available tables
SELECT * FROM restaurant_tables WHERE table_number = 12;      -- Get table number
SELECT * FROM restaurant_tables WHERE seating_capacity = 4;   -- Get table seating_capacity
SELECT * FROM restaurant_tables WHERE area = 'Balcony';       -- Get table area
SELECT * FROM restaurant_tables WHERE is_available = TRUE;   
-- UPDATE TABLE_AVAILABLE QUERIES 
UPDATE restaurant_tables SET table_number = 13 WHERE table_id = 1;  -- update table number
UPDATE restaurant_tables SET seating_capacity= 2 WHERE table_id = 1;  -- update table seating capacity
UPDATE restaurant_tables SET area = 'Outdoor' WHERE table_id = 1;  -- update table area
UPDATE restaurant_tables SET is_available = FALSE WHERE table_id = 1;  -- update table availability 

-- ========== INSERT ROLE_PERMISSIONS (MOVED HERE - AFTER role and permissions are populated) ==========

-- Chef permissions
INSERT INTO role_permissions (role_id, permissions_id) VALUES
(1, 1),
(1, 2);
-- Driver permissions
INSERT INTO role_permissions (role_id, permissions_id) VALUES
(2, 3),
(2, 4),
(2, 2);
-- Customer permissions
INSERT INTO role_permissions (role_id, permissions_id) VALUES
(3, 5),
(3, 6);
-- Admin permissions (ALL permissions) -- ADDED
INSERT INTO role_permissions (role_id, permissions_id) VALUES
(4, 7),  -- Manage all users
(4, 8),  -- Manage all orders
(4, 9);  -- Manage all reservations

-- ========== CHILD TABLES LEVEL 1 (Reference only parent tables) ==========

-- INSERT MENU_ITEMS QUERY (Create new menu item)
SET @description1 = 'Grilled Calamari with Lemon-Herb Vinaigrette Plump squid tubes grilled to tender perfection, providing a smoky flavor and a firm, chewy texture. Served over a bed of seasonal greens with a bright, zesty lemon, garlic, and oregano vinaigrette';
INSERT INTO menu_items (name,description, price, category,is_time_limited,in_stock,image_url,created_by,updated_by,dietary_restrictions)
VALUES (
    'Grilled Calamari',                                       
    @description1,                                            
    29.99,                                                    
    2,                                               -- category_id 2 (Appetizer)
    FALSE,                                                     
    TRUE,                                                      
    'https://i0.wp.com/www.kalofagas.ca/wp-content/uploads/2024/06/3cb40a6d-02d3-4c74-83d6-1bb31c1b4d99.jpg?fit=1869%2C2048&ssl=1', -- image_url
    2,                                                         -- user_id 2 (chef)
    2,                                                         -- user_id 2 (chef)
    TRUE
);
-- MENU ITEMS TABLE SELECT QUERIES(get menu_items/filter) --- 
SELECT * FROM menu_items; -- Get all items
SELECT * FROM menu_items WHERE name = 'Grilled Calamari'; -- Get item by name
SELECT * FROM menu_items WHERE price=29.99; -- Get item by price
SELECT * FROM menu_items WHERE category = 2; -- category_id 2 (Appetizer)
SELECT * FROM menu_items WHERE is_time_limited = FALSE; -- get time limited items
SELECT * FROM menu_items WHERE in_stock = TRUE; -- Get items in stock
SET @description2 = 'A classic Roman comfort dish. Tender, thick-cut calamari rings are simmered slowly in a rich, rustic tomato and white wine ragù with garlic, basil, and a hint of smoky chili. Served piping hot with toasted rustic Italian bread for dipping.';
SET @image_url2='https://images.food52.com/O__ncCcKkCn2ttltqBNOB_bNNng=/f8aa65e8-d0a7-4886-b47e-77faa97d7742--2022-0310_spicy-grilled-calamari-final_3x2_julia-gartland.jpg';
-- MENU ITEMS TABLE UPDATE QUERIES(update menu items) --- 
UPDATE menu_items SET name = 'Spicy Calamari' WHERE item_id=1; -- update item name
UPDATE menu_items SET description = @description2 WHERE item_id=1; -- update item description
UPDATE menu_items SET price = price+10 WHERE item_id=1; -- increase price item
UPDATE menu_items SET price = price-10 WHERE item_id=1; -- decrease price item
UPDATE menu_items SET is_time_limited = TRUE WHERE item_id=1; -- update is time limited 
UPDATE menu_items SET in_stock = FALSE WHERE item_id=1; -- item sold out 
UPDATE menu_items SET image_url = @image_url2 WHERE item_id=1; -- change picture 
UPDATE menu_items SET updated_by = 2 WHERE item_id=1; -- update who updated last 
-- MENU_ITEMS TABLE DELETE QUERY (delete item) -- MOVED TO END OF FILE
-- DELETE FROM menu_items WHERE item_id = 1;

-- RESERVATION INSERT QUERY (Create new reservation)
INSERT INTO reservations
(customer_id,table_id,reservation_date,reservation_time,duration,reservation_status,number_of_guest,special_request)
VALUES 
(1, 2, '2025-12-10', '19:00:00', 90, 'Pending', 6, 'Highchair please'); -- user_id 1 and table_id 2
-- RESERVATION TABLE SELECT QUERIES(get user reservations) --- 
SELECT * FROM reservations; -- Get all reservations(admin)
SELECT * FROM reservations WHERE customer_id = 1; -- Get reservations for a specific user
SELECT * FROM reservations WHERE table_id=2; -- Get reservations for a specific table
SELECT * FROM reservations WHERE reservation_status = 'Pending'; -- Get reservations by status 
SELECT * FROM reservations WHERE reservation_date = '2025-12-10'; -- Get reservations for a specific date
SELECT * FROM reservations WHERE reservation_time = '19:00:00'; -- Get reservations for a specific time
-- RESERVATION TABLE UPDATE QUERIES(update user reservations) --- 
UPDATE reservations SET reservation_date = '2025-12-11' WHERE reservation_id=1; -- update date
UPDATE reservations SET reservation_time = '19:30:00' WHERE reservation_id=1; -- update time
UPDATE reservations SET duration = duration+30 WHERE reservation_id=1; -- update duration
UPDATE reservations SET reservation_status = 'Pending' WHERE reservation_id=1; -- update status
UPDATE reservations SET table_id = 2  WHERE reservation_id=1; -- update reservation table
UPDATE reservations SET number_of_guest = number_of_guest+2 WHERE reservation_id=1; -- update # of guest
-- RESERVATION TABLE DELETE QUERY (cancel reservation) -- MOVED TO END OF FILE
-- DELETE FROM reservations WHERE reservation_id = 1;

-- INSERT ORDERS TABLE QUERY (Create new order)
INSERT INTO orders (customer_id,delivered_by, delivered_to,delivery_status,total_price,delivery_date,delivery_time)
VALUES (1,3,'160 Convent Ave,New York, NY,10031','Pending',45.99,'2025-11-10','19:03:50'); -- user_id 1 and 3
-- ORDERS TABLE SELECT QUERIES(get order data) --- 
SELECT * FROM orders; -- Get all orders
SELECT * FROM orders WHERE customer_id = 1; -- Get orders for specific user (admin)
SELECT * FROM orders WHERE delivered_by = 3; -- Get orders delivered by specific person
SELECT * FROM orders WHERE delivered_to = '160 Convent Ave,New York, NY,10031'; -- Get orders delivered to a specific place
SELECT * FROM orders WHERE delivery_status = 'Pending'; -- Get order status 
SELECT * FROM orders WHERE delivery_date = '2025-11-10'; -- Get order by date 
SELECT * FROM orders WHERE delivery_time = '19:03:50'; -- Get order by time
-- ORDERS TABLE UPDATE QUERIES(update order delivery data ) --- 
UPDATE orders SET delivered_to = '209 Convent Ave,New York, NY,10031' WHERE order_id=1; -- update address
UPDATE orders SET delivery_date = '2025-11-11' WHERE order_id=1; -- update delivery date
UPDATE orders SET delivery_time = '15:30:05' WHERE order_id=1; -- corrected column; previously delivery_status

-- ========== CHILD TABLES LEVEL 2 (Reference Level 1 tables) ==========

-- INSERT PAYMENT TABLE QUERY (Create new payment)
INSERT INTO payment (order_id,payed_by,amount_paid,payment_successful)
VALUES (1,1,45.99,TRUE); -- order_id 1 and user_id 1
-- PAYMENTS TABLE SELECT QUERIES(get payment history) --- 
SELECT * FROM payment; -- Get all transactions
SELECT * FROM payment WHERE payed_by = 1; -- Get payment history for specific user (admin)
SELECT * FROM payment WHERE order_id = 1; -- Get payment for specific order
SELECT * FROM payment WHERE payment_successful = TRUE; -- Get successful payments
-- PAYMENTS TABLE UPDATE QUERIES(update payment status) --- 
UPDATE payment SET payment_successful = FALSE WHERE payment_id=1; -- update payment status 

-- INSERT ORDER_ITEMS TABLE QUERY (ADD NEW ITEM TO ORDER)
INSERT INTO order_items (order_id,item_id,quantity,item_price)
VALUES (1,1,2,29.99); -- order_id 1 and item_id 1
-- ORDER_ITEMS TABLE SELECT QUERIES(get order item data) --- 
SELECT * FROM order_items; -- Get all items
SELECT * FROM order_items WHERE item_id = 1; -- Get specific item from order
SELECT * FROM order_items WHERE order_id = 1; -- Get items from specific order
SELECT * FROM order_items WHERE quantity = 2; -- Get item quantity
SELECT * FROM order_items WHERE item_price = 29.99; -- Get item price
-- ORDER_ITEMS TABLE UPDATE QUERIES(update order items) --- 
UPDATE order_items SET quantity = 3 WHERE order_item_id=1; -- update item quantity
UPDATE order_items SET item_price = 20.99 WHERE order_item_id=1; -- update item price
-- ORDER_ITEMS TABLE DELETE QUERIES(delete item from order) -- MOVED TO END OF FILE
-- DELETE FROM order_items where order_item_id=1; 

-- INSERT NOTIFICATIONS TABLE QUERY (ADD NEW NOTIFICATION)
INSERT INTO notifications (notify_user, message, is_read)
VALUES (1, 'Your order was successfully delivered', FALSE); -- user_id 1
-- NOTIFICATIONS TABLE SELECT QUERIES (get notification data)
SELECT * FROM notifications;                           -- Get all notifications
SELECT * FROM notifications WHERE is_read = FALSE;     -- Get unread notifications
SELECT * FROM notifications WHERE notify_user = 1;     -- Get notifications for a specific user
-- NOTIFICATIONS TABLE UPDATE QUERIES (update notifications)
UPDATE notifications SET is_read = TRUE WHERE notification_id = 1;  -- fixed column name typo

-- INSERT FEEDBACK (ADD NEW COMPLAINT OR COMPLIMENT)
INSERT INTO feedback (feedback_from, feedback_for, feedback_type, complaint_status, message, related_order)
VALUES (1, 3, 'Complaint', 'Open', 'Delivery driver was late and rude', 1); -- user_id 1,3 and order_id 1
-- SELECT QUERIES (GET FEEDBACK DATA)
SELECT * FROM feedback;                              -- Get all feedback
SELECT * FROM feedback WHERE feedback_type = 'Complaint';    -- Get complaints
SELECT * FROM feedback WHERE complaint_status = 'Open';      -- Get open complaints
SELECT * FROM feedback WHERE related_order = 1;             -- Get feedback for a specific order
-- UPDATE QUERIES (UPDATE COMPLAINT STATUS)
UPDATE feedback SET complaint_status = 'Resolved' WHERE feedback_id = 1;  -- mark a complaint as resolved

-- INSERT REVIEW (ADD NEW REVIEW FOR MENU_ITEM)
INSERT INTO reviews (message, amount_stars, item_reviewed, reviewed_by)
VALUES ('Food was very good and spicy. Perfect for those who enjoy spicy food', 5, 1, 1); -- item_id 1 and user_id 1
-- SELECT REVIEW QUERIES (GET REVIEW DATA)
SELECT * FROM reviews;                              -- Get all reviews
SELECT * FROM reviews WHERE amount_stars = 5;       -- Get reviews based on stars
SELECT * FROM reviews WHERE item_reviewed = 1;      -- Get reviews for a specific item
SELECT * FROM reviews WHERE reviewed_by = 1;        -- Get reviews from a specific user
-- UPDATE REVIEW QUERIES (UPDATE REVIEW)
UPDATE reviews SET message = 'Food was too dry. Did not like', amount_stars = 4 WHERE review_id = 1;
-- DELETE REVIEW QUERY (DELETE REVIEW) -- MOVED TO END OF FILE
-- DELETE FROM reviews WHERE review_id = 1;

--  DELETE QUERIES (ALL MOVED TO END)--

-- DELETE REVIEW QUERY (DELETE REVIEW)
DELETE FROM reviews WHERE review_id = 1;

-- ORDER_ITEMS TABLE DELETE QUERIES(delete item from order)
DELETE FROM order_items where order_item_id=1; 

-- RESERVATION TABLE DELETE QUERY (cancel reservation)
DELETE FROM reservations WHERE reservation_id = 1;

-- MENU_ITEMS TABLE DELETE QUERY (delete item)
DELETE FROM menu_items WHERE item_id = 1;

-- CATEGORY TABLE DELETE QUERY (delete category)
DELETE FROM category WHERE category_id = 1;

-- USERS TABLE DELETE QUERY (delete user)
DELETE FROM users WHERE user_id = 1;