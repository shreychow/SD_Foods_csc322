from flask import Blueprint, request, jsonify
from db import get_db_connection

feedback_bp = Blueprint("feedback", __name__)

@feedback_bp.route("/submit", methods=["POST"])
def submit_feedback():
    # submit feedback for chef, delivery person, or customer
    try:
        data = request.json

        feedback_from = data.get("customer_id")
        target_type = data.get("target_type")  # chef or delivery or customer
        target_id = data.get("target_id")
        order_id = data.get("order_id")
        feedback_type = data.get("type")  # complaint or complment
        message = data.get("message", "").strip()

        # check if all required fields  filled 
        if not feedback_from or not feedback_type or not target_type or not message:
            return jsonify({"error": "Missing required fields"}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        resolved_target_id = None

        # figure out who feedback is for
        if target_type == "chef":
            # need order_id to find the chef
            if not order_id:
                return jsonify({"error": "order_id is required for chef feedback"}), 400

            # find which chef prepared order
            cursor.execute(
                "SELECT prepared_by FROM orders WHERE order_id = %s",
                (order_id,),
            )
            order_row = cursor.fetchone()

            if not order_row:
                return jsonify({"error": "Order not found"}), 404

            resolved_target_id = order_row.get("prepared_by")

            # if no chef was assigned to this order, pick a random one
            if not resolved_target_id:
                cursor.execute(
                    "SELECT user_id FROM users WHERE role = 'chef' ORDER BY RAND() LIMIT 1"
                )
                chef_row = cursor.fetchone()
                if chef_row:
                    resolved_target_id = chef_row["user_id"]
                    # update the order so we remember this chef made it
                    cursor.execute(
                        "UPDATE orders SET prepared_by = %s WHERE order_id = %s",
                        (resolved_target_id, order_id),
                    )
                else:
                    return jsonify({"error": "No chefs available in the system"}), 400

        elif target_type == "delivery":
            # need order_id to find the delivery person
            if not order_id:
                return jsonify({"error": "order_id is required for delivery feedback"}), 400

            # find which driver delivered this order
            cursor.execute(
                "SELECT delivered_by FROM orders WHERE order_id = %s",
                (order_id,),
            )
            order_row = cursor.fetchone()

            if not order_row:
                return jsonify({"error": "Order not found"}), 404

            resolved_target_id = order_row["delivered_by"]

            # delivery person must be assigned
            if not resolved_target_id:
                return jsonify({"error": "No delivery person assigned to this order"}), 400

        elif target_type == "customer":
            # for customer feedback, we need the user id directly
            if not target_id:
                return jsonify({"error": "target_id is required for customer feedback"}), 400
            resolved_target_id = target_id

        # make sure we found someone to give feedback to
        if not resolved_target_id:
            return jsonify({"error": "Could not resolve target user"}), 400

        # set complaint status based on feedback type
        if feedback_type == "complaint":
            complaint_status = "Open"
        else:
            complaint_status = "N/A"

        # insert the feedback into database
        insert_query = """
            INSERT INTO feedback
                (feedback_from, feedback_for, feedback_type,
                 complaint_status, message, related_order)
            VALUES (%s, %s, %s, %s, %s, %s)
        """

        cursor.execute(
            insert_query,
            (
                feedback_from,
                resolved_target_id,
                feedback_type,
                complaint_status,
                message,
                order_id,
            ),
        )

        feedback_id = cursor.lastrowid
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify(
            {
                "message": "Feedback submitted successfully",
                "feedback_id": feedback_id,
            }
        ), 201

    except Exception as e:
        print("Submit feedback error:", e)
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400

@feedback_bp.route("/sent/<int:user_id>", methods=["GET"])
def get_sent_feedback(user_id):
    # get all feedback that this user has submitted to others
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        # get feedback sent by this user with target person's info
        query = """
            SELECT
                f.feedback_id,
                f.feedback_type,
                f.complaint_status,
                f.message,
                f.related_order,
                f.feedback_for,
                u.role AS target_role,
                u.name AS target_name,
                DATE(f.created_at) AS created_date
            FROM feedback f
            JOIN users u ON f.feedback_for = u.user_id
            WHERE f.feedback_from = %s
            ORDER BY f.created_at DESC
        """
        cursor.execute(query, (user_id,))
        rows = cursor.fetchall() or []

        # build result array by looping through each feedback
        result = []
        for row in rows:
            # format each feedback item
            feedback_item = {
                "id": row["feedback_id"],
                "type": row["feedback_type"],
                "status": (row["complaint_status"] or "N/A").lower(),
                "message": row["message"],
                "order_id": row["related_order"],
                "target_type": row["target_role"],
                "target_id": row["feedback_for"],
                "target_label": f"{row['target_role'].title()} - {row['target_name']}",
                "date": str(row["created_date"]),
            }
            result.append(feedback_item)

        cursor.close()
        conn.close()

        return jsonify(result), 200

    except Exception as e:
        print("Sent feedback error:", e)
        return jsonify({"error": str(e)}), 400

@feedback_bp.route("/received/<int:user_id>", methods=["GET"])
def get_received_feedback(user_id):
    # get all feedback that this user has received from others
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        # get feedback received by this user with sender's info
        query = """
            SELECT
                f.feedback_id,
                f.feedback_type,
                f.complaint_status,
                f.message,
                f.related_order,
                u.name AS from_name,
                DATE(f.created_at) AS created_date
            FROM feedback f
            JOIN users u ON f.feedback_from = u.user_id
            WHERE f.feedback_for = %s
            ORDER BY f.created_at DESC
        """
        cursor.execute(query, (user_id,))
        rows = cursor.fetchall() or []

        # loop through and format each feedback
        result = []
        for row in rows:
            feedback_item = {
                "id": row["feedback_id"],
                "type": row["feedback_type"],
                "status": (row["complaint_status"] or "N/A").lower(),
                "message": row["message"],
                "order_id": row["related_order"],
                "from_name": row["from_name"],
                "date": str(row["created_date"]),
            }
            result.append(feedback_item)

        cursor.close()
        conn.close()

        return jsonify(result), 200

    except Exception as e:
        print("Received feedback error:", e)
        return jsonify({"error": str(e)}), 400

@feedback_bp.route("/dispute/<int:feedback_id>", methods=["POST"])
def dispute_feedback(feedback_id):
    # someone disputes a complaint against them
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()
        
        # change complaint status to under review
        cursor.execute(
            "UPDATE feedback SET complaint_status = 'Under Review' WHERE feedback_id = %s",
            (feedback_id,),
        )

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Dispute submitted"}), 200

    except Exception as e:
        print("Dispute feedback error:", e)
        return jsonify({"error": str(e)}), 400
