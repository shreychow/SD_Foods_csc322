from db.db import get_db_connection

def get_all_delivery_people():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM delivery_people")
    rows = cursor.fetchall()
    conn.close()
    return rows


def get_delivery_person_by_id(delivery_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM delivery_people WHERE delivery_id = %s", (delivery_id,))
    row = cursor.fetchone()
    conn.close()
    return row


def update_delivery_person_status(delivery_id, status):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE delivery_people SET status = %s WHERE delivery_id = %s", (status, delivery_id))
    conn.commit()
    conn.close()


def get_delivery_person_ratings(delivery_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT AVG(rating) AS avg_rating
        FROM delivery_ratings
        WHERE delivery_id = %s
    """, (delivery_id,))
    row = cursor.fetchone()
    conn.close()
    return row
