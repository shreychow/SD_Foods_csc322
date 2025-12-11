# backend_modular/routes/chef.py - COMPLETE VERSION
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

        # Show pending and preparing orders
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
            order['items'] = items

        cursor.close()
        conn.close()

        return jsonify(orders), 200

    except Exception as e:
        print(f"Get chef orders error: {e}")
        return jsonify({"error": str(e)}), 400


@chef_bp.route('/orders/<int:order_id>/accept', methods=['POST'])
def accept_order(order_id):
    """Chef accepts order and assigns themselves"""
    try:
        data = request.json or {}
        chef_id = data.get('chef_id')
        
        if not chef_id:
            return jsonify({"error": "chef_id required"}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()
        
        # Update status AND assign chef
        cursor.execute("""
            UPDATE orders 
            SET delivery_status = 'Preparing',
                prepared_by = %s
            WHERE order_id = %s
        """, (chef_id, order_id))
        
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Order accepted"}), 200

    except Exception as e:
        print(f"Accept order error: {e}")
        return jsonify({"error": str(e)}), 400


@chef_bp.route('/orders/<int:order_id>/complete', methods=['POST'])
def complete_order(order_id):
    """Chef completes order - DOES NOT touch delivered_by"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()
        
        # Only change status, leave delivered_by as NULL for bidding
        cursor.execute(
            "UPDATE orders SET delivery_status = 'Ready for Delivery' WHERE order_id = %s",
            (order_id,)
        )
        
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Order completed"}), 200

    except Exception as e:
        print(f"Complete order error: {e}")
        return jsonify({"error": str(e)}), 400


@chef_bp.route('/orders/<int:order_id>/reject', methods=['POST'])
def reject_order(order_id):
    """Chef rejects order and refunds customer"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()

        # Mark as cancelled
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
        print(f"Reject order error: {e}")
        return jsonify({"error": str(e)}), 400


@chef_bp.route('/profile/<int:chef_id>', methods=['GET'])
def get_chef_profile(chef_id):
    """Get chef profile stats"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)
        
        # Get chef info
        cursor.execute("""
            SELECT name, salary, amount_warnings
            FROM users
            WHERE user_id = %s
        """, (chef_id,))
        
        chef = cursor.fetchone()
        if not chef:
            cursor.close()
            conn.close()
            return jsonify({"error": "Chef not found"}), 404
        
        # Get total dishes prepared
        cursor.execute("""
            SELECT COUNT(*) as dishes_prepared
            FROM orders
            WHERE prepared_by = %s AND delivery_status IN ('Ready for Delivery', 'Out for Delivery', 'Delivered')
        """, (chef_id,))
        dishes_row = cursor.fetchone()
        
        # Get complaints count
        cursor.execute("""
            SELECT COUNT(*) as complaints
            FROM feedback
            WHERE feedback_for = %s AND feedback_type = 'complaint'
        """, (chef_id,))
        complaints_row = cursor.fetchone()
        
        # Get compliments count
        cursor.execute("""
            SELECT COUNT(*) as compliments
            FROM feedback
            WHERE feedback_for = %s AND feedback_type = 'compliment'
        """, (chef_id,))
        compliments_row = cursor.fetchone()
        
        # Get average rating from reviews
        cursor.execute("""
            SELECT AVG(r.amount_stars) as avg_rating
            FROM reviews r
            JOIN order_items oi ON r.item_reviewed = oi.item_id
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.prepared_by = %s AND r.amount_stars > 0
        """, (chef_id,))
        rating_row = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "name": chef['name'],
            "salary": float(chef['salary']),
            "warnings": chef['amount_warnings'],
            "dishes_prepared": dishes_row['dishes_prepared'] if dishes_row else 0,
            "complaints": complaints_row['complaints'] if complaints_row else 0,
            "compliments": compliments_row['compliments'] if compliments_row else 0,
            "avg_rating": round(float(rating_row['avg_rating'] or 0), 1) if rating_row else 0
        }), 200

    except Exception as e:
        print(f"Get chef profile error: {e}")
        return jsonify({"error": str(e)}), 400