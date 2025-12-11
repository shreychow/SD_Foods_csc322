from flask import Blueprint, request, jsonify
from db import get_db_connection

chat_bp = Blueprint('chat', __name__)


@chat_bp.route('/', methods=['POST'])
def chat():
    """AI Assistant chat endpoint"""
    try:
        data = request.json
        message = data['message'].lower()
        
        # Simple rule-based responses (you can integrate with OpenAI API here)
        response = ""
        from_knowledge_base = False
        
        if 'menu' in message or 'food' in message or 'dish' in message:
            conn = get_db_connection()
            if conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute("SELECT name, price FROM menu_items WHERE in_stock = TRUE LIMIT 5")
                items = cursor.fetchall()
                cursor.close()
                conn.close()
                
                response = "Here are some popular items from our menu:\n\n"
                for item in items:
                    response += f"• {item['name']} - ${float(item['price']):.2f}\n"
                response += "\nWould you like to know more about any specific dish?"
                from_knowledge_base = True
        
        elif 'hours' in message or 'open' in message or 'time' in message:
            response = "We're open daily from 11:00 AM to 10:00 PM. We deliver until 9:30 PM!"
            from_knowledge_base = True
        
        elif 'delivery' in message:
            response = "We offer delivery within a 5-mile radius. Delivery typically takes 30-45 minutes. Delivery fee is $3.99."
            from_knowledge_base = True
        
        elif 'order' in message:
            if data.get('customer_id'):
                response = "You can browse our menu and add items to your cart. Once you're ready, proceed to checkout!"
            else:
                response = "To place an order, please login or register first. You can browse our menu as a guest!"
        
        else:
            response = "I'm your AI assistant! I can help you with:\n• Menu information\n• Delivery details\n• Restaurant hours\n• Placing orders\n\nWhat would you like to know?"
        
        return jsonify({
            "response": response,
            "from_knowledge_base": from_knowledge_base,
            "message_id": 1
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@chat_bp.route('/rate', methods=['POST'])
def rate_chat():
    """Rate chat response"""
    try:
        # In a real system, store ratings for improving AI
        return jsonify({"message": "Thank you for your feedback!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400