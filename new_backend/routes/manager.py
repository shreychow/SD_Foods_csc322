# # backend_modular/routes/manager.py - CLEAN VERSION (NO DUPLICATES)
# from flask import Blueprint, request, jsonify
# from db import get_db_connection

# manager_bp = Blueprint("manager", __name__)


# @manager_bp.route("/stats", methods=["GET"])
# def get_manager_stats():
#     """High-level stats for manager dashboard"""
#     conn = None
#     try:
#         conn = get_db_connection()
#         if not conn:
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor(dictionary=True)

#         # Orders + revenue
#         cursor.execute("""
#             SELECT 
#                 COUNT(*) AS total_orders,
#                 COALESCE(SUM(total_price), 0) AS total_revenue
#             FROM orders
#         """)
#         order_row = cursor.fetchone() or {}
#         total_orders = order_row.get("total_orders", 0) or 0
#         total_revenue = float(order_row.get("total_revenue", 0) or 0)

#         # Total users
#         cursor.execute("SELECT COUNT(*) AS total_users FROM users")
#         user_row = cursor.fetchone() or {}
#         total_users = user_row.get("total_users", 0) or 0

#         # Pending feedback (only unresolved complaints)
#         cursor.execute("""
#             SELECT COUNT(*) AS pending_feedback
#             FROM feedback
#             WHERE complaint_status IN ('Open', 'Pending')
#         """)
#         fb_row = cursor.fetchone() or {}
#         pending_feedback = fb_row.get("pending_feedback", 0) or 0

#         cursor.close()
#         conn.close()

#         return jsonify({
#             "total_orders": total_orders,
#             "total_revenue": total_revenue,
#             "total_users": total_users,
#             "pending_feedback": pending_feedback,
#         }), 200

#     except Exception as e:
#         if conn:
#             conn.close()
#         print("Manager /stats error:", e)
#         return jsonify({"error": str(e)}), 400


# @manager_bp.route("/feedback", methods=["GET"])
# def get_manager_feedback():
#     """Get feedback items for manager review"""
#     conn = None
#     try:
#         conn = get_db_connection()
#         if not conn:
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor(dictionary=True)

#         cursor.execute("""
#             SELECT 
#                 f.feedback_id,
#                 f.feedback_type,
#                 f.feedback_from,
#                 f.feedback_for,
#                 f.message,
#                 f.complaint_status,
#                 f.created_at,
#                 u1.name AS from_name,
#                 u2.name AS to_name
#             FROM feedback f
#             JOIN users u1 ON f.feedback_from = u1.user_id
#             JOIN users u2 ON f.feedback_for = u2.user_id
#             ORDER BY f.created_at DESC
#         """)

#         feedbacks = cursor.fetchall() or []
#         cursor.close()
#         conn.close()

#         return jsonify(feedbacks), 200

#     except Exception as e:
#         if conn:
#             conn.close()
#         print("Manager /feedback error:", e)
#         return jsonify({"error": str(e)}), 400


# @manager_bp.route("/employees", methods=["GET"])
# def get_employees():
#     """Get all chefs and delivery people"""
#     conn = None
#     try:
#         conn = get_db_connection()
#         if not conn:
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor(dictionary=True)
        
#         cursor.execute("""
#             SELECT user_id, name, email, role, salary, amount_warnings
#             FROM users
#             WHERE role IN ('chef', 'driver')
#             ORDER BY role, name
#         """)
        
#         employees = cursor.fetchall() or []
#         cursor.close()
#         conn.close()
        
#         return jsonify(employees), 200

#     except Exception as e:
#         if conn:
#             conn.close()
#         print("Get employees error:", e)
#         return jsonify({"error": str(e)}), 400


# @manager_bp.route("/customers", methods=["GET"])
# def get_customers():
#     """Get all customers"""
#     conn = None
#     try:
#         conn = get_db_connection()
#         if not conn:
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor(dictionary=True)
        
#         cursor.execute("""
#             SELECT user_id, name, email, total_balance, amount_warnings, vip_status
#             FROM users
#             WHERE role = 'customer'
#             ORDER BY amount_warnings DESC, name
#         """)
        
#         customers = cursor.fetchall() or []
#         cursor.close()
#         conn.close()
        
