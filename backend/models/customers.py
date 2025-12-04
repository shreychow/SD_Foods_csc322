from db.db import get_db_connection

def get_customer_by_id(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM customers WHERE customer_id = %s", (customer_id,))
    user = cursor.fetchone()

    cursor.close()
    conn.close()
    return user


def update_customer_profile(customer_id, name, phone, home_address):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        UPDATE customers
        SET name=%s, phone=%s, home_address=%s
        WHERE customer_id=%s
    """
    cursor.execute(query, (name, phone, home_address, customer_id))
    conn.commit()

    cursor.close()
    conn.close()
    return True


def get_warnings(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT warnings FROM customers WHERE customer_id=%s", (customer_id,))
    result = cursor.fetchone()

    cursor.close()
    conn.close()
    return result["warnings"] if result else 0


def get_customer_balance(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT balance FROM customers WHERE customer_id=%s", (customer_id,))
    result = cursor.fetchone()

    cursor.close()
    conn.close()
    return result["balance"] if result else 0

def apply_customer_warning(complaint_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT against_id FROM complaints WHERE complaint_id=%s AND target_type='customer'
    """, (complaint_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None, None

    customer_id = row[0]
    cursor.execute("UPDATE customers SET warnings = warnings + 1 WHERE customer_id=%s",
                   (customer_id,))
    conn.commit()

    # Auto deregister or downgrade VIP
    cursor.execute("SELECT warnings, is_vip FROM customers WHERE customer_id=%s",
                   (customer_id,))
    warnings, is_vip = cursor.fetchone()

    if warnings >= 3:
        cursor.execute("UPDATE customers SET active=0 WHERE customer_id=%s", (customer_id,))
    elif is_vip == 1 and warnings >= 2:
        cursor.execute("UPDATE customers SET is_vip=0 WHERE customer_id=%s", (customer_id,))

    conn.commit()
    conn.close()

    return "customer", customer_id
