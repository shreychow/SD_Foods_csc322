from flask import Flask
from flask_cors import CORS
from config import FLASK_CONFIG, CORS_CONFIG

# Import blueprints
from routes.auth import auth_bp
from routes.users import users_bp
from routes.menu import menu_bp
from routes.orders import orders_bp
from routes.reservations import reservations_bp
from routes.feedback import feedback_bp
from routes.chat import chat_bp
from routes.chef import chef_bp
from routes.delivery import delivery_bp
from routes.manager import manager_bp

def create_app():
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = FLASK_CONFIG['SECRET_KEY']
    app.config['DEBUG'] = FLASK_CONFIG['DEBUG']
    
    # Enable CORS
    CORS(app, origins=CORS_CONFIG['origins'])
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(menu_bp, url_prefix='/api/menu')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')
    app.register_blueprint(reservations_bp, url_prefix='/api/reservations')
    app.register_blueprint(feedback_bp, url_prefix='/api/feedback')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(chef_bp, url_prefix='/api/chef')
    app.register_blueprint(delivery_bp, url_prefix='/api/delivery')
    app.register_blueprint(manager_bp, url_prefix='/api/manager')
    
    # Health check route
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        from db import get_db_connection
        try:
            conn = get_db_connection()
            if conn:
                conn.close()
                return {"status": "healthy", "database": "connected"}, 200
            else:
                return {"status": "unhealthy", "database": "disconnected"}, 500
        except Exception as e:
            return {"status": "error", "error": str(e)}, 500
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {"error": "Endpoint not found"}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return {"error": "Internal server error"}, 500
    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(
        debug=FLASK_CONFIG['DEBUG'],
        host=FLASK_CONFIG['HOST'],
        port=FLASK_CONFIG['PORT']
    )
    