#         return jsonify(customers), 200

#     except Exception as e:
#         if conn:
#             conn.close()
#         print("Get customers error:", e)
#         return jsonify({"error": str(e)}), 400


# @manager_bp.route("/feedback/<int:feedback_id>/approve", methods=["POST"])
# def approve_feedback(feedback_id):
#     """Manager approves feedback (if complaint, add warning)"""
#     conn = None
#     try:
#         conn = get_db_connection()
#         if not conn:
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor()

#         # Mark complaint as resolved
#         cursor.execute("""
#             UPDATE feedback 
#             SET complaint_status = 'Resolved' 
#             WHERE feedback_id = %s
#         """, (feedback_id,))

#         # If it's a complaint, increment warnings for target user
#         cursor.execute("""
#             UPDATE users u
#             JOIN feedback f ON u.user_id = f.feedback_for
#             SET u.amount_warnings = u.amount_warnings + 1
#             WHERE f.feedback_id = %s AND f.feedback_type = 'complaint'
#         """, (feedback_id,))

#         conn.commit()
#         cursor.close()
#         conn.close()

#         return jsonify({"message": "Feedback approved"}), 200

#     except Exception as e:
#         if conn:
#             conn.rollback()
#             conn.close()
#         print("Manager approve error:", e)
#         return jsonify({"error": str(e)}), 400


# @manager_bp.route("/feedback/<int:feedback_id>/dismiss", methods=["POST"])
# def dismiss_feedback(feedback_id):
#     """Manager dismisses feedback and warns the reporter"""
#     conn = None
#     try:
#         data = request.json or {}
#         reporter_id = data.get("reporter_id")
        
#         conn = get_db_connection()
#         if not conn:
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor()
        
#         # Mark as dismissed
#         cursor.execute("""
#             UPDATE feedback 
#             SET complaint_status = 'Dismissed' 
#             WHERE feedback_id = %s
#         """, (feedback_id,))
        
#         # Add warning to reporter for false complaint
#         if reporter_id:
#             cursor.execute("""
#                 UPDATE users 
#                 SET amount_warnings = amount_warnings + 1 
#                 WHERE user_id = %s
#             """, (reporter_id,))
        
#         conn.commit()
#         cursor.close()
#         conn.close()
        
#         return jsonify({"message": "Feedback dismissed, reporter warned"}), 200

#     except Exception as e:
#         if conn:
#             conn.rollback()
#             conn.close()
#         print("Manager dismiss error:", e)
#         return jsonify({"error": str(e)}), 400


# @manager_bp.route("/employees/<int:user_id>/fire", methods=["POST"])
# def fire_employee(user_id):
#     """Fire an employee"""
#     conn = None
#     try:
#         conn = get_db_connection()
#         if not conn:
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor()
        
#         cursor.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
        
#         conn.commit()
#         cursor.close()
#         conn.close()
        
#         return jsonify({"message": "Employee fired"}), 200

#     except Exception as e:
#         if conn:
#             conn.rollback()
#             conn.close()
#         print("Fire employee error:", e)
#         return jsonify({"error": str(e)}), 400


# @manager_bp.route("/employees/<int:user_id>/promote", methods=["POST"])
# def promote_employee(user_id):
#     """Promote employee (increase salary by 10%)"""
#     conn = None
#     try:
#         conn = get_db_connection()
#         if not conn:
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor()
        
#         cursor.execute("""
#             UPDATE users 
#             SET salary = salary * 1.10 
#             WHERE user_id = %s
#         """, (user_id,))
        
#         conn.commit()
#         cursor.close()
#         conn.close()
        
#         return jsonify({"message": "Employee promoted"}), 200

#     except Exception as e:
#         if conn:
#             conn.rollback()
#             conn.close()
#         print("Promote employee error:", e)
#         return jsonify({"error": str(e)}), 400


# @manager_bp.route("/employees/<int:user_id>/demote", methods=["POST"])
# def demote_employee(user_id):
#     """Demote employee (decrease salary by 10%)"""
#     conn = None
#     try:
#         conn = get_db_connection()
#         if not conn:
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor()
        
