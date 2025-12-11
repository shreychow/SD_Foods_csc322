from flask import Blueprint, request, jsonify
from db import get_db_connection

delivery_bp = Blueprint('delivery', __name__)


@delivery_bp.route('/orders', methods=['GET'])
def get_delivery_orders():
    """Get orders for delivery dashboard"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT o.*, u.name as customer, u.phone
        FROM orders o
        JOIN users u ON o.customer_id = u.user_id
        WHERE o.delivery_status IN ('Ready for Delivery', 'Out for Delivery')
        ORDER BY o.created_at ASC
        """
        cursor.execute(query)
        orders = cursor.fetchall()
        
        for order in orders:
            order['address'] = order['delivered_to']
            order['total'] = float(order['total_price'])
            order['status'] = 'ready' if order['delivery_status'] == 'Ready for Delivery' else 'delivering'
        
        cursor.close()
        conn.close()
        
        return jsonify(orders), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@delivery_bp.route('/orders/<int:order_id>/pickup', methods=['POST'])
def pickup_order(order_id):
    """Delivery person picks up order"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE orders SET delivery_status = 'Out for Delivery' WHERE order_id = %s",
            (order_id,)
        )
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Order picked up"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@delivery_bp.route('/orders/<int:order_id>/deliver', methods=['POST'])
def deliver_order(order_id):
    """Delivery person delivers order"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE orders SET delivery_status = 'Delivered' WHERE order_id = %s",
            (order_id,)
        )
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Order delivered"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400