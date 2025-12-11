from db.db import get_db_connection

def get_employees():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM employees")
    result = cursor.fetchall()
    cursor.close()
    conn.close()
    return result


def update_employee_status(employee_id, status):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE employees SET employment_status=%s WHERE employee_id=%s",
        (status, employee_id)
    )
    conn.commit()
    cursor.close()
    conn.close()


def update_salary(employee_id, amount):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE employees SET salary=%s WHERE employee_id=%s",
        (amount, employee_id)
    )
    conn.commit()
    cursor.close()
    conn.close()
