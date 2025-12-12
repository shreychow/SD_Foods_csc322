# backend_modular/routes/orders.py
from flask import Blueprint, request, jsonify
from db import get_db_connection
from datetime import datetime, timedelta
from decimal import Decimal

orders_bp = Blueprint('orders', __name__)


def serialize_order(order):
    """Convert order to JSON format"""
    # empty dictionary to store serialized data
    serialized = {}
    
    # Loop through each field in the order dictionary  Example 'order_id', 'total_price', 'delivery_time', 
    for key in order:
        # Get the value for field
        value = order[key]
        
        # Check if value is a decimal  need to be converted to regular floats for JSON
        if isinstance(value, Decimal):
            # Convert decimal to float
            serialized[key] = float(value)
            
        # Check if value is a timedelta (represents time duration) e.g, delivery_time might be stored as timedelta in database
        elif isinstance(value, timedelta):
            # Get total seconds from the timedelta
            total_seconds = int(value.total_seconds())
            
            # Calculate hours from total seconds example 7200 seconds / 3600 = 2 hours
            hours = total_seconds // 3600
            
            # Calculate remaining minutes after removing hours
            minutes = (total_seconds % 3600) // 60
            
            # Calculate remaining seconds after removing hours and minutes
            seconds = total_seconds % 60
            
            # Format hours with leading zero if less than 10
            if hours < 10:
                hours_str = "0" + str(hours)
            else:
                hours_str = str(hours)
            
            # Format minutes with leading zero if less than 10
            if minutes < 10:
                minutes_str = "0" + str(minutes)
            else:
                minutes_str = str(minutes)
            
            # Format seconds with leading zero if less than 10
            if seconds < 10:
                seconds_str = "0" + str(seconds)
            else:
                seconds_str = str(seconds)
            
            # Combine into time string format HH:MM:SS
            # Example: "02:30:45"
            time_string = hours_str + ":" + minutes_str + ":" + seconds_str
            serialized[key] = time_string
            
        # Check if value is a datetime object
        elif isinstance(value, datetime):
            # Convert datetime to ISO format string
            # Example: 2024-12-11T14:30:00
            serialized[key] = value.isoformat()
        else:
            # For all other types (strings, ints, etc), keep as is
            serialized[key] = value
    
    # Return the converted dictionary
    return serialized


@orders_bp.route('/', methods=['POST'])
def create_order():
    """Create new order"""
    conn = None
    cursor = None
    try:
        data = request.json

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        # Get order information from request
        customer_id = data['customer_id']
        items = data['items']
        total_amount = data['total_amount']
        delivery_address = data['delivery_address']

        # Check if customer exists and get their info
        get_customer = "SELECT total_balance, vip_status FROM users WHERE user_id = %s"
        cursor.execute(get_customer, (customer_id,))
        result = cursor.fetchone()

        if not result:
            cursor.close()
            conn.close()
            return jsonify({"error": "Customer not found"}), 404

        balance = float(result['total_balance'])
        is_vip = result['vip_status']
        
        # Apply discount if customer is VIP
        original_price = total_amount
        if is_vip:
            discount = total_amount * 0.05
            total_amount = total_amount - discount
        
        # Check if customer has enough money
        if balance < total_amount:
            # Add warning for insufficient funds
            warning_query = "UPDATE users SET amount_warnings = amount_warnings + 1 WHERE user_id = %s"
            cursor.execute(warning_query, (customer_id,))
            conn.commit()
            cursor.close()
            conn.close()
            return jsonify({"error": "Insufficient balance. Warning added."}), 400

        # Set delivery date to tomorrow
        today = datetime.now()
        tomorrow = today + timedelta(days=1)
        delivery_date = tomorrow.date()
        delivery_time = today.time()

        # Create order without chef or driver assigned yet
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

        cursor.execute(order_query, (customer_id, delivery_address, total_amount, delivery_date, delivery_time))
        order_id = cursor.lastrowid

        # Add each item to order_items table
        for item in items:
            item_query = "INSERT INTO order_items (order_id, item_id, quantity, item_price) VALUES (%s, %s, %s, %s)"
            cursor.execute(item_query, (order_id, item['dish_id'], item['quantity'], item['price']))

        # Take money from customer balance
        deduct_query = "UPDATE users SET total_balance = total_balance - %s WHERE user_id = %s"
        cursor.execute(deduct_query, (total_amount, customer_id))

        # Try to create payment record
        try:
            payment_query = "INSERT INTO payment (order_id, payed_by, amount_paid, payment_successful) VALUES (%s, %s, %s, TRUE)"
            cursor.execute(payment_query, (order_id, customer_id, total_amount))
        except:
            # Payment table might not exist
            print("Could not insert payment record")

        # Try to create notification
        try:
            notif_message = "Your order #" + str(order_id) + " has been placed successfully!"
            notif_query = "INSERT INTO notifications (notify_user, message, is_read) VALUES (%s, %s, FALSE)"
            cursor.execute(notif_query, (customer_id, notif_message))
        except:
            # Notifications table might not exist
            print("Could not insert notification")

        conn.commit()
        cursor.close()
        conn.close()

        response = {
            "message": "Order created successfully",
            "order_id": order_id
        }
        return jsonify(response), 201

    except Exception as e:
        print("Error creating order:", e)
        if conn:
            conn.rollback()
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 400


