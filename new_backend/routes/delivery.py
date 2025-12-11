# backend_modular/routes/delivery.py - COMPLETE WITH BIDDING
from flask import Blueprint, request, jsonify
from db import get_db_connection

delivery_bp = Blueprint("delivery", __name__)


@delivery_bp.route("/orders/available", methods=["GET"])
def get_available_orders():
    """Get orders available for bidding (Ready for Delivery status, no driver assigned)"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        # Orders that are ready but have no driver yet
        query = """
        SELECT
            o.order_id,
            o.delivered_to,
            o.delivery_status,
            o.total_price,
            u.name AS customer_name,
            u.phone,
            o.created_at
        FROM orders o
        JOIN users u ON o.customer_id = u.user_id
        WHERE o.delivery_status = 'Ready for Delivery' 
          AND o.delivered_by IS NULL
        ORDER BY o.created_at ASC
        """
        cursor.execute(query)
        orders = cursor.fetchall() or []

        # Get existing bids for each order
        for order in orders:
            cursor.execute("""
                SELECT 
                    db.bid_id,
                    db.driver_id,
                    db.bid_amount,
                    db.bid_status,
                    u.name as driver_name
                FROM delivery_bids db
                JOIN users u ON db.driver_id = u.user_id
                WHERE db.order_id = %s
                ORDER BY db.bid_amount ASC
            """, (order['order_id'],))
            
            order['bids'] = cursor.fetchall() or []
            order['total_price'] = float(order['total_price'])

        cursor.close()
        conn.close()

        return jsonify(orders), 200

    except Exception as e:
        print(f"Get available orders error: {e}")
        return jsonify({"error": str(e)}), 400


@delivery_bp.route("/orders/<int:order_id>/bid", methods=["POST"])
def place_bid(order_id):
    """Driver places a bid on an order"""
    try:
        data = request.json or {}
        driver_id = data.get('driver_id')
        bid_amount = data.get('bid_amount')

        if not driver_id or not bid_amount:
            return jsonify({"error": "driver_id and bid_amount required"}), 400

        if float(bid_amount) < 0:
            return jsonify({"error": "Bid amount must be positive"}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()

        # Check if driver already bid on this order
        cursor.execute("""
            SELECT bid_id FROM delivery_bids 
            WHERE order_id = %s AND driver_id = %s
        """, (order_id, driver_id))
        
        existing_bid = cursor.fetchone()

        if existing_bid:
            # Update existing bid
            cursor.execute("""
                UPDATE delivery_bids 
                SET bid_amount = %s, bid_status = 'pending'
                WHERE order_id = %s AND driver_id = %s
            """, (bid_amount, order_id, driver_id))
        else:
            # Create new bid
            cursor.execute("""
                INSERT INTO delivery_bids (order_id, driver_id, bid_amount, bid_status)
                VALUES (%s, %s, %s, 'pending')
            """, (order_id, driver_id, bid_amount))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Bid placed successfully"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        print(f"Place bid error: {e}")
        return jsonify({"error": str(e)}), 400


@delivery_bp.route("/orders/assigned", methods=["GET"])
def get_assigned_orders():
    """Get orders assigned to a specific driver"""
    try:
        driver_id = request.args.get('driver_id')
        
        if not driver_id:
            return jsonify({"error": "driver_id required"}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        # Orders assigned to this driver
        query = """
        SELECT
            o.order_id,
            o.delivered_to,
            o.delivery_status,
            o.total_price,
            u.name AS customer_name,
            u.phone
        FROM orders o
        JOIN users u ON o.customer_id = u.user_id
        WHERE o.delivered_by = %s
          AND o.delivery_status IN ('Ready for Delivery', 'Out for Delivery')
        ORDER BY o.created_at ASC
        """
        cursor.execute(query, (driver_id,))
        orders = cursor.fetchall() or []

        for order in orders:
            order["total_price"] = float(order["total_price"])

        cursor.close()
        conn.close()

        return jsonify(orders), 200

    except Exception as e:
        print(f"Get assigned orders error: {e}")
        return jsonify({"error": str(e)}), 400


@delivery_bp.route("/orders/<int:order_id>/pickup", methods=["POST"])
def pickup_order(order_id):
    """Driver picks up assigned order"""
    try:
        data = request.json or {}
        driver_id = data.get('driver_id')
        
        if not driver_id:
            return jsonify({"error": "driver_id required"}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()
        
        # Verify order is assigned to this driver
        cursor.execute("""
            SELECT delivered_by FROM orders WHERE order_id = %s
        """, (order_id,))
        
        order = cursor.fetchone()
        if not order or order[0] != int(driver_id):
            cursor.close()
            conn.close()
            return jsonify({"error": "Order not assigned to you"}), 403

        # Update status
        cursor.execute("""
            UPDATE orders 
            SET delivery_status = 'Out for Delivery'
            WHERE order_id = %s
        """, (order_id,))
        
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Order picked up"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        print(f"Pickup order error: {e}")
        return jsonify({"error": str(e)}), 400


@delivery_bp.route("/orders/<int:order_id>/deliver", methods=["POST"])
def deliver_order(order_id):
    """Driver marks order as delivered"""
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
        print(f"Deliver order error: {e}")
        return jsonify({"error": str(e)}), 400


@delivery_bp.route("/profile/<int:driver_id>", methods=["GET"])
def get_driver_profile(driver_id):
    """Get driver profile stats"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)
        
        # Get driver info
        cursor.execute("""
            SELECT name, salary, amount_warnings
            FROM users
            WHERE user_id = %s
        """, (driver_id,))
        
        driver = cursor.fetchone()
        if not driver:
            cursor.close()
            conn.close()
            return jsonify({"error": "Driver not found"}), 404
        
        # Get total deliveries
        cursor.execute("""
            SELECT COUNT(*) as total_deliveries
            FROM orders
            WHERE delivered_by = %s AND delivery_status = 'Delivered'
        """, (driver_id,))
        deliveries_row = cursor.fetchone()
        
        # Get complaints count
        cursor.execute("""
            SELECT COUNT(*) as complaints
            FROM feedback
            WHERE feedback_for = %s AND feedback_type = 'complaint'
        """, (driver_id,))
        complaints_row = cursor.fetchone()
        
        # Get compliments count
        cursor.execute("""
            SELECT COUNT(*) as compliments
            FROM feedback
            WHERE feedback_for = %s AND feedback_type = 'compliment'
        """, (driver_id,))
        compliments_row = cursor.fetchone()

        # Get average delivery rating
        cursor.execute("""
            SELECT AVG(r.rating) as avg_rating
            FROM chat_ratings r
            JOIN chat_history ch ON r.chat_id = ch.chat_id
            WHERE ch.user_id = %s AND r.rating > 0
        """, (driver_id,))
        rating_row = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "name": driver['name'],
            "salary": float(driver['salary']),
            "warnings": driver['amount_warnings'],
            "total_deliveries": deliveries_row['total_deliveries'] if deliveries_row else 0,
            "complaints": complaints_row['complaints'] if complaints_row else 0,
            "compliments": compliments_row['compliments'] if compliments_row else 0,
            "avg_rating": round(float(rating_row['avg_rating'] or 0), 1) if rating_row else 0
        }), 200

    except Exception as e:
        print(f"Get driver profile error: {e}")
        return jsonify({"error": str(e)}), 400