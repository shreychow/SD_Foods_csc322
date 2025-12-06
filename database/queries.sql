--If multiple columns must be updated together (like warnings, blacklist, and balance after a single violation), use one query.
--If updates are independent, do them separately in the backend.

--  USERS INSERT QUERIES (Create new user/register account)
INSERT INTO users
(username,password_hash,name,email,phone,home_address,
role,total_balance,amount_warnings,vip_status)
VALUES 
('username123', 'password123', 'Jane Doe', 
'jane@example.com', '1234567890', 
'160 Convent Ave,New York, NY,10031', 'customer', 100, 0, FALSE,FALSE);

--- USERS TABLE SELECT QUERIES(get user_data/login) --- 
SELECT * FROM users; -- get all users (admin purposes)
SELECT * FROM users WHERE user_id=1; -- get specifc user from user_id 
SELECT * FROM users WHERE username='username123'; -- get by username 
SELECT * FROM users WHERE email='jane@example.com'; -- get by email
SELECT * FROM users WHERE phone='1234567890'; -- get by phone number
SELECT * FROM users WHERE vip_staus=TRUE; -- get by vip status 
SELECT * FROM users WHERE is_blacklisted=TRUE; -- get blacklisted users
SELECT * FROM users WHERE role = 'customer'; -- get user by role 

--- USERS TABLE UPDATE QUERIES(update user_data) --- 
UPDATE users SET password_hash = 'new_password' WHERE user_id=1; -- updaye a user's password
UPDATE users SET phone = '987654321' , home_address = '321 Convent Ave', email='jane1@example.com' WHERE user_id=1; -- updaye a user's phone, address,email
UPDATE users SET total_balance = total_balance-20 WHERE user_id=1; -- decrease total_savings (ordered placed)
UPDATE users SET total_balance = total_balance+20 WHERE user_id=1; -- decrease total_savings (ordered money added)
UPDATE users SET amount_warnings = amount_warnings + 1, is_blacklisted = TRUE, vip_status = FALSE WHERE user_id = 1; -- Update warnings, blacklist, and balance in one query
UPDATE users SET vip_status = TRUE WHERE user_id=1

-- USERS TABLE DELETE QUERY (delete user)
DELETE FROM users WHERE user_id = 1;


--  RESERVATION INSERT QUERY (Create new reservation)
INSERT INTO reservations
(customer_id,user_table_id,reservation_date,reservation_time,reservation_status,number_of_guest,special_request)
VALUES 
(1, 2, '2025-12-10', '19:00:00', 90, 'Pending', 6, 'Highchair please');

--- RESERVATION TABLE SELECT QUERIES(get user reservations) --- 
SELECT * FROM reservations; -- Get all reservations(admin)
SELECT * FROM reservations WHERE customer_id = 1; -- Get reservations for a specific user
SELECT * FROM reservations WHERE user_table_id=2; -- Get reservations for a specific table
SELECT * FROM reservations WHERE reservation_status = 'Pending'; -- Get reservations by status 
SELECT * FROM reservations WHERE reservation_date = '2025-12-10'; -- Get reservations for a specific date
SELECT * FROM reservations WHERE reservation_time = '19:00:00'; -- Get reservations for a specific time

--- RESERVATION TABLE UPDATE QUERIES(update user reservations) --- 
UPDATE reservations SET reservation_date = '2025-12-11' WHERE reservation_id=1; -- update date
UPDATE reservations SET reservation_time = '19:00:00' WHERE reservation_id=1; -- update time
UPDATE reservations SET duration = duration+30 WHERE reservation_id=1; -- update duration (should be fee)
UPDATE reservations SET reservation_status = 'Pending' WHERE reservation_id=1; -- update status
UPDATE reservations SET user_table_id = 2  WHERE reservation_id=1; -- update reservation table
UPDATE reservations SET number_of_guest = number_of_guest+2 WHERE reservation_id=1; -- update # of guest

-- RESERVATION TABLE DELETE QUERY (cancel reservation)
DELETE FROM reservations WHERE reservation_id = 1;



