from flask import Blueprint, request, jsonify
from db import get_db_connection

chef_bp = Blueprint('chef', __name__)

@chef_bp.route('/orders', methods=['GET'])
def get_chef_orders():
    # get all orders that need to be prepared
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        # query to orders that are pending, preparing, or confirmed
        # join with users table to get customer names
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

        # loop through each order and get its items from order_items table
        for order in orders:
            # get the menu items for this specific order
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
    data = request.json
    chef_id = data.get('chef_id')
    
    if not chef_id:
        return jsonify({"error": "chef_id required"}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor()
    
    # update order status to preparing and assign this chef to it
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

@chef_bp.route('/orders/<int:order_id>/complete', methods=['POST'])
def complete_order(order_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    cursor = conn.cursor()
    
    # change status to ready  so drivers can see it don't assign a driver they will bid 
    cursor.execute(
        "UPDATE orders SET delivery_status = 'Ready for Delivery' WHERE order_id = %s",
        (order_id,)
    )
    
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Order completed"}), 200

@chef_bp.route('/orders/<int:order_id>/reject', methods=['POST'])
def reject_order(order_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()

        # set order status to cancelled
        cursor.execute(
            "UPDATE orders SET delivery_status = 'Cancelled' WHERE order_id = %s",
            (order_id,)
        )

        # give the customer their money back by adding total_price to their balance
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
    # get chef stats and info for their profile page
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)
        
        # get basic chef info from users table (idk about salary yet)
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
        
        # count how many dishes this chef has completed,only count orders that made it past preparation stage
        cursor.execute("""
            SELECT COUNT(*) as dishes_prepared
            FROM orders
            WHERE prepared_by = %s AND delivery_status IN ('Ready for Delivery', 'Out for Delivery', 'Delivered')
        """, (chef_id,))
        dishes_row = cursor.fetchone()
        
        # count complaints from feedback table for this chef
        cursor.execute("""
            SELECT COUNT(*) as complaints
            FROM feedback
            WHERE feedback_for = %s AND feedback_type = 'complaint'
        """, (chef_id,))
        complaints_row = cursor.fetchone()
        
        # count compliments from feedback table for this chef
        cursor.execute("""
            SELECT COUNT(*) as compliments
            FROM feedback
            WHERE feedback_for = %s AND feedback_type = 'compliment'
        """, (chef_id,))
        compliments_row = cursor.fetchone()
        
        # calculate average star rating from reviews and join reviews with order_items and orders to find reviews for this chef's dishes
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
        
        # return all the stats in one object
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
