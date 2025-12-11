from flask import Blueprint, request, jsonify
from db import get_db_connection

feedback_bp = Blueprint('feedback', __name__)


@feedback_bp.route('/submit', methods=['POST'])
def submit_feedback():
    """Submit feedback (complaint or compliment)"""
    try:
        data = request.json
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        query = """
        INSERT INTO feedback (feedback_from, feedback_for, feedback_type, 
                             complaint_status, message, related_order)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        
        complaint_status = 'Open' if data['type'] == 'complaint' else 'N/A'
        
        cursor.execute(query, (
            data['customer_id'],
            data['target_id'],
            data['type'],
            complaint_status,
            data['message'],
            data.get('order_id')
        ))
        
        feedback_id = cursor.lastrowid
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            "message": "Feedback submitted",
            "feedback_id": feedback_id
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@feedback_bp.route('/dispute/<int:feedback_id>', methods=['POST'])
def dispute_feedback(feedback_id):
    """Dispute a complaint"""
    try:
        data = request.json
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        query = "UPDATE feedback SET complaint_status = 'Under Review' WHERE feedback_id = %s"
        cursor.execute(query, (feedback_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Dispute submitted"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400