#         cursor.execute("""
#             UPDATE users 
#             SET salary = salary * 0.90 
#             WHERE user_id = %s
#         """, (user_id,))
        
#         conn.commit()
#         cursor.close()
#         conn.close()
        
#         return jsonify({"message": "Employee demoted"}), 200

#     except Exception as e:
#         if conn:
#             conn.rollback()
#             conn.close()
#         print("Demote employee error:", e)
#         return jsonify({"error": str(e)}), 400


# @manager_bp.route("/customers/<int:user_id>/deregister", methods=["POST"])
# def deregister_customer(user_id):
#     """Deregister customer and add to blacklist"""
#     conn = None
#     try:
#         conn = get_db_connection()
#         if not conn:
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor()
        
#         # Get customer info before deleting
#         cursor.execute("SELECT name, email FROM users WHERE user_id = %s", (user_id,))
#         user_row = cursor.fetchone()
        
#         if user_row:
#             name, email = user_row
            
#             # Try to add to blacklist (if table exists)
#             try:
#                 cursor.execute("""
#                     INSERT INTO blacklist (user_id, name, email, reason, blacklisted_at)
#                     VALUES (%s, %s, %s, 'Deregistered by manager', NOW())
#                 """, (user_id, name, email))
#             except Exception:
#                 print(f"Blacklist table not found. User {user_id} marked for deletion.")
        
#         # Delete user
#         cursor.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
        
#         conn.commit()
#         cursor.close()
#         conn.close()
        
#         return jsonify({"message": "Customer deregistered and blacklisted"}), 200

#     except Exception as e:
#         if conn:
#             conn.rollback()
#             conn.close()
#         print("Deregister customer error:", e)
#         return jsonify({"error": str(e)}), 400


# # ============================================
# # DELIVERY BIDDING SYSTEM
# # ============================================

# @manager_bp.route("/bids/pending", methods=["GET"])
# def get_pending_bids():
#     """Get all pending delivery bids"""
#     try:
#         conn = get_db_connection()
#         if not conn:
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor(dictionary=True)

#         cursor.execute("""
#             SELECT 
#                 db.bid_id,
#                 db.order_id,
#                 db.driver_id,
#                 db.bid_amount,
#                 db.bid_status,
#                 o.delivered_to,
#                 o.total_price as order_total,
#                 u1.name as driver_name,
#                 u2.name as customer_name
#             FROM delivery_bids db
#             JOIN orders o ON db.order_id = o.order_id
#             JOIN users u1 ON db.driver_id = u1.user_id
#             JOIN users u2 ON o.customer_id = u2.user_id
#             WHERE db.bid_status = 'pending'
#               AND o.delivered_by IS NULL
#             ORDER BY db.order_id, db.bid_amount ASC
#         """)

#         bids = cursor.fetchall() or []

#         for bid in bids:
#             bid['bid_amount'] = float(bid['bid_amount'])
#             bid['order_total'] = float(bid['order_total'])

#         cursor.close()
#         conn.close()

#         return jsonify(bids), 200

#     except Exception as e:
#         print(f"Get pending bids error: {e}")
#         return jsonify({"error": str(e)}), 400


# @manager_bp.route("/bids/<int:bid_id>/approve", methods=["POST"])
# def approve_bid(bid_id):
#     """Manager approves a bid and assigns driver to order"""
#     try:
#         data = request.json or {}
#         justification = data.get('justification', '')

#         conn = get_db_connection()
#         if not conn:
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor(dictionary=True)

#         # Get bid info
#         cursor.execute("""
#             SELECT order_id, driver_id, bid_amount
#             FROM delivery_bids
#             WHERE bid_id = %s
#         """, (bid_id,))

#         bid = cursor.fetchone()
#         if not bid:
#             cursor.close()
#             conn.close()
#             return jsonify({"error": "Bid not found"}), 404

#         # Check if this is NOT the lowest bid and justification is required
#         cursor.execute("""
#             SELECT MIN(bid_amount) as lowest_bid
#             FROM delivery_bids
#             WHERE order_id = %s AND bid_status = 'pending'
#         """, (bid['order_id'],))

#         lowest_row = cursor.fetchone()
#         lowest_bid = float(lowest_row['lowest_bid'])

