from flask import Blueprint, request, jsonify
from db import get_db_connection

users_bp = Blueprint('users', __name__)


@users_bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get user by ID"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM users WHERE user_id = %s"
        cursor.execute(query, (user_id,))
        user = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({
            "user_id": user['user_id'],
            "username": user['username'],
            "name": user['name'],
            "email": user['email'],
            "phone": user['phone'],
            "home_address": user['home_address'],
            "role": user['role'],
            "balance": float(user['total_balance']),
            "warnings": user['amount_warnings'],
            "vip_status": user['vip_status'],
            "is_blacklisted": user['is_blacklisted']
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@users_bp.route('/<int:user_id>/balance', methods=['PUT'])
def update_balance(user_id):
    """Update user balance"""
    try:
        data = request.json
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        if data.get('action') == 'add':
            query = "UPDATE users SET total_balance = total_balance + %s WHERE user_id = %s"
        elif data.get('action') == 'subtract':
            query = "UPDATE users SET total_balance = total_balance - %s WHERE user_id = %s"
        else:
            return jsonify({"error": "Invalid action"}), 400
        
        cursor.execute(query, (data['amount'], user_id))
        conn.commit()
        
        # Get updated balance
        cursor.execute("SELECT total_balance FROM users WHERE user_id = %s", (user_id,))
        result = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "message": "Balance updated",
            "new_balance": float(result[0])
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400