import mysql.connector
from config import DB_CONFIG

def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host=DB_CONFIG["host"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            database=DB_CONFIG["database"]
        )
        return conn

    except mysql.connector.Error as e:
        print("❌ Database connection error:", e)
        return None
