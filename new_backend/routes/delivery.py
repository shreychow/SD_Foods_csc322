from flask import Blueprint, request, jsonify
from db import get_db_connection

delivery_bp = Blueprint("delivery", __name__)

@delivery_bp.route("/profile/<int:driver_id>", methods=["GET"])
def get_driver_profile(driver_id):
    # get delivery driver info for profile page
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        # get driver info from users table
        cursor.execute(
            """
            SELECT name, salary, amount_warnings
            FROM users
            WHERE user_id = %s AND role IN ('driver', 'delivery')
            """,
            (driver_id,),
        )
        user_row = cursor.fetchone()
        if not user_row:
            cursor.close()
            conn.close()
            return jsonify({"error": "Driver not found"}), 404

        # count how many deliveries this driver completed
        cursor.execute(
            """
            SELECT COUNT(*) AS total_deliveries
            FROM orders
            WHERE delivered_by = %s AND delivery_status = 'Delivered'
            """,
            (driver_id,),
        )
        deliveries_row = cursor.fetchone() or {"total_deliveries": 0}

        # count complaints from feedback table
        cursor.execute(
            """
            SELECT COUNT(*) AS complaints
            FROM feedback
            WHERE feedback_for = %s AND feedback_type = 'complaint'
            """,
            (driver_id,),
        )
        complaints_row = cursor.fetchone() or {"complaints": 0}

        # count compliments from feedback table
        cursor.execute(
            """
            SELECT COUNT(*) AS compliments
            FROM feedback
            WHERE feedback_for = %s AND feedback_type = 'compliment'
            """,
            (driver_id,),
        )
        compliments_row = cursor.fetchone() or {"compliments": 0}

        cursor.close()
        conn.close()

        return jsonify(
            {
                "name": user_row["name"],
                "salary": float(user_row["salary"]),
                "warnings": user_row["amount_warnings"],
                "total_deliveries": deliveries_row["total_deliveries"],
                "complaints": complaints_row["complaints"],
                "compliments": compliments_row["compliments"],
            }
        ), 200

    except Exception as e:
        print("get_driver_profile error:", e)
        return jsonify({"error": str(e)}), 400

@delivery_bp.route("/orders/available", methods=["GET"])
def get_available_orders():
    # get orders that are ready for delivery and not assigned yet drivers should bid on these
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        # find orders  with no driver assigned
        cursor.execute(
            """
            SELECT
                o.order_id,
                o.delivered_to,
                o.total_price,
                o.delivery_status,
                u.name AS customer_name
            FROM orders o
            JOIN users u ON o.customer_id = u.user_id
            WHERE o.delivery_status = 'Ready for Delivery'
              AND o.delivered_by IS NULL
            ORDER BY o.created_at ASC
            """
        )
        orders = cursor.fetchall() or []

        # get all bids for each order
        for order in orders:
            cursor.execute(
                """
                SELECT
                    b.bid_id,
                    b.driver_id,
                    b.bid_amount,
                    b.bid_status,
                    u.name AS driver_name
                FROM delivery_bids b
                JOIN users u ON b.driver_id = u.user_id
                WHERE b.order_id = %s
                ORDER BY b.bid_amount ASC, b.created_at ASC
                """,
                (order["order_id"],),
            )
            bids = cursor.fetchall() or []
            # convert prices to float so they complatible with JSON
            for bid in bids:
                bid["bid_amount"] = float(bid["bid_amount"])
            order["bids"] = bids
            order["total_price"] = float(order["total_price"])

        cursor.close()
        conn.close()

        return jsonify(orders), 200

    except Exception as e:
        print("get_available_orders error:", e)
        return jsonify({"error": str(e)}), 400

@delivery_bp.route("/orders/assigned", methods=["GET"])
def get_assigned_orders():
    # get orders that are assigned to a specific driver
    try:
        driver_id = request.args.get("driver_id", type=int)
        if not driver_id:
            return jsonify({"error": "driver_id is required"}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        # find orders assigned to this driver that aren't delivered yet
        cursor.execute(
            """
            SELECT
                o.order_id,
                o.delivered_to,
                o.total_price,
                o.delivery_status,
                u.name AS customer_name,
                u.phone
            FROM orders o
            JOIN users u ON o.customer_id = u.user_id
            WHERE o.delivered_by = %s
              AND o.delivery_status IN ('Ready for Delivery', 'Out for Delivery')
            ORDER BY o.created_at ASC
            """,
            (driver_id,),
        )
        orders = cursor.fetchall() or []
        for order in orders:
            order["total_price"] = float(order["total_price"])

        cursor.close()
        conn.close()
        return jsonify(orders), 200

    except Exception as e:
        print("get_assigned_orders error:", e)
        return jsonify({"error": str(e)}), 400

@delivery_bp.route("/orders/<int:order_id>/bid", methods=["POST"])
def place_bid(order_id):
    # driver places a bid on an order
    try:
        data = request.json
        driver_id = data.get("driver_id")
        bid_amount = data.get("bid_amount")

        if not driver_id or bid_amount is None:
            return jsonify({"error": "driver_id and bid_amount are required"}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()

        # insert bid or update if driver already bid on this order
        cursor.execute(
            """
            INSERT INTO delivery_bids (order_id, driver_id, bid_amount, bid_status)
            VALUES (%s, %s, %s, 'pending')
            ON DUPLICATE KEY UPDATE
                bid_amount = VALUES(bid_amount),
                bid_status = 'pending'
            """,
            (order_id, driver_id, bid_amount),
        )

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Bid placed/updated"}), 200

    except Exception as e:
        print("place_bid error:", e)
        return jsonify({"error": str(e)}), 400

@delivery_bp.route("/orders/<int:order_id>/pickup", methods=["POST"])
def pickup_order(order_id):
    # driver picks up the order from restaurant
    try:
        data = request.json
        driver_id = data.get("driver_id")
        if not driver_id:
            return jsonify({"error": "driver_id is required"}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()

        # assign driver if not assigned yet, and mark as out for delivery
        cursor.execute(
            """
            UPDATE orders
            SET delivered_by = COALESCE(delivered_by, %s),
                delivery_status = 'Out for Delivery'
            WHERE order_id = %s
              AND (delivered_by IS NULL OR delivered_by = %s)
            """,
            (driver_id, order_id, driver_id),
        )

        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({"error": "Order is assigned to a different driver"}), 400

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Order picked up"}), 200

    except Exception as e:
        print("pickup_order error:", e)
        return jsonify({"error": str(e)}), 400

@delivery_bp.route("/orders/<int:order_id>/deliver", methods=["POST"])
def deliver_order(order_id):
    # mark order as delivered
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()

        # change status to delivered
        cursor.execute(
            """
            UPDATE orders
            SET delivery_status = 'Delivered'
            WHERE order_id = %s
              AND delivered_by IS NOT NULL
            """,
            (order_id,),
        )

        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({"error": "Order has no assigned driver"}), 400

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Order delivered"}), 200

    except Exception as e:
        print("deliver_order error:", e)
        return jsonify({"error": str(e)}), 400
