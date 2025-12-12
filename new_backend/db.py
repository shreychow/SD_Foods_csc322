import mysql.connector
from config import DB_CONFIG

def get_db_connection():
    """
    Create and return a MySQL database connection
    """
    try:
        conn = mysql.connector.connect(
            host=DB_CONFIG["host"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            database=DB_CONFIG["database"],
            autocommit=False  # Disable autocommit for transaction control
        )
        return conn
    except mysql.connector.Error as e:
        print(f"Database connection error: {e}")
        return None


def test_connection():
    """
    Test the database connection
    """
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            print("Database connection successful!")
            return True
        except Exception as e:
            print(f"Database test failed: {e}")
            return False
    else:
        print("Failed to establish database connection")
        return False


if __name__ == "__main__":
    test_connection()
