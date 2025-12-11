from flask import Blueprint, request, jsonify
from db import get_db_connection

wallet_bp = Blueprint('wallet', __name__)

@wallet_bp.route('/deposit', methods=['POST'])
def deposit_funds():
    try:
        data = request.json
        customer_id = data.get("customer_id")
        amount = float(data.get("amount", 0))

        if not customer_id or amount <= 0:
            return jsonify({"error": "Invalid deposit request"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Update database balance
        cursor.execute("""
            UPDATE users
            SET total_balance = total_balance + %s
            WHERE user_id = %s
        """, (amount, customer_id))

        conn.commit()

        # Return new balance
        cursor.execute("SELECT total_balance FROM users WHERE user_id = %s", (customer_id,))
        new_balance = float(cursor.fetchone()[0])

        cursor.close()
        conn.close()

        return jsonify({"balance": new_balance}), 200

    except Exception as e:
        print("Wallet deposit error:", e)
        return jsonify({"error": "Deposit failed"}), 500
