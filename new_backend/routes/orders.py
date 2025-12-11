# # orders.py
# from flask import Blueprint, request, jsonify
# from db import get_db_connection
# from datetime import datetime, timedelta
# from decimal import Decimal

# orders_bp = Blueprint('orders', __name__)


# def serialize_order(order):
#     """Convert order dict to JSON-serializable format"""
#     serialized = {}
#     for key, value in order.items():
#         if isinstance(value, Decimal):
#             serialized[key] = float(value)
#         elif isinstance(value, timedelta):
#             # Convert timedelta to string (HH:MM:SS)
#             total_seconds = int(value.total_seconds())
#             hours = total_seconds // 3600
#             minutes = (total_seconds % 3600) // 60
#             seconds = total_seconds % 60
#             serialized[key] = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
#         elif isinstance(value, (datetime)):
#             serialized[key] = value.isoformat()
#         else:
#             serialized[key] = value
#     return serialized


# @orders_bp.route('/', methods=['POST'])
# def create_order():
#     """Create new order"""
#     conn = None
#     try:
#         data = request.json

#         conn = get_db_connection()
#         if not conn:
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor()

#         customer_id = data['customer_id']
#         items = data['items']
#         total_amount = data['total_amount']
#         delivery_address = data['delivery_address']

#         # Check if customer has sufficient balance
#         cursor.execute(
#             "SELECT total_balance FROM users WHERE user_id = %s",
#             (customer_id,)
#         )
#         result = cursor.fetchone()

#         if not result:
#             return jsonify({"error": "Customer not found"}), 404

#         balance = float(result[0])
#         if balance < total_amount:
#             return jsonify({"error": "Insufficient balance"}), 400

#         # Default delivery for tomorrow
#         delivery_date = (datetime.now() + timedelta(days=1)).date()
#         delivery_time = datetime.now().time()

#         # Find available delivery person (simplified - just get first driver)
#         cursor.execute("SELECT user_id FROM users WHERE role = 'driver' LIMIT 1")
#         driver_result = cursor.fetchone()
#         driver_id = driver_result[0] if driver_result else customer_id

#         # Create order
#         order_query = """
#         INSERT INTO orders (
#             customer_id,
#             delivered_by,
#             delivered_to,
#             delivery_status,
#             total_price,
#             delivery_date,
#             delivery_time
#         )
#         VALUES (%s, %s, %s, 'Pending', %s, %s, %s)
#         """

#         cursor.execute(
#             order_query,
#             (customer_id, driver_id, delivery_address, total_amount,
#              delivery_date, delivery_time)
#         )

#         order_id = cursor.lastrowid

#         # Add order items
#         for item in items:
#             item_query = """
#             INSERT INTO order_items (order_id, item_id, quantity, item_price)
#             VALUES (%s, %s, %s, %s)
#             """
#             cursor.execute(
#                 item_query,
#                 (order_id, item['dish_id'], item['quantity'], item['price'])
#             )

#         # Deduct from balance
#         cursor.execute(
#             "UPDATE users SET total_balance = total_balance - %s WHERE user_id = %s",
#             (total_amount, customer_id)
#         )

#         # Create payment record
#         payment_query = """
#         INSERT INTO payment (order_id, payed_by, amount_paid, payment_successful)
#         VALUES (%s, %s, %s, TRUE)
#         """
#         cursor.execute(payment_query, (order_id, customer_id, total_amount))

#         # Create notification
#         notif_query = """
#         INSERT INTO notifications (notify_user, message, is_read)
#         VALUES (%s, %s, FALSE)
#         """
#         cursor.execute(
#             notif_query,
#             (customer_id, f"Your order #{order_id} has been placed successfully!")
#         )

#         conn.commit()
#         cursor.close()
#         conn.close()

#         return jsonify({
#             "message": "Order created successfully",
#             "order_id": order_id
#         }), 201

#     except Exception as e:
#         if conn:
#             conn.rollback()
#             conn.close()
#         print("Error creating order:", e)
#         return jsonify({"error": str(e)}), 400


# @orders_bp.route('/history', methods=['GET'])
# def get_order_history():
#     """Get order history (can be filtered by customer_id)"""
#     try:
#         customer_id = request.args.get('customer_id')

#         conn = get_db_connection()
#         if not conn:
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor(dictionary=True)

