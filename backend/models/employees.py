from db.db import get_db_connection

# Increase complaint count + auto demote if needed
def apply_employee_warning(complaint_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Find who the complaint was against (chef or delivery person)
    cursor.execute("""
        SELECT against_id 
        FROM complaints 
        WHERE complaint_id=%s AND target_type IN ('chef','delivery')
    """, (complaint_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return None, None

    employee_id = row[0]

    # Add +1 complaint
    cursor.execute("""
        UPDATE employee 
        SET complaints = complaints + 1 
        WHERE employee_id = %s
    """, (employee_id,))
    conn.commit()

    # Check total complaints
    cursor.execute("""
        SELECT complaints, role 
        FROM employee 
        WHERE employee_id = %s
    """, (employee_id,))
    complaints, role = cursor.fetchone()

    # Auto-demote rule (except manager)
    if complaints >= 3 and role != 'manager':
        cursor.execute("""
            UPDATE employee 
            SET role = 'demoted' 
            WHERE employee_id = %s
        """, (employee_id,))
        conn.commit()

    conn.close()
    return complaints, role
