from flask import Blueprint, request, jsonify
from db import get_db_connection
from utils.auth_helpers import hash_password, verify_password

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # hash the password before storing
        hashed = hash_password(data['password'])
        
        cursor.execute("""
            INSERT INTO users (username, password_hash, name, email, phone, home_address, 
                              role, total_balance, amount_warnings, vip_status, is_blacklisted)
            VALUES (%s, %s, %s, %s, %s, %s, 'customer', 0, 0, FALSE, FALSE)
        """, (
            data['username'],
            hashed,
            data['name'],
            data['email'],
            data.get('phone', ''),
            data['home_address']
        ))
        
        conn.commit()
        user_id = cursor.lastrowid
        cursor.close()
        conn.close()
        
        return jsonify({"message": "User registered successfully", "user_id": user_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # check user exists
        cursor.execute("SELECT * FROM users WHERE username = %s", (data['username'],))
        user = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        # validate user login info
        if not user or not verify_password(data['password'], user['password_hash']):
            return jsonify({"error": "Invalid credentials"}), 401
        
        # check blacklist staus
        if user['is_blacklisted']:
            return jsonify({"error": "Account has been suspended"}), 403
        
        # add JWT tokens 
        return jsonify({
            "customer_id": user['user_id'],
            "id": user['user_id'],
            "username": user['username'],
            "name": user['name'],
            "email": user['email'],
            "phone": user['phone'],
            "home_address": user['home_address'],
            "role": user['role'],
            "balance": float(user['total_balance']),
            "warnings": user['amount_warnings'],
            "vip_status": user['vip_status']
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400
