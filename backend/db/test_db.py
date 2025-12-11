from db import get_db_connection

conn = get_db_connection()

if conn:
    print("✅ Connected to MySQL successfully!")
else:
    print("❌ Failed to connect.")