#         if float(bid['bid_amount']) > lowest_bid and not justification:
#             cursor.close()
#             conn.close()
#             return jsonify({
#                 "error": "Justification required for approving higher bid",
#                 "lowest_bid": lowest_bid,
#                 "selected_bid": float(bid['bid_amount'])
#             }), 400

#         # Assign driver to order
#         cursor.execute("""
#             UPDATE orders
#             SET delivered_by = %s
#             WHERE order_id = %s
#         """, (bid['driver_id'], bid['order_id']))

#         # Update bid status to approved
#         cursor.execute("""
#             UPDATE delivery_bids
#             SET bid_status = 'approved',
#                 justification = %s
#             WHERE bid_id = %s
#         """, (justification, bid_id))

#         # Reject all other bids for this order
#         cursor.execute("""
#             UPDATE delivery_bids
#             SET bid_status = 'rejected'
#             WHERE order_id = %s AND bid_id != %s
#         """, (bid['order_id'], bid_id))

#         conn.commit()
#         cursor.close()
#         conn.close()

#         return jsonify({"message": "Bid approved and driver assigned"}), 200

#     except Exception as e:
#         if conn:
#             conn.rollback()
#             conn.close()
#         print(f"Approve bid error: {e}")
#         return jsonify({"error": str(e)}), 400


# @manager_bp.route("/bids/<int:bid_id>/reject", methods=["POST"])
# def reject_bid(bid_id):
#     """Manager rejects a specific bid"""
#     try:
#         conn = get_db_connection()
#         if not conn:
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor()

#         cursor.execute("""
#             UPDATE delivery_bids
#             SET bid_status = 'rejected'
#             WHERE bid_id = %s
#         """, (bid_id,))

#         conn.commit()
#         cursor.close()
#         conn.close()

#         return jsonify({"message": "Bid rejected"}), 200

#     except Exception as e:
#         if conn:
#             conn.rollback()
#             conn.close()
#         print(f"Reject bid error: {e}")
#         return jsonify({"error": str(e)}), 400

# backend_modular/routes/manager.py - COMPLETE WITH VIP & BIDDING
from flask import Blueprint, request, jsonify
from db import get_db_connection

manager_bp = Blueprint("manager", __name__)


@manager_bp.route("/stats", methods=["GET"])
def get_manager_stats():
    """High-level stats for manager dashboard"""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        # Orders + revenue
        cursor.execute("""
            SELECT 
                COUNT(*) AS total_orders,
                COALESCE(SUM(total_price), 0) AS total_revenue
            FROM orders
        """)
        order_row = cursor.fetchone() or {}
        total_orders = order_row.get("total_orders", 0) or 0
        total_revenue = float(order_row.get("total_revenue", 0) or 0)

        # Total users
        cursor.execute("SELECT COUNT(*) AS total_users FROM users")
        user_row = cursor.fetchone() or {}
        total_users = user_row.get("total_users", 0) or 0

        # Employees count (chefs + drivers)
        cursor.execute("""
            SELECT COUNT(*) AS employee_count
            FROM users
            WHERE role IN ('chef', 'driver', 'delivery')
        """)
        emp_row = cursor.fetchone() or {}
        employee_count = emp_row.get("employee_count", 0) or 0

        # Pending feedback (only unresolved complaints)
        cursor.execute("""
            SELECT COUNT(*) AS pending_feedback
            FROM feedback
            WHERE feedback_type = 'complaint' 
            AND complaint_status IN ('Open', 'Pending', 'Under Review')
        """)
        fb_row = cursor.fetchone() or {}
        pending_feedback = fb_row.get("pending_feedback", 0) or 0

        # Pending bids
        cursor.execute("""
            SELECT COUNT(DISTINCT order_id) AS pending_bids
            FROM delivery_bids
            WHERE bid_status = 'pending'
        """)
        bid_row = cursor.fetchone() or {}
        pending_bids = bid_row.get("pending_bids", 0) or 0

        # VIP requests
        cursor.execute("""
            SELECT COUNT(*) AS vip_requests
            FROM vip_requests
            WHERE request_status = 'pending'
        """)
        vip_row = cursor.fetchone() or {}
        vip_requests = vip_row.get("vip_requests", 0) or 0

        cursor.close()
        conn.close()

        return jsonify({
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "total_users": total_users,
            "employee_count": employee_count,
            "pending_feedback": pending_feedback,
            "pending_bids": pending_bids,
            "vip_requests": vip_requests,
        }), 200

    except Exception as e:
        if conn:
            conn.close()
        print("Manager /stats error:", e)
        return jsonify({"error": str(e)}), 400


