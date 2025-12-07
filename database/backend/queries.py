# The queries.py file all queries written in  Python so your Flask app can call them easily. connection between database and Flask routes.

# ------------ USERS -------------------
def insert_user():
    return """
    INSERT INTO users 
    (username,password_hash,name,email,
    phone,home_address,role,total_balance,amount_warnings,vip_status,is_blacklisted) 
    
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) """

def get_all_users():
    return "SELECT * FROM users"

def get_user_by_id():
    return "SELECT * FROM users WHERE user_id=%s"

def get_user_by_username():
    return "SELECT * FROM users WHERE username = %s"

def get_user_by_email():
    return "SELECT * FROM users WHERE email = %s"

def get_user_by_phone():
    return "SELECT * FROM users WHERE phone = %s"

def get_vip_users():
    return "SELECT * FROM users WHERE vip_status=%s"

def get_blacklisted_users():
    return "SELECT * FROM users WHERE is_blacklisted=%s"

def get_user_by_role():
    return "SELECT * FROM users WHERE role = %s"

def get_admin_user():
    return "SELECT * FROM users WHERE role = %s"

def update_user_password():
    return "UPDATE users SET password_hash = 'new_password' WHERE user_id=%s"

def update_user_contact():
    return "UPDATE users SET phone=%s, home_address=%s, email=%s WHERE user_id=%s"

def update_user_balance():
    return "UPDATE users SET total_balance=%s WHERE user_id=%s"

def update_user_warnings():
    return """
    UPDATE users 
    SET amount_warnings=%s, is_blacklisted=%s, vip_status=%s
    WHERE user_id=%s
    """

def update_user_vip_status():
    return "UPDATE users SET vip_status=%s WHERE user_id=%s"

def delete_user():
    return "DELETE FROM users WHERE user_id=%s"


# ---------------- ROLE ----------------
def insert_role():
    return "INSERT INTO role (role_type) VALUES (%s)"

def get_all_roles():
    return "SELECT * FROM role"

def get_role_by_type():
    return "SELECT * FROM role WHERE role_type=%s"

def update_role():
    return "UPDATE role SET role_type=%s WHERE role_id=%s"


# ---------------- PERMISSIONS ----------------
def insert_permission():
    return "INSERT INTO permissions (permissions_type) VALUES (%s)"

def get_all_permissions():
    return "SELECT * FROM permissions"

def get_permission_by_type():
    return "SELECT * FROM permissions WHERE permissions_type=%s"

def update_permission():
    return "UPDATE permissions SET permissions_type=%s WHERE permissions_id=%s"


# ---------------- ROLE_PERMISSIONS ----------------
def insert_role_permission():
    return "INSERT INTO role_permissions (role_id, permissions_id) VALUES (%s, %s)"

def get_all_role_permissions():
    return "SELECT * FROM role_permissions"

def delete_role_permission():
    return "DELETE FROM role_permissions WHERE role_id=%s AND permissions_id=%s"


# ---------------- RESERVATIONS ----------------
def insert_reservation():
    return """
    INSERT INTO reservations (customer_id, user_table_id, reservation_date,
    reservation_time, duration, reservation_status, number_of_guest, special_request)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """

def get_all_reservations():
    return "SELECT * FROM reservations"

def get_reservation_by_customer():
    return "SELECT * FROM reservations WHERE customer_id=%s"

def get_reservation_by_table():
    return "SELECT * FROM reservations WHERE user_table_id=%s"

def get_reservation_by_status():
    return "SELECT * FROM reservations WHERE reservation_status=%s"

def get_reservation_by_date():
    return "SELECT * FROM reservations WHERE reservation_date=%s"

def get_reservation_by_time():
    return "SELECT * FROM reservations WHERE reservation_time=%s"

def update_reservation():
    return """
    UPDATE reservations SET reservation_date=%s, reservation_time=%s, duration=%s,
    reservation_status=%s, user_table_id=%s, number_of_guest=%s
    WHERE reservation_id=%s
    """

def delete_reservation():
    return "DELETE FROM reservations WHERE reservation_id=%s"


# ---------------- CATEGORY ----------------
def insert_category():
    return "INSERT INTO category (category_type) VALUES (%s)"

def get_all_categories():
    return "SELECT * FROM category"

def get_category_by_type():
    return "SELECT * FROM category WHERE category_type=%s"

def update_category():
    return "UPDATE category SET category_type=%s WHERE category_id=%s"

def delete_category():
    return "DELETE FROM category WHERE category_id=%s"


# ---------------- MENU ITEMS ----------------
def insert_menu_item():
    return """
    INSERT INTO menu_items (name, description, price, category, is_time_limited,
    in_stock, image_url, created_by, updated_by, dietary_restrictions)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

def get_all_menu_items():
    return "SELECT * FROM menu_items"

def get_menu_item_by_name():
    return "SELECT * FROM menu_items WHERE name=%s"

def get_menu_item_by_price():
    return "SELECT * FROM menu_items WHERE price=%s"

def get_menu_items_by_category():
    return "SELECT * FROM menu_items WHERE category=%s"

def get_time_limited_items():
    return "SELECT * FROM menu_items WHERE is_time_limited=%s"

def get_in_stock_items():
    return "SELECT * FROM menu_items WHERE in_stock=%s"

def update_menu_item():
    return """
    UPDATE menu_items SET name=%s, description=%s, price=%s, is_time_limited=%s,in_stock=%s, image_url=%s, updated_by=%s
    WHERE item_id=%s
    """

def delete_menu_item():
    return "DELETE FROM menu_items WHERE item_id=%s"

# ---------------- ORDERS ----------------
def insert_order():
    return """
    INSERT INTO orders (customer_id, delivered_by, delivered_to, delivery_status,
    total_price, delivery_date, delivery_time)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    """

def get_all_orders():
    return "SELECT * FROM orders"

def get_orders_by_customer():
    return "SELECT * FROM orders WHERE customer_id=%s"

def get_orders_by_delivered_by():
    return "SELECT * FROM orders WHERE delivered_by=%s"

def get_orders_by_address():
    return "SELECT * FROM orders WHERE delivered_to=%s"

def get_orders_by_status():
    return "SELECT * FROM orders WHERE delivery_status=%s"

def get_orders_by_date():
    return "SELECT * FROM orders WHERE delivery_date=%s"

def get_orders_by_time():
    return "SELECT * FROM orders WHERE delivery_time=%s"

def update_order():
    return """
    UPDATE orders SET delivered_to=%s, delivery_date=%s, delivery_time=%s, delivery_status=%s
    WHERE order_id=%s
    """

def delete_order():
    return "DELETE FROM orders WHERE order_id=%s"


# ---------------- PAYMENT ----------------
def insert_payment():
    return """
    INSERT INTO payment (order_id, payed_by, amount_paid, payment_successful)
    VALUES (%s, %s, %s, %s)
    """

def get_all_payments():
    return "SELECT * FROM payment"

def get_payments_by_user():
    return "SELECT * FROM payment WHERE payed_by=%s"

def get_payments_by_order():
    return "SELECT * FROM payment WHERE order_id=%s"

def get_successful_payments():
    return "SELECT * FROM payment WHERE payment_successful=%s"

def update_payment():
    return "UPDATE payment SET payment_successful=%s WHERE payment_id=%s"


# ---------------- ORDER ITEMS ----------------
def insert_order_item():
    return "INSERT INTO order_items (order_id, item_id, quantity, item_price) VALUES (%s, %s, %s, %s)"

def get_all_order_items():
    return "SELECT * FROM order_items"

def get_order_items_by_item():
    return "SELECT * FROM order_items WHERE item_id=%s"

def get_order_items_by_order():
    return "SELECT * FROM order_items WHERE order_id=%s"

def update_order_item():
    return "UPDATE order_items SET quantity=%s, item_price=%s WHERE order_item_id=%s"

def delete_order_item():
    return "DELETE FROM order_items WHERE order_item_id=%s"


# ---------------- NOTIFICATIONS ----------------
def insert_notification():
    return "INSERT INTO notifications (notify_user, message, is_read) VALUES (%s, %s, %s)"

def get_all_notifications():
    return "SELECT * FROM notifications"

def get_notifications_by_user():
    return "SELECT * FROM notifications WHERE notify_user=%s"

def get_unread_notifications():
    return "SELECT * FROM notifications WHERE is_read=%s"

def update_notification():
    return "UPDATE notifications SET is_read=%s WHERE notification_id=%s"


# ---------------- FEEDBACK ----------------
def insert_feedback():
    return """
    INSERT INTO feedback (feedback_from, feedback_for, feedback_type, complaint_status, message, related_order)
    VALUES (%s, %s, %s, %s, %s, %s)
    """

def get_all_feedback():
    return "SELECT * FROM feedback"

def get_feedback_by_type():
    return "SELECT * FROM feedback WHERE feedback_type=%s"

def get_feedback_by_status():
    return "SELECT * FROM feedback WHERE complaint_status=%s"

def get_feedback_by_order():
    return "SELECT * FROM feedback WHERE related_order=%s"

def update_feedback_status():
    return "UPDATE feedback SET complaint_status=%s WHERE feedback_id=%s"


# ---------------- TABLES ----------------
def insert_table():
    return "INSERT INTO tables (table_number, seating_capacity, area, is_available) VALUES (%s, %s, %s, %s)"

def get_all_tables():
    return "SELECT * FROM tables"

def get_tables_by_number():
    return "SELECT * FROM tables WHERE table_number=%s"

def get_tables_by_capacity():
    return "SELECT * FROM tables WHERE seating_capacity=%s"

def get_tables_by_area():
    return "SELECT * FROM tables WHERE area=%s"

def get_available_tables():
    return "SELECT * FROM tables WHERE is_available=%s"

def update_table():
    return """
    UPDATE tables SET table_number=%s, seating_capacity=%s, area=%s, is_available=%s
    WHERE table_id=%s
    """

def delete_table():
    return "DELETE FROM tables WHERE table_id=%s"


# ---------------- REVIEWS ----------------
def insert_review():
    return "INSERT INTO reviews (message, amount_stars, item_reviewed, reviewed_by) VALUES (%s, %s, %s, %s)"

def get_all_reviews():
    return "SELECT * FROM reviews"

def get_reviews_by_stars():
    return "SELECT * FROM reviews WHERE amount_stars=%s"

def get_reviews_by_item():
    return "SELECT * FROM reviews WHERE item_reviewed=%s"

def get_reviews_by_user():
    return "SELECT * FROM reviews WHERE reviewed_by=%s"

def update_review():
    return "UPDATE reviews SET message=%s, amount_stars=%s WHERE review_id=%s"

def delete_review():
    return "DELETE FROM reviews WHERE review_id=%s"