@orders_bp.route('/history', methods=['GET'])
def get_order_history():
    """Get order history"""
    conn = None
    cursor = None
    try:
        customer_id = request.args.get('customer_id')

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        # Build query based on whether customer_id is provided
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

        # Process each order
        serialized_orders = []
        for order in orders:
            # Serialize the order
            serialized_order = serialize_order(order)

            # Get items for this order
            items_query = """
                SELECT oi.*, m.name, m.image_url
                FROM order_items oi
                JOIN menu_items m ON oi.item_id = m.item_id
                WHERE oi.order_id = %s
            """
            cursor.execute(items_query, (order['order_id'],))
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
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 400


@orders_bp.route('/<int:order_id>/rating', methods=['POST'])
def rate_order(order_id):
    """Rate food and delivery"""
    conn = None
    cursor = None
    try:
        data = request.json
        food_rating = data.get('food_rating', 0)
        delivery_rating = data.get('delivery_rating', 0)

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        # Get order details
        order_query = "SELECT prepared_by, delivered_by, customer_id FROM orders WHERE order_id = %s"
        cursor.execute(order_query, (order_id,))
        order = cursor.fetchone()
        
        if not order:
            cursor.close()
            conn.close()
            return jsonify({"error": "Order not found"}), 404

        chef_id = order['prepared_by']
        driver_id = order['delivered_by']
        customer_id = order['customer_id']

        # Get order items
        items_query = "SELECT item_id FROM order_items WHERE order_id = %s"
        cursor.execute(items_query, (order_id,))
        items = cursor.fetchall()

        # Create reviews for each item if food rating is given
        if food_rating > 0:
            for item in items:
                item_id = item['item_id']
                review_query = "INSERT INTO reviews (amount_stars, item_reviewed, reviewed_by) VALUES (%s, %s, %s)"
                cursor.execute(review_query, (food_rating, item_id, customer_id))

        # Create feedback for chef based on food rating
        if chef_id and food_rating > 0:
            # Determine feedback type
            if food_rating >= 4:
                feedback_type = 'compliment'
                complaint_status = 'N/A'
            else:
                feedback_type = 'complaint'
                complaint_status = 'Open'
            
            feedback_message = "Food quality rated " + str(food_rating) + "/5 stars"
            
            chef_feedback = """
                INSERT INTO feedback (
                    feedback_from, 
                    feedback_for, 
                    feedback_type, 
                    message,
                    complaint_status,
                    related_order
                )
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(chef_feedback, (customer_id, chef_id, feedback_type, feedback_message, complaint_status, order_id))

        # Create feedback for driver based on delivery rating
        if driver_id and delivery_rating > 0:
            # Determine feedback type
            if delivery_rating >= 4:
                feedback_type = 'compliment'
                complaint_status = 'N/A'
            else:
                feedback_type = 'complaint'
                complaint_status = 'Open'
            
            feedback_message = "Delivery service rated " + str(delivery_rating) + "/5 stars"
            
            driver_feedback = """
                INSERT INTO feedback (
                    feedback_from, 
                    feedback_for, 
                    feedback_type, 
                    message,
                    complaint_status,
                    related_order
                )
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(driver_feedback, (customer_id, driver_id, feedback_type, feedback_message, complaint_status, order_id))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Rating submitted successfully"}), 200
        
    except Exception as e:
        print("Error rating order:", e)
        if conn:
            conn.rollback()
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 400