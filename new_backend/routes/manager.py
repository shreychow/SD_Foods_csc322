# # manager_routes.py
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

        # Pending feedback (only unresolved complaints)
        cursor.execute("""
            SELECT COUNT(*) AS pending_feedback
            FROM feedback
            WHERE complaint_status IN ('Open', 'Pending')
        """)
        fb_row = cursor.fetchone() or {}
        pending_feedback = fb_row.get("pending_feedback", 0) or 0

        cursor.close()
        conn.close()

        return jsonify({
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "total_users": total_users,
            "pending_feedback": pending_feedback,
        }), 200

    except Exception as e:
        if conn:
            conn.close()
        print("Manager /stats error:", e)
        return jsonify({"error": str(e)}), 400


@manager_bp.route("/feedback", methods=["GET"])
def get_manager_feedback():
    """
    Get feedback items for manager review.
    Manager can see ALL feedback (complaints + compliments),
    then frontend decides what is "pending".
    """
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
                u2.name AS to_name
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
            WHERE role IN ('chef', 'driver')
            ORDER BY role, name
        """)
        
        employees = cursor.fetchall() or []
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
            SELECT user_id, name, email, total_balance, amount_warnings, is_vip
            FROM users
            WHERE role = 'customer'
            ORDER BY amount_warnings DESC, name
        """)
        
        customers = cursor.fetchall() or []
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
    """Manager dismisses feedback and warns the reporter (for false complaint)"""
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
    """Deregister customer and add to blacklist (if table exists)"""
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