@manager_bp.route("/feedback", methods=["GET"])
def get_manager_feedback():
    """Get feedback items for manager review"""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT 
                f.feedback_id,
                f.feedback_type,
                f.feedback_from,
                f.feedback_for,
                f.message,
                f.complaint_status,
                f.created_at,
                u1.name AS from_name,
                u2.name AS to_name,
                u2.role AS target_role
            FROM feedback f
            JOIN users u1 ON f.feedback_from = u1.user_id
            JOIN users u2 ON f.feedback_for = u2.user_id
            ORDER BY f.created_at DESC
        """)

        feedbacks = cursor.fetchall() or []
        cursor.close()
        conn.close()

        return jsonify(feedbacks), 200

    except Exception as e:
        if conn:
            conn.close()
        print("Manager /feedback error:", e)
        return jsonify({"error": str(e)}), 400


@manager_bp.route("/employees", methods=["GET"])
def get_employees():
    """Get all chefs and delivery people"""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT user_id, name, email, role, salary, amount_warnings
            FROM users
            WHERE role IN ('chef', 'driver', 'delivery')
            ORDER BY role, name
        """)
        
        employees = cursor.fetchall() or []
        
        # Convert salary to float
        for emp in employees:
            emp['salary'] = float(emp['salary'])
        
        cursor.close()
        conn.close()
        
        return jsonify(employees), 200

    except Exception as e:
        if conn:
            conn.close()
        print("Get employees error:", e)
        return jsonify({"error": str(e)}), 400


