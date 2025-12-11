from db.db import get_db_connection
from db.db import get_db_connection

def file_complaint(filer_id, against_id, target_type, complaint_text):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO complaints (filer_customer_id, against_id, target_type, complaint_text)
        VALUES (%s, %s, %s, %s)
    """, (filer_id, against_id, target_type, complaint_text))
    conn.commit()
    complaint_id = cursor.lastrowid
    conn.close()
    return complaint_id


def review_complaint(complaint_id, action):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE complaints SET status=%s WHERE complaint_id=%s",
                   (action, complaint_id))
    conn.commit()
    conn.close()


def get_complaints():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM complaints ORDER BY complaint_id DESC")
    result = cursor.fetchall()
    conn.close()
    return result
