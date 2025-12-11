
from flask import Blueprint, request, jsonify
from db import get_db_connection

chef_bp = Blueprint('chef', __name__)


@chef_bp.route('/orders', methods=['GET'])
def get_chef_orders():
    """Get orders for chef dashboard"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        # Also include 'Confirmed' so new orders show up
        query = """
        SELECT o.order_id,
               o.customer_id,
               o.delivery_status,
               o.total_price,
               o.created_at,
               o.delivered_to,
               u.name AS customer_name
        FROM orders o
        JOIN users u ON o.customer_id = u.user_id
        WHERE o.delivery_status IN ('Pending', 'Preparing', 'Confirmed')
        ORDER BY o.created_at ASC
        """
        cursor.execute(query)
        orders = cursor.fetchall()

        # Attach items to each order
        for order in orders:
            cursor.execute("""
                SELECT oi.quantity,
                       m.name
                FROM order_items oi
                JOIN menu_items m ON oi.item_id = m.item_id
                WHERE oi.order_id = %s
            """, (order['order_id'],))

            items = cursor.fetchall()
            # keep items as objects: {name, quantity}
            order['items'] = items

        cursor.close()
        conn.close()

        return jsonify(orders), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@chef_bp.route('/orders/<int:order_id>/accept', methods=['POST'])
def accept_order(order_id):
    """Chef accepts order"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()
        cursor.execute(
            "UPDATE orders SET delivery_status = 'Preparing' WHERE order_id = %s",
            (order_id,)
        )
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Order accepted"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@chef_bp.route('/orders/<int:order_id>/complete', methods=['POST'])
def complete_order(order_id):
    """Chef completes order"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()
        cursor.execute(
            "UPDATE orders SET delivery_status = 'Ready for Delivery' WHERE order_id = %s",
            (order_id,)
        )
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Order completed"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@chef_bp.route('/orders/<int:order_id>/reject', methods=['POST'])
def reject_order(order_id):
    """Chef rejects order"""
    try:
        data = request.json
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()

        # mark as cancelled
        cursor.execute(
            "UPDATE orders SET delivery_status = 'Cancelled' WHERE order_id = %s",
            (order_id,)
        )

        # Refund customer
        cursor.execute("""
            UPDATE users u
            JOIN orders o ON u.user_id = o.customer_id
            SET u.total_balance = u.total_balance + o.total_price
            WHERE o.order_id = %s
        """, (order_id,))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Order rejected and refunded"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 400