@manager_bp.route("/customers", methods=["GET"])
def get_customers():
    """Get all customers"""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT user_id, name, email, total_balance, amount_warnings, vip_status
            FROM users
            WHERE role = 'customer'
            ORDER BY amount_warnings DESC, name
        """)
        
        customers = cursor.fetchall() or []
        
        # Convert to float
        for cust in customers:
            cust['total_balance'] = float(cust['total_balance'])
        
        cursor.close()
        conn.close()
        
        return jsonify(customers), 200

    except Exception as e:
        if conn:
            conn.close()
        print("Get customers error:", e)
        return jsonify({"error": str(e)}), 400


@manager_bp.route("/feedback/<int:feedback_id>/approve", methods=["POST"])
def approve_feedback(feedback_id):
    """Manager approves feedback (if complaint, add warning)"""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()

        # Mark complaint as resolved
        cursor.execute("""
            UPDATE feedback 
            SET complaint_status = 'Resolved' 
            WHERE feedback_id = %s
        """, (feedback_id,))

        # If it's a complaint, increment warnings for target user
        cursor.execute("""
            UPDATE users u
            JOIN feedback f ON u.user_id = f.feedback_for
            SET u.amount_warnings = u.amount_warnings + 1
            WHERE f.feedback_id = %s AND f.feedback_type = 'complaint'
        """, (feedback_id,))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Feedback approved"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        print("Manager approve error:", e)
        return jsonify({"error": str(e)}), 400


@manager_bp.route("/feedback/<int:feedback_id>/dismiss", methods=["POST"])
def dismiss_feedback(feedback_id):
    """Manager dismisses feedback and warns the reporter"""
    conn = None
    try:
        data = request.json or {}
        reporter_id = data.get("reporter_id")
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()
        
        # Mark as dismissed
        cursor.execute("""
            UPDATE feedback 
            SET complaint_status = 'Dismissed' 
            WHERE feedback_id = %s
        """, (feedback_id,))
        
        # Add warning to reporter for false complaint
        if reporter_id:
            cursor.execute("""
                UPDATE users 
                SET amount_warnings = amount_warnings + 1 
                WHERE user_id = %s
            """, (reporter_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Feedback dismissed, reporter warned"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        print("Manager dismiss error:", e)
        return jsonify({"error": str(e)}), 400


@manager_bp.route("/employees/<int:user_id>/fire", methods=["POST"])
def fire_employee(user_id):
    """Fire an employee"""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Employee fired"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        print("Fire employee error:", e)
        return jsonify({"error": str(e)}), 400


@manager_bp.route("/employees/<int:user_id>/promote", methods=["POST"])
def promote_employee(user_id):
    """Promote employee (increase salary by 10%)"""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE users 
            SET salary = salary * 1.10 
            WHERE user_id = %s
        """, (user_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Employee promoted"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        print("Promote employee error:", e)
        return jsonify({"error": str(e)}), 400


@manager_bp.route("/employees/<int:user_id>/demote", methods=["POST"])
def demote_employee(user_id):
    """Demote employee (decrease salary by 10%)"""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE users 
            SET salary = salary * 0.90 
            WHERE user_id = %s
        """, (user_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Employee demoted"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        print("Demote employee error:", e)
        return jsonify({"error": str(e)}), 400


@manager_bp.route("/customers/<int:user_id>/deregister", methods=["POST"])
def deregister_customer(user_id):
    """Deregister customer and add to blacklist"""
    conn = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()
        
        # Get customer info before deleting
        cursor.execute("SELECT name, email FROM users WHERE user_id = %s", (user_id,))
        user_row = cursor.fetchone()
        
        if user_row:
            name, email = user_row
            
            # Try to add to blacklist (if table exists)
            try:
                cursor.execute("""
                    INSERT INTO blacklist (user_id, name, email, reason, blacklisted_at)
                    VALUES (%s, %s, %s, 'Deregistered by manager', NOW())
                """, (user_id, name, email))
            except Exception:
                print(f"Blacklist table not found. User {user_id} marked for deletion.")
        
        # Delete user
        cursor.execute("DELETE FROM users WHERE user_id = %s", (user_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Customer deregistered and blacklisted"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        print("Deregister customer error:", e)
        return jsonify({"error": str(e)}), 400


# ============================================
# DELIVERY BIDDING SYSTEM
# ============================================

@manager_bp.route("/bids/pending", methods=["GET"])
def get_pending_bids():
    """Get all pending delivery bids grouped by order"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT 
                db.bid_id,
                db.order_id,
                db.driver_id,
                db.bid_amount,
                db.bid_status,
                o.delivered_to,
                o.total_price as order_total,
                u1.name as driver_name,
                u2.name as customer_name,
                db.created_at
            FROM delivery_bids db
            JOIN orders o ON db.order_id = o.order_id
            JOIN users u1 ON db.driver_id = u1.user_id
            JOIN users u2 ON o.customer_id = u2.user_id
            WHERE db.bid_status = 'pending'
              AND o.delivered_by IS NULL
            ORDER BY db.order_id, db.bid_amount ASC
        """)

        bids = cursor.fetchall() or []

        for bid in bids:
            bid['bid_amount'] = float(bid['bid_amount'])
            bid['order_total'] = float(bid['order_total'])

        cursor.close()
        conn.close()

        return jsonify(bids), 200

    except Exception as e:
        print(f"Get pending bids error: {e}")
        return jsonify({"error": str(e)}), 400


@manager_bp.route("/bids/<int:bid_id>/approve", methods=["POST"])
def approve_bid(bid_id):
    """Manager approves a bid and assigns driver to order"""
    try:
        data = request.json or {}
        justification = data.get('justification', '')

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        # Get bid info
        cursor.execute("""
            SELECT order_id, driver_id, bid_amount
            FROM delivery_bids
            WHERE bid_id = %s
        """, (bid_id,))

        bid = cursor.fetchone()
        if not bid:
            cursor.close()
            conn.close()
            return jsonify({"error": "Bid not found"}), 404

        # Check if this is NOT the lowest bid
        cursor.execute("""
            SELECT MIN(bid_amount) as lowest_bid
            FROM delivery_bids
            WHERE order_id = %s AND bid_status = 'pending'
        """, (bid['order_id'],))

        lowest_row = cursor.fetchone()
        lowest_bid = float(lowest_row['lowest_bid'])

        if float(bid['bid_amount']) > lowest_bid and not justification:
            cursor.close()
            conn.close()
            return jsonify({
                "error": "Justification required for approving higher bid",
                "lowest_bid": lowest_bid,
                "selected_bid": float(bid['bid_amount'])
            }), 400

        # Assign driver to order
        cursor.execute("""
            UPDATE orders
            SET delivered_by = %s
            WHERE order_id = %s
        """, (bid['driver_id'], bid['order_id']))

        # Update bid status to approved
        cursor.execute("""
            UPDATE delivery_bids
            SET bid_status = 'approved',
                justification = %s
            WHERE bid_id = %s
        """, (justification, bid_id))

        # Reject all other bids for this order
        cursor.execute("""
            UPDATE delivery_bids
            SET bid_status = 'rejected'
            WHERE order_id = %s AND bid_id != %s
        """, (bid['order_id'], bid_id))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Bid approved and driver assigned"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        print(f"Approve bid error: {e}")
        return jsonify({"error": str(e)}), 400


@manager_bp.route("/bids/<int:bid_id>/reject", methods=["POST"])
def reject_bid(bid_id):
    """Manager rejects a specific bid"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()

        cursor.execute("""
            UPDATE delivery_bids
            SET bid_status = 'rejected'
            WHERE bid_id = %s
        """, (bid_id,))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Bid rejected"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        print(f"Reject bid error: {e}")
        return jsonify({"error": str(e)}), 400


# ============================================
# VIP REQUEST SYSTEM
# ============================================

@manager_bp.route("/vip/requests", methods=["GET"])
def get_vip_requests():
    """Get all pending VIP requests"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT 
                vr.request_id,
                vr.customer_id,
                vr.request_status,
                vr.request_date,
                u.name as customer_name,
                u.email,
                u.total_balance,
                u.amount_warnings,
                (SELECT COUNT(*) FROM orders WHERE customer_id = vr.customer_id) as total_orders
            FROM vip_requests vr
            JOIN users u ON vr.customer_id = u.user_id
            WHERE vr.request_status = 'pending'
            ORDER BY vr.request_date DESC
        """)

        requests = cursor.fetchall() or []
        
        for req in requests:
            req['total_balance'] = float(req['total_balance'])
        
        cursor.close()
        conn.close()

        return jsonify(requests), 200

    except Exception as e:
        print(f"Get VIP requests error: {e}")
        return jsonify({"error": str(e)}), 400


@manager_bp.route("/vip/<int:request_id>/approve", methods=["POST"])
def approve_vip(request_id):
    """Manager approves VIP request"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        # Get customer ID from request
        cursor.execute("""
            SELECT customer_id FROM vip_requests WHERE request_id = %s
        """, (request_id,))
        
        req = cursor.fetchone()
        if not req:
            cursor.close()
            conn.close()
            return jsonify({"error": "Request not found"}), 404

        # Update user to VIP
        cursor.execute("""
            UPDATE users 
            SET vip_status = TRUE 
            WHERE user_id = %s
        """, (req['customer_id'],))

        # Update request status
        cursor.execute("""
            UPDATE vip_requests 
            SET request_status = 'approved' 
            WHERE request_id = %s
        """, (request_id,))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "VIP request approved"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        print(f"Approve VIP error: {e}")
        return jsonify({"error": str(e)}), 400


@manager_bp.route("/vip/<int:request_id>/reject", methods=["POST"])
def reject_vip(request_id):
    """Manager rejects VIP request"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()

        cursor.execute("""
            UPDATE vip_requests 
            SET request_status = 'rejected' 
            WHERE request_id = %s
        """, (request_id,))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "VIP request rejected"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        print(f"Reject VIP error: {e}")
        return jsonify({"error": str(e)}), 400


@manager_bp.route("/vip/<int:customer_id>/demote", methods=["POST"])
def demote_vip(customer_id):
    """Manager demotes VIP to regular customer"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()

        cursor.execute("""
            UPDATE users 
            SET vip_status = FALSE 
            WHERE user_id = %s
        """, (customer_id,))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "VIP demoted to regular customer"}), 200

    except Exception as e:
        if conn:
            conn.rollback()
            conn.close()
        print(f"Demote VIP error: {e}")
        return jsonify({"error": str(e)}), 400