--  INSERT ITEMS QUERY (Create new menu item)
SET @description1 = 'Grilled Calamari with Lemon-Herb Vinaigrette Plump squid tubes grilled to tender perfection, providing a smoky flavor and a firm, chewy texture. Served over a bed of seasonal greens with a bright, zesty lemon, garlic, and oregano vinaigrette';
INSERT INTO menu_items (name,description, price, category,is_time_limited,in_stock,image_url,created_by,updated_by,dietary_restrictions)
VALUES (
    'Grilled Calamari',                                       
    @description1,                                            
    29.99,                                                    
    1,                                               
    FALSE,                                                     
    TRUE,                                                      
    'https://i0.wp.com/www.kalofagas.ca/wp-content/uploads/2024/06/3cb40a6d-02d3-4c74-83d6-1bb31c1b4d99.jpg?fit=1869%2C2048&ssl=1', -- image_url
    3,                                                         
    3,                                                         
    'Contains Shellfish (Mollusk/Squid).' -- dietary_restrictions
);

--- MENU ITEMS TABLE SELECT QUERIES(get menu_items/filter) --- 
SELECT * FROM menu_items; -- Get all items
SELECT * FROM menu_items WHERE name = 'Grilled Calamari'; -- Get item by name
SELECT * FROM menu_items WHERE price=29.99; -- Get item by price
SELECT * FROM menu_items WHERE category = 1; -- Get item by category 
SELECT * FROM menu_items WHERE is_time_limited = FALSE; -- get time limited items
SELECT * FROM menu_items WHERE in_stock = TRUE; -- Get items in stock

SET @description2 = 'A classic Roman comfort dish. Tender, thick-cut calamari rings are simmered slowly in a rich, rustic tomato and white wine ragù with garlic, basil, and a hint of smoky chili. Served piping hot with toasted rustic Italian bread for dipping.'
SET @image_url2='https://images.food52.com/O__ncCcKkCn2ttltqBNOB_bNNng=/f8aa65e8-d0a7-4886-b47e-77faa97d7742--2022-0310_spicy-grilled-calamari-final_3x2_julia-gartland.jpg'

--- MENU ITEMS TABLE UPDATE QUERIES(update menu items) --- 
UPDATE menu_items SET name = 'Spicy Calamari' WHERE item_id=1; -- update item name
UPDATE menu_items SET description = @description2 WHERE item_id=1; -- update item descrption
UPDATE menu_items SET price = price+10 WHERE item_id=1; -- increase price item
UPDATE menu_items SET price = price-10 WHERE item_id=1; -- decrease price item
UPDATE menu_items SET is_time_limited = TRUE WHERE item_id=1; -- update is time limited 
UPDATE menu_items SET in_stock = FALSE WHERE item_id=1; -- item sold out 
UPDATE menu_items SET image_url = @image_url2 WHERE item_id=1; -- cahnge picture 
UPDATE menu_items SET updated_by = 4 WHERE item_id=1; -- update who updated last 
UPDATE menu_items SET dietary_restrictions='Contains:Shellfish (Mollusk/Squid), Gluten (Rustic Bread). Contains Alcohol (White Wine).' WHERE item_id=1; -- cahnge allegrns 

-- RESERVATION TABLE DELETE QUERY (cancel reservation)
DELETE FROM menu_items WHERE item_id = 1;


--  INSERT CATEGORY TABLE QUERY (Create new cateofory)
INSERT INTO category (category_type)
VALUES (
    'Dessert'
);
--- CATEGORY TABLE SELECT QUERIES(get categories) --- 
SELECT * FROM category; -- Get all categories
SELECT * FROM category WHERE name = 'Dessert'; -- Get category by name

---  CATEGORY TABLE UPDATE QUERIES(update menu items) --- 
UPDATE category SET category_type = 'Appitizer' WHERE category_id=1; -- update category type

-- RESERVATION TABLE DELETE QUERY (cancel reservation)
DELETE FROM menu_items WHERE item_id = 1;


























 