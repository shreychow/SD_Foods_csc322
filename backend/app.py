from flask import Flask

#Import blueprints
from routes.auth_routes import auth_bp
from routes.dish_routes import dish_bp
from routes.order_routes import order_bp
from routes.customer_routes import customer_bp
from routes.delivery_routes import delivery_bp
from routes.manager_routes import manager_bp
from routes.complaint_routes import complaint_bp

app = Flask(__name__)

# Register blueprints (route groups)
app.register_blueprint(auth_bp)
app.register_blueprint(dish_bp)
app.register_blueprint(order_bp)
app.register_blueprint(customer_bp)
app.register_blueprint(delivery_bp)
app.register_blueprint(manager_bp)
app.register_blueprint(complaint_bp)

@app.route("/")
def home():
    return {"message": "Restaurant Backend Running!"}

if __name__ == "__main__":
    app.run(debug=True)

