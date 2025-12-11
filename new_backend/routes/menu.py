from flask import Blueprint, request, jsonify
from db import get_db_connection

menu_bp = Blueprint('menu', __name__)


@menu_bp.route('', methods=['GET'])
def get_menu():
    """Get all menu items"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor(dictionary=True)
        query = """
        SELECT m.*, c.category_type 
        FROM menu_items m
        JOIN category c ON m.category = c.category_id
        WHERE m.in_stock = TRUE
        """
        cursor.execute(query)
        items = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # Convert Decimal to float
        for item in items:
            item['price'] = float(item['price'])
        
        return jsonify(items), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@menu_bp.route('/<int:item_id>', methods=['GET'])
def get_menu_item(item_id):
    """Get specific menu item"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor(dictionary=True)
        query = """
        SELECT m.*, c.category_type 
        FROM menu_items m
        JOIN category c ON m.category = c.category_id
        WHERE m.item_id = %s
        """
        cursor.execute(query, (item_id,))
        item = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not item:
            return jsonify({"error": "Item not found"}), 404
        
        item['price'] = float(item['price'])
        return jsonify(item), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@menu_bp.route('', methods=['POST'])
def create_menu_item():
    """Create new menu item (chef/admin only)"""
    try:
        data = request.json
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        query = """
        INSERT INTO menu_items (name, description, price, category, is_time_limited, 
                               in_stock, image_url, created_by, updated_by, dietary_restrictions)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            data['name'],
            data.get('description', ''),
            data['price'],
            data['category_id'],
            data.get('is_time_limited', False),
            data.get('in_stock', True),
            data.get('image_url', ''),
            data['created_by'],
            data['created_by'],
            data.get('dietary_restrictions', False)
        ))
        
        conn.commit()
        item_id = cursor.lastrowid
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "message": "Menu item created",
            "item_id": item_id
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@menu_bp.route('/<int:item_id>', methods=['PUT'])
def update_menu_item(item_id):
    """Update menu item (chef/admin only)"""
    try:
        data = request.json
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Build dynamic update query
        update_fields = []
        update_values = []
        
        if 'name' in data:
            update_fields.append("name = %s")
            update_values.append(data['name'])
        if 'description' in data:
            update_fields.append("description = %s")
            update_values.append(data['description'])
        if 'price' in data:
            update_fields.append("price = %s")
            update_values.append(data['price'])
        if 'in_stock' in data:
            update_fields.append("in_stock = %s")
            update_values.append(data['in_stock'])
        if 'updated_by' in data:
            update_fields.append("updated_by = %s")
            update_values.append(data['updated_by'])
        
        if not update_fields:
            return jsonify({"error": "No fields to update"}), 400
        
        query = f"UPDATE menu_items SET {', '.join(update_fields)} WHERE item_id = %s"
        update_values.append(item_id)
        
        cursor.execute(query, update_values)
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Menu item updated"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400