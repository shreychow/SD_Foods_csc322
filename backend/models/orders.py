from db.db import get_db_connection

# -----------------------------------------
# CREATE ORDER
# -----------------------------------------
def create_order(customer_id, dish_id, quantity, total_price, status="pending"):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        INSERT INTO orders (customer_id, dish_id, quantity, total_price, status)
        VALUES (%s, %s, %s, %s, %s)
    """
    cursor.execute(query, (customer_id, dish_id, quantity, total_price, status))

    conn.commit()
    cursor.close()
    conn.close()


# -----------------------------------------
# FETCH ALL ORDERS FOR CUSTOMER
# -----------------------------------------
def get_orders_by_customer(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = "SELECT * FROM orders WHERE customer_id = %s"
    cursor.execute(query, (customer_id,))

    orders = cursor.fetchall()

    cursor.close()
    conn.close()
    return orders


# -----------------------------------------
# GET SINGLE ORDER
# -----------------------------------------
def get_order(order_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = "SELECT * FROM orders WHERE order_id = %s"
    cursor.execute(query, (order_id,))

    order = cursor.fetchone()

    cursor.close()
    conn.close()
    return order


# -----------------------------------------
# UPDATE ORDER STATUS (manager/delivery)
# -----------------------------------------
def update_order_status(order_id, new_status):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = "UPDATE orders SET status = %s WHERE order_id = %s"
    cursor.execute(query, (new_status, order_id))

    conn.commit()
    cursor.close()
    conn.close()
