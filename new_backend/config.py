# Database Configuration
# Update these values with your MySQL database credentials

DB_CONFIG = {
    "host": "localhost",        # MySQL server host (usually localhost)
    "user": "root",             # MySQL username
    "password": "Sanskriti55#",  # MySQL password
    "database": "restaurant_database"  # Database name from your schema
}

# Flask Configuration
FLASK_CONFIG = {
    "SECRET_KEY": "your-secret-key-here-change-in-production",
    "DEBUG": True,
    "HOST": "0.0.0.0",
    "PORT": 5000
}

# CORS Configuration (for React frontend)
CORS_CONFIG = {
    "origins": ["http://localhost:3000", "http://localhost:5173"],  # React dev server
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}