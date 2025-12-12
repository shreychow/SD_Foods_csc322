
from flask import Blueprint, request, jsonify
from db import get_db_connection

menu_bp = Blueprint('menu', __name__)


@menu_bp.route('', methods=['GET'])
def get_menu():
    """Get all menu items"""
    conn = None
    cursor = None
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
        
        # Convert price from Decimal to float for each item
        result = []
        for item in items:
            item_dict = {}
            item_dict['item_id'] = item['item_id']
            item_dict['name'] = item['name']
            item_dict['description'] = item['description']
            item_dict['price'] = float(item['price'])
            item_dict['category'] = item['category']
            item_dict['category_type'] = item['category_type']
            item_dict['is_time_limited'] = item['is_time_limited']
            item_dict['in_stock'] = item['in_stock']
            item_dict['image_url'] = item['image_url']
            item_dict['created_by'] = item['created_by']
            item_dict['updated_by'] = item['updated_by']
            item_dict['dietary_restrictions'] = item['dietary_restrictions']
            result.append(item_dict)
        
        return jsonify(result), 200
        
    except Exception as e:
        print("Error getting menu:", e)
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 400


@menu_bp.route('/<int:item_id>', methods=['GET'])
def get_menu_item(item_id):
    """Get specific menu item"""
    conn = None
    cursor = None
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
        
        # Convert price to float
        item_dict = {}
        item_dict['item_id'] = item['item_id']
        item_dict['name'] = item['name']
        item_dict['description'] = item['description']
        item_dict['price'] = float(item['price'])
        item_dict['category'] = item['category']
        item_dict['category_type'] = item['category_type']
        item_dict['is_time_limited'] = item['is_time_limited']
        item_dict['in_stock'] = item['in_stock']
        item_dict['image_url'] = item['image_url']
        item_dict['created_by'] = item['created_by']
        item_dict['updated_by'] = item['updated_by']
        item_dict['dietary_restrictions'] = item['dietary_restrictions']
        
        return jsonify(item_dict), 200
        
    except Exception as e:
        print("Error getting menu item:", e)
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 400


@menu_bp.route('', methods=['POST'])
def create_menu_item():
    """Create new menu item"""
    conn = None
    cursor = None
    try:
        data = request.json
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Get values from data
        name = data['name']
        description = data.get('description', '')
        price = data['price']
        category_id = data['category_id']
        is_time_limited = data.get('is_time_limited', False)
        in_stock = data.get('in_stock', True)
        image_url = data.get('image_url', '')
        created_by = data['created_by']
        updated_by = data['created_by']
        dietary_restrictions = data.get('dietary_restrictions', False)
        
        query = """
        INSERT INTO menu_items (name, description, price, category, is_time_limited, 
                               in_stock, image_url, created_by, updated_by, dietary_restrictions)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            name,
            description,
            price,
            category_id,
            is_time_limited,
            in_stock,
            image_url,
            created_by,
            updated_by,
            dietary_restrictions
        ))
        
        conn.commit()
        item_id = cursor.lastrowid
        
        cursor.close()
        conn.close()
        
        response = {
            "message": "Menu item created",
            "item_id": item_id
        }
        return jsonify(response), 201
        
    except Exception as e:
        print("Error creating menu item:", e)
        if conn:
            conn.rollback()
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 400


@menu_bp.route('/<int:item_id>', methods=['PUT'])
def update_menu_item(item_id):
    """Update menu item"""
    conn = None
    cursor = None
    try:
        data = request.json
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Build update query based on what fields are provided
        update_fields = []
        update_values = []
        
        # Check each field and add to update if present
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
        
        # Make sure we have something to update
        if len(update_fields) == 0:
            return jsonify({"error": "No fields to update"}), 400
        
        # Build the query string
        query = "UPDATE menu_items SET "
        
        # Add all the fields
        for i in range(len(update_fields)):
            query = query + update_fields[i]
            if i < len(update_fields) - 1:
                query = query + ", "
        
        query = query + " WHERE item_id = %s"
        
        # Add item_id to values
        update_values.append(item_id)
        
        cursor.execute(query, update_values)
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Menu item updated"}), 200
        
    except Exception as e:
        print("Error updating menu item:", e)
        if conn:
            conn.rollback()
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 400


@menu_bp.route('/<int:item_id>', methods=['DELETE'])
def delete_menu_item(item_id):
    """Delete menu item or mark as out of stock"""
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Just mark as out of stock instead of deleting
        query = "UPDATE menu_items SET in_stock = FALSE WHERE item_id = %s"
        cursor.execute(query, (item_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"message": "Menu item removed from stock"}), 200
        
    except Exception as e:
        print("Error deleting menu item:", e)
        if conn:
            conn.rollback()
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        return jsonify({"error": str(e)}), 400
