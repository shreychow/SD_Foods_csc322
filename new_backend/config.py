# # Database Configuration
# # Update these values with your MySQL database credentials

# DB_CONFIG = {
#     "host": "localhost",        # MySQL server host (usually localhost)
#     "user": "root",             # MySQL username
#     "password": "",  # MySQL password
#     "database": "restaurant_database"  # Database name from your schema
# }

# # Flask Configuration
# FLASK_CONFIG = {
#     "SECRET_KEY": "your-secret-key-here-change-in-production",
#     "DEBUG": True,
#     "HOST": "0.0.0.0",
#     "PORT": 5000
# }

# # CORS Configuration (for React frontend)
# CORS_CONFIG = {
#     "origins": ["http://localhost:3000", "http://localhost:5173"],  # React dev server
#     "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
#     "allow_headers": ["Content-Type", "Authorization"]
# }

from dotenv import load_dotenv
import os

# Load .env file
load_dotenv()

# Database Configuration
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "restaurant_database")
}

# Flask Configuration
FLASK_CONFIG = {
    "SECRET_KEY": os.getenv("FLASK_SECRET_KEY", "default-secret-key"),
    "DEBUG": True,
    "HOST": "0.0.0.0",
    "PORT": 5000
}

# CORS Configuration
CORS_CONFIG = {
    "origins": ["http://localhost:3000", "http://localhost:5173"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}
