from db.db import get_db_connection

# -------------------------
# Create customer (REGISTER)
# -------------------------
def create_customer(username, password_hash, name, email, phone, home_address):
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        INSERT INTO customers (username, password_hash, name, email, phone, home_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    cursor.execute(query, (username, password_hash, name, email, phone, home_address))
    conn.commit()

    cursor.close()
    conn.close()
    return True


# -------------------------
# Login helper
# -------------------------
def get_customer_by_username(username):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM customers WHERE username=%s", (username,))
    user = cursor.fetchone()

    cursor.close()
    conn.close()
    return user


def get_customer_by_id(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM customers WHERE customer_id=%s", (customer_id,))
    user = cursor.fetchone()

    cursor.close()
    conn.close()
    return user


# -------------------------
# Update basic profile
# -------------------------
def update_customer_profile(customer_id, name, phone, home_address):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE customers
        SET name=%s, phone=%s, home_address=%s
        WHERE customer_id=%s
    """, (name, phone, home_address, customer_id))

    conn.commit()
    cursor.close()
    conn.close()
    return True


# -------------------------
# Warnings + VIP logic
# -------------------------
def apply_customer_warning(complaint_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT against_id FROM complaints
        WHERE complaint_id=%s AND target_type='customer'
    """, (complaint_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return None, None

    customer_id = row[0]

    cursor.execute("UPDATE customers SET warnings = warnings + 1 WHERE customer_id=%s",
                   (customer_id,))
    conn.commit()

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


def get_warnings(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT warnings FROM customers WHERE customer_id=%s", (customer_id,))
    row = cursor.fetchone()

    cursor.close()
    conn.close()
    return row["warnings"] if row else 0


def get_customer_balance(customer_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT balance FROM customers WHERE customer_id=%s", (customer_id,))
    row = cursor.fetchone()

    cursor.close()
    conn.close()
    return row["balance"] if row else 0
