from flask import Blueprint, request, jsonify
from db import get_db_connection

manager_bp = Blueprint('manager', __name__)


@manager_bp.route('/feedback', methods=['GET'])
def get_manager_feedback():
    """Get pending feedback for manager"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT f.*, 
               u1.name as from_name, 
               u2.name as target_name
        FROM feedback f
        JOIN users u1 ON f.feedback_from = u1.user_id
        JOIN users u2 ON f.feedback_for = u2.user_id
        WHERE f.complaint_status = 'Open'
        ORDER BY f.created_at DESC
        """
        cursor.execute(query)
        feedbacks = cursor.fetchall()
        
        for fb in feedbacks:
            fb['from'] = fb['from_name']
            fb['target'] = fb['target_name']
            fb['status'] = 'pending'
        
        cursor.close()
        conn.close()
        
        return jsonify(feedbacks), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@manager_bp.route('/feedback/<int:feedback_id>/approve', methods=['POST'])
def approve_feedback(feedback_id):
    """Manager approves feedback"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Update complaint status
        cursor.execute(
            "UPDATE feedback SET complaint_status = 'Resolved' WHERE feedback_id = %s",
            (feedback_id,)
        )
        
        # If it's a complaint, add warning to target user
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
        return jsonify({"error": str(e)}), 400


@manager_bp.route('/feedback/<int:feedback_id>/dismiss', methods=['POST'])
def dismiss_feedback(feedback_id):
    """Manager dismisses feedback"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE feedback SET complaint_status = 'Dismissed' WHERE feedback_id = %s",
            (feedback_id,)
        )
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Feedback dismissed"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400