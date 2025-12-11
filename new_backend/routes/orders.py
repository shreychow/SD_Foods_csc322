# backend_modular/routes/orders.py - FIXED WITH DELIVERY DATE
from flask import Blueprint, request, jsonify
from db import get_db_connection
from datetime import datetime, timedelta
from decimal import Decimal

orders_bp = Blueprint('orders', __name__)


def serialize_order(order):
    """Convert order dict to JSON-serializable format"""
    serialized = {}
    for key, value in order.items():
        if isinstance(value, Decimal):
            serialized[key] = float(value)
        elif isinstance(value, timedelta):
            total_seconds = int(value.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            serialized[key] = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        elif isinstance(value, datetime):
            serialized[key] = value.isoformat()
        else:
            serialized[key] = value
    return serialized


@orders_bp.route('/', methods=['POST'])
def create_order():
    """Create new order - NO chef or driver assigned yet"""
    conn = None
    try:
        data = request.json

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        customer_id = data['customer_id']
        items = data['items']
        total_amount = data['total_amount']
        delivery_address = data['delivery_address']

        # Check customer info and apply VIP discount
        cursor.execute(
            "SELECT total_balance, vip_status FROM users WHERE user_id = %s",
            (customer_id,)
        )
        result = cursor.fetchone()

        if not result:
            cursor.close()
            conn.close()
            return jsonify({"error": "Customer not found"}), 404

        balance = float(result['total_balance'])
        is_vip = result['vip_status']
        
        # Apply VIP discount (5%)
        original_price = total_amount
        if is_vip:
            discount = total_amount * 0.05
            total_amount = total_amount - discount
        
        # Check if customer has sufficient balance
        if balance < total_amount:
            # Add warning for insufficient funds
            cursor.execute("""
                UPDATE users 
                SET amount_warnings = amount_warnings + 1 
                WHERE user_id = %s
            """, (customer_id,))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"error": "Insufficient balance. Warning added."}), 400

        # Default delivery for tomorrow
        delivery_date = (datetime.now() + timedelta(days=1)).date()
        delivery_time = datetime.now().time()

        # 🔴 CRITICAL: Leave prepared_by and delivered_by as NULL
        # Chef will accept and assign themselves
        # Manager will assign driver after bidding
        order_query = """
        INSERT INTO orders (
            customer_id,
            prepared_by,
            delivered_by,
            delivered_to,
            delivery_status,
            total_price,
            delivery_date,
            delivery_time
        )
        VALUES (%s, NULL, NULL, %s, 'Pending', %s, %s, %s)
        """

        cursor.execute(
            order_query,
            (customer_id, delivery_address, total_amount, delivery_date, delivery_time)
        )
        order_id = cursor.lastrowid

        # Add order items
        for item in items:
            item_query = """
            INSERT INTO order_items (order_id, item_id, quantity, item_price)
            VALUES (%s, %s, %s, %s)
            """
            cursor.execute(
                item_query,
                (order_id, item['dish_id'], item['quantity'], item['price'])
            )

        # Deduct from balance
        cursor.execute(
            "UPDATE users SET total_balance = total_balance - %s WHERE user_id = %s",
            (total_amount, customer_id)
        )

        # Create payment record
        try:
            payment_query = """
            INSERT INTO payment (order_id, payed_by, amount_paid, payment_successful)
            VALUES (%s, %s, %s, TRUE)
            """
            cursor.execute(payment_query, (order_id, customer_id, total_amount))
        except:
            # Payment table might not exist, skip
            pass

        # Create notification
        try:
            notif_query = """
            INSERT INTO notifications (notify_user, message, is_read)
            VALUES (%s, %s, FALSE)
            """
            cursor.execute(
                notif_query,
                (customer_id, f"Your order #{order_id} has been placed successfully!")
            )
        except:
            # Notifications table might not exist, skip
            pass

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
            conn.close()
        print("Error creating order:", e)
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400


@orders_bp.route('/history', methods=['GET'])
def get_order_history():
    """Get order history with chef and driver info"""
    try:
        customer_id = request.args.get('customer_id')

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        if customer_id:
            query = """
            SELECT 
                o.*,
                u.name as customer_name,
                chef.name as chef_name,
                driver.name as driver_name
            FROM orders o
            JOIN users u ON o.customer_id = u.user_id
            LEFT JOIN users chef ON o.prepared_by = chef.user_id
            LEFT JOIN users driver ON o.delivered_by = driver.user_id
            WHERE o.customer_id = %s
            ORDER BY o.created_at DESC
            """
            cursor.execute(query, (customer_id,))
        else:
            query = """
            SELECT 
                o.*,
                u.name as customer_name,
                chef.name as chef_name,
                driver.name as driver_name
            FROM orders o
            JOIN users u ON o.customer_id = u.user_id
            LEFT JOIN users chef ON o.prepared_by = chef.user_id
            LEFT JOIN users driver ON o.delivered_by = driver.user_id
            ORDER BY o.created_at DESC
            """
            cursor.execute(query)

        orders = cursor.fetchall()

        serialized_orders = []
        for order in orders:
            serialized_order = serialize_order(order)

            # Get items for this order
            cursor.execute("""
                SELECT oi.*, m.name, m.image_url
                FROM order_items oi
                JOIN menu_items m ON oi.item_id = m.item_id
                WHERE oi.order_id = %s
            """, (order['order_id'],))

            items = cursor.fetchall()
            serialized_items = [serialize_order(item) for item in items]
            serialized_order['items'] = serialized_items
            serialized_orders.append(serialized_order)

        cursor.close()
        conn.close()

        return jsonify(serialized_orders), 200

    except Exception as e:
        print("Error getting order history:", e)
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400


@orders_bp.route('/<int:order_id>/rating', methods=['POST'])
def rate_order(order_id):
    """Rate food and delivery separately, create feedback automatically"""
    try:
        data = request.json
        food_rating = data.get('food_rating', 0)
        delivery_rating = data.get('delivery_rating', 0)

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        # Get order details
        cursor.execute("""
            SELECT prepared_by, delivered_by, customer_id
            FROM orders
            WHERE order_id = %s
        """, (order_id,))
        
        order = cursor.fetchone()
        if not order:
            cursor.close()
            conn.close()
            return jsonify({"error": "Order not found"}), 404

        # Get order items for review
        cursor.execute("""
            SELECT item_id FROM order_items WHERE order_id = %s
        """, (order_id,))
        items = cursor.fetchall()

        # Create reviews for each item with food rating
        if food_rating > 0:
            for item in items:
                cursor.execute("""
                    INSERT INTO reviews (amount_stars, item_reviewed, reviewed_by)
                    VALUES (%s, %s, %s)
                """, (food_rating, item['item_id'], order['customer_id']))

        # Create feedback for chef (food rating)
        if order['prepared_by'] and food_rating > 0:
            feedback_type = 'compliment' if food_rating >= 4 else 'complaint'
            cursor.execute("""
                INSERT INTO feedback (
                    feedback_from, 
                    feedback_for, 
                    feedback_type, 
                    message,
                    complaint_status,
                    related_order
                )
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                order['customer_id'],
                order['prepared_by'],
                feedback_type,
                f"Food quality rated {food_rating}/5 stars",
                'Open' if feedback_type == 'complaint' else 'N/A',
                order_id
            ))

        # Create feedback for driver (delivery rating)
        if order['delivered_by'] and delivery_rating > 0:
            feedback_type = 'compliment' if delivery_rating >= 4 else 'complaint'
            cursor.execute("""
                INSERT INTO feedback (
                    feedback_from, 
                    feedback_for, 
                    feedback_type, 
                    message,
                    complaint_status,
                    related_order
                )
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                order['customer_id'],
                order['delivered_by'],
                feedback_type,
                f"Delivery service rated {delivery_rating}/5 stars",
                'Open' if feedback_type == 'complaint' else 'N/A',
                order_id
            ))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Rating submitted successfully"}), 200
        
    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        print("Error rating order:", e)
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400