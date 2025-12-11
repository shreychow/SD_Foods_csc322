from flask import Blueprint, request, jsonify
from db import get_db_connection
from datetime import datetime, timedelta

orders_bp = Blueprint('orders', __name__)


@orders_bp.route('/', methods=['POST'])
def create_order():
    """Create new order"""
    try:
        data = request.json
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Check if customer has sufficient balance
        cursor.execute("SELECT total_balance FROM users WHERE user_id = %s", (data['customer_id'],))
        result = cursor.fetchone()
        
        if not result:
            return jsonify({"error": "Customer not found"}), 404
        
        balance = float(result[0])
        if balance < data['total_amount']:
            return jsonify({"error": "Insufficient balance"}), 400
        
        # Create order
        order_query = """
        INSERT INTO orders (customer_id, delivered_by, delivered_to, delivery_status, 
                           total_price, delivery_date, delivery_time)
        VALUES (%s, %s, %s, 'Pending', %s, %s, %s)
        """
        
        # Default delivery for tomorrow at noon
        delivery_date = (datetime.now() + timedelta(days=1)).date()
        delivery_time = datetime.now().time()
        
        # Find available delivery person (simplified - just get first driver)
        cursor.execute("SELECT user_id FROM users WHERE role = 'driver' LIMIT 1")
        driver_result = cursor.fetchone()
        driver_id = driver_result[0] if driver_result else data['customer_id']
        
        cursor.execute(order_query, (
            data['customer_id'],
            driver_id,
            data['delivery_address'],
            data['total_amount'],
            delivery_date,
            delivery_time
        ))
        
        order_id = cursor.lastrowid
        
        # Add order items
        for item in data['items']:
            item_query = """
            INSERT INTO order_items (order_id, item_id, quantity, item_price)
            VALUES (%s, %s, %s, %s)
            """
            cursor.execute(item_query, (
                order_id,
                item['dish_id'],
                item['quantity'],
                item['price']
            ))
        
        # Deduct from balance
        cursor.execute(
            "UPDATE users SET total_balance = total_balance - %s WHERE user_id = %s",
            (data['total_amount'], data['customer_id'])
        )
        
        # Create payment record
        payment_query = """
        INSERT INTO payment (order_id, payed_by, amount_paid, payment_successful)
        VALUES (%s, %s, %s, TRUE)
        """
        cursor.execute(payment_query, (order_id, data['customer_id'], data['total_amount']))
        
        # Create notification
        notif_query = """
        INSERT INTO notifications (notify_user, message, is_read)
        VALUES (%s, %s, FALSE)
        """
        cursor.execute(notif_query, (
            data['customer_id'],
            f"Your order #{order_id} has been placed successfully!"
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            "message": "Order created successfully",
            "order_id": order_id
        }), 201
        
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 400


@orders_bp.route('/history', methods=['GET'])
def get_order_history():
    """Get order history (can be filtered by customer_id)"""
    try:
        customer_id = request.args.get('customer_id')
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        if customer_id:
            query = """
            SELECT o.*, u.name as customer_name
            FROM orders o
            JOIN users u ON o.customer_id = u.user_id
            WHERE o.customer_id = %s
            ORDER BY o.created_at DESC
            """
            cursor.execute(query, (customer_id,))
        else:
            query = """
            SELECT o.*, u.name as customer_name
            FROM orders o
            JOIN users u ON o.customer_id = u.user_id
            ORDER BY o.created_at DESC
            """
            cursor.execute(query)
        
        orders = cursor.fetchall()
        
        # Get items for each order
        for order in orders:
            cursor.execute("""
                SELECT oi.*, m.name, m.image_url
                FROM order_items oi
                JOIN menu_items m ON oi.item_id = m.item_id
                WHERE oi.order_id = %s
            """, (order['order_id'],))
            
            items = cursor.fetchall()
            
            # Convert Decimal to float
            for item in items:
                item['item_price'] = float(item['item_price'])
            
            order['items'] = items
            order['total_price'] = float(order['total_price'])
            
            # ✅ Convert time fields to string
            if order.get('delivery_time'):
                order['delivery_time'] = str(order['delivery_time'])
            if order.get('delivery_date'):
                order['delivery_date'] = str(order['delivery_date'])
        
        cursor.close()
        conn.close()
        
        return jsonify(orders), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@orders_bp.route('/<int:order_id>/rating', methods=['POST'])
def rate_order(order_id):
    """Rate an order"""
    try:
        data = request.json
        # In a real system, you'd store ratings in a separate table
        # For now, just return success
        return jsonify({"message": "Rating submitted successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400