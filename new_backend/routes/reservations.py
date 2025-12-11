from flask import Blueprint, request, jsonify
from db import get_db_connection

reservations_bp = Blueprint('reservations', __name__)


@reservations_bp.route('/', methods=['POST'])
def create_reservation():
    """Create new reservation"""
    try:
        data = request.json
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Check if table is available
        cursor.execute(
            "SELECT is_available FROM restaurant_tables WHERE table_id = %s",
            (data['table_id'],)
        )
        result = cursor.fetchone()
        
        if not result or not result[0]:
            return jsonify({"error": "Table not available"}), 400
        
        query = """
        INSERT INTO reservations (customer_id, table_id, reservation_date, reservation_time,
                                 duration, reservation_status, number_of_guest, special_request)
        VALUES (%s, %s, %s, %s, %s, 'Pending', %s, %s)
        """
        
        cursor.execute(query, (
            data['customer_id'],
            data['table_id'],
            data['reservation_date'],
            data['reservation_time'],
            data.get('duration', 90),
            data['number_of_guests'],
            data.get('special_request', '')
        ))
        
        reservation_id = cursor.lastrowid
        
        # Mark table as unavailable
        cursor.execute(
            "UPDATE restaurant_tables SET is_available = FALSE WHERE table_id = %s",
            (data['table_id'],)
        )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            "message": "Reservation created",
            "reservation_id": reservation_id
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@reservations_bp.route('/', methods=['GET'])
def get_reservations():
    """Get reservations (can filter by customer_id)"""
    try:
        customer_id = request.args.get('customer_id')
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        if customer_id:
            query = """
            SELECT r.*, rt.table_number, rt.seating_capacity
            FROM reservations r
            JOIN restaurant_tables rt ON r.table_id = rt.table_id
            WHERE r.customer_id = %s
            ORDER BY r.reservation_date DESC, r.reservation_time DESC
            """
            cursor.execute(query, (customer_id,))
        else:
            query = """
            SELECT r.*, rt.table_number, rt.seating_capacity, u.name as customer_name
            FROM reservations r
            JOIN restaurant_tables rt ON r.table_id = rt.table_id
            JOIN users u ON r.customer_id = u.user_id
            ORDER BY r.reservation_date DESC, r.reservation_time DESC
            """
            cursor.execute(query)
        
        reservations = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(reservations), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400