#         if customer_id:
#             query = """
#             SELECT o.*, u.name as customer_name
#             FROM orders o
#             JOIN users u ON o.customer_id = u.user_id
#             WHERE o.customer_id = %s
#             ORDER BY o.created_at DESC
#             """
#             cursor.execute(query, (customer_id,))
#         else:
#             query = """
#             SELECT o.*, u.name as customer_name
#             FROM orders o
#             JOIN users u ON o.customer_id = u.user_id
#             ORDER BY o.created_at DESC
#             """
#             cursor.execute(query)

#         orders = cursor.fetchall()

#         # Serialize each order
#         serialized_orders = []
#         for order in orders:
#             # Serialize the order itself
#             serialized_order = serialize_order(order)
            
#             # Get items for this order
#             cursor.execute("""
#                 SELECT oi.*, m.name, m.image_url
#                 FROM order_items oi
#                 JOIN menu_items m ON oi.item_id = m.item_id
#                 WHERE oi.order_id = %s
#             """, (order['order_id'],))

#             items = cursor.fetchall()

#             # Serialize each item
#             serialized_items = []
#             for item in items:
#                 serialized_item = serialize_order(item)
#                 serialized_items.append(serialized_item)

#             serialized_order['items'] = serialized_items
#             serialized_orders.append(serialized_order)

#         cursor.close()
#         conn.close()

#         return jsonify(serialized_orders), 200

#     except Exception as e:
#         print("Error getting order history:", e)
#         import traceback
#         traceback.print_exc()
#         return jsonify({"error": str(e)}), 400


# @orders_bp.route('/<int:order_id>/rating', methods=['POST'])
# def rate_order(order_id):
#     """Rate an order (currently just accepts the payload)."""
#     try:
#         data = request.json
#         print(f"Rating for order {order_id}:", data)
#         # You can store ratings later if you add a ratings table
#         return jsonify({"message": "Rating submitted successfully"}), 200
#     except Exception as e:
#         print("Error rating order:", e)
#         return jsonify({"error": str(e)}), 400

# orders.py
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
        elif isinstance(value, (datetime)):
            serialized[key] = value.isoformat()
        else:
            serialized[key] = value
    return serialized


@orders_bp.route('/', methods=['POST'])
def create_order():
    """Create new order with chef assignment"""
    conn = None
    try:
        data = request.json

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()

        customer_id = data['customer_id']
        items = data['items']
        total_amount = data['total_amount']
        delivery_address = data['delivery_address']

        # Check if customer has sufficient balance
        cursor.execute(
            "SELECT total_balance FROM users WHERE user_id = %s",
            (customer_id,)
        )
        result = cursor.fetchone()

        if not result:
            return jsonify({"error": "Customer not found"}), 404

        balance = float(result[0])
        if balance < total_amount:
            return jsonify({"error": "Insufficient balance"}), 400

        # Default delivery for tomorrow
        delivery_date = (datetime.now() + timedelta(days=1)).date()
        delivery_time = datetime.now().time()

        # Find available chef (randomly assign)
        cursor.execute("SELECT user_id FROM users WHERE role = 'chef' ORDER BY RAND() LIMIT 1")
        chef_result = cursor.fetchone()
        chef_id = chef_result[0] if chef_result else None

        # Find available delivery person
        cursor.execute("SELECT user_id FROM users WHERE role = 'driver' ORDER BY RAND() LIMIT 1")
        driver_result = cursor.fetchone()
        driver_id = driver_result[0] if driver_result else customer_id

        # Create order WITH chef assignment
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
        VALUES (%s, %s, %s, %s, 'Pending', %s, %s, %s)
        """

        cursor.execute(
            order_query,
            (customer_id, chef_id, driver_id, delivery_address, total_amount,
             delivery_date, delivery_time)
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
        payment_query = """
        INSERT INTO payment (order_id, payed_by, amount_paid, payment_successful)
        VALUES (%s, %s, %s, TRUE)
        """
        cursor.execute(payment_query, (order_id, customer_id, total_amount))

        # Create notification
        notif_query = """
        INSERT INTO notifications (notify_user, message, is_read)
        VALUES (%s, %s, FALSE)
        """
        cursor.execute(
            notif_query,
            (customer_id, f"Your order #{order_id} has been placed successfully!")
        )

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

        # Serialize each order
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

            # Serialize each item
            serialized_items = []
            for item in items:
                serialized_item = serialize_order(item)
                serialized_items.append(serialized_item)

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
    """Rate an order"""
    try:
        data = request.json
        print(f"Rating for order {order_id}:", data)
        # Store ratings in database if you have a ratings table
        return jsonify({"message": "Rating submitted successfully"}), 200
    except Exception as e:
        print("Error rating order:", e)
        return jsonify({"error": str(e)}), 400