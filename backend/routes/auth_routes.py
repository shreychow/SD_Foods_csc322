from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models.customers import create_customer, get_customer_by_username

auth_bp = Blueprint('auth', __name__)

# -------------------------
# REGISTER
# -------------------------
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    username = data.get("username")
    password = data.get("password")
    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    home_address = data.get("home_address")

    # Check if user exists already
    existing = get_customer_by_username(username)
    if existing:
        return jsonify({"error": "Username already taken"}), 400

    password_hash = generate_password_hash(password)

    create_customer(username, password_hash, name, email, phone, home_address)

    return jsonify({"message": "Registration successful"}), 201


# -------------------------
# LOGIN
# -------------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    username = data.get("username")
    password = data.get("password")

    user = get_customer_by_username(username)

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid username or password"}), 401

    return jsonify({"message": "Login successful", "user_id": user["customer_id"]})
