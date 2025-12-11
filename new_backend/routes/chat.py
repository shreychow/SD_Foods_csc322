# routes/chat.py
from flask import Blueprint, request, jsonify
from db import get_db_connection
from datetime import datetime
import requests
import os
import requests

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
chat_bp = Blueprint('chat', __name__)


def search_knowledge_base(query):
    """Search knowledge base for relevant answers"""
    try:
        conn = get_db_connection()
        if not conn:
            return None

        cursor = conn.cursor(dictionary=True)

        query_clean = query.lower().strip()

        # Exact-ish match first
        cursor.execute("""
            SELECT kb_id, question, answer, category, avg_rating
            FROM knowledge_base
            WHERE is_active = TRUE 
              AND is_approved = TRUE
              AND LOWER(question) LIKE %s
            ORDER BY avg_rating DESC
            LIMIT 1
        """, (f"%{query_clean}%",))

        result = cursor.fetchone()

        # Keyword fallback
        if not result:
            keywords = query_clean.split()
            if keywords:
                cursor.execute("""
                    SELECT kb_id, question, answer, category, avg_rating
                    FROM knowledge_base
                    WHERE is_active = TRUE 
                      AND is_approved = TRUE
                      AND (LOWER(question) LIKE %s OR LOWER(answer) LIKE %s)
                    ORDER BY avg_rating DESC
                    LIMIT 1
                """, (f"%{keywords[0]}%", f"%{keywords[0]}%"))
                result = cursor.fetchone()

        cursor.close()
        conn.close()
        return result

    except Exception as e:
        print(f"Knowledge base search error: {e}")
        return None




def query_llm(question):
    """Query LLM (Ollama) for answer"""
    try:
        url = f"{OLLAMA_URL}/api/generate"

        prompt = f"""You are a helpful restaurant assistant for SD Foods.
Answer the following question concisely and professionally.

Question: {question}

Answer:"""

        payload = {
            "model": "phi",   # make sure this model exists in Ollama
            "prompt": prompt,
            "stream": False,
        }

        print(f"🔄 Querying Ollama at {url} with: {question[:50]}...")
        response = requests.post(url, json=payload, timeout=100000)
        print(f"✅ Ollama status: {response.status_code}")

        # Non-200 from Ollama → return friendly message
        if response.status_code != 200:
            print("❌ Bad status from Ollama:", response.status_code, response.text[:200])
            return (
                "I’m having trouble contacting the AI service right now. "
                "Please try again later or ask a simpler question."
            )

        # Try to parse JSON safely
        try:
            data = response.json()
        except Exception as e:
            print("⚠️ Failed to parse Ollama JSON:", e, "Raw:", response.text[:200])
            return (
                "I received an unexpected response from the AI service. "
                "Please try again later."
            )

        answer = (data.get("response") or "").strip()
        if answer:
            print(f"📝 LLM answer length: {len(answer)}")
            return answer

        print("⚠️ Empty answer from Ollama JSON:", data)
        return (
            "I’m not sure how to answer that right now. "
            "Please try rephrasing your question or contact the restaurant directly."
        )

    except requests.exceptions.Timeout:
        print("⏰ Ollama request timed out")
        return (
            "I’m taking too long to respond. Please try a shorter question or try again later."
        )
    except requests.exceptions.ConnectionError as e:
        print(f"🔌 Cannot connect to Ollama: {e}")
        return (
            "I can’t reach the AI service at the moment. "
            "Please make sure Ollama is running and try again."
        )
    except Exception as e:
        print(f"💥 Unexpected error in query_llm: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return (
            "I encountered an internal error while generating an answer. "
            "Please try again later."
        )



def save_chat_history(user_id, session_id, message, response_text, source, kb_id=None):
    """
    Best-effort save to chat_history.
    If this fails for any reason, we log it but DO NOT break the /chat/ask route.
    Returns chat_id or None.
    """
    try:
        conn = get_db_connection()
        if not conn:
            print("⚠️ Could not connect to DB to save chat history.")
            return None

        cursor = conn.cursor()

        if kb_id is not None:
            cursor.execute(
                """
                INSERT INTO chat_history (user_id, session_id, message, response, source, kb_id)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (user_id, session_id, message, response_text, source, kb_id),
            )
        else:
            cursor.execute(
                """
                INSERT INTO chat_history (user_id, session_id, message, response, source)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (user_id, session_id, message, response_text, source),
            )

        chat_id = cursor.lastrowid
        conn.commit()
        cursor.close()
        conn.close()
        return chat_id

    except Exception as e:
        print(f"⚠️ Failed to save chat history: {e}")
        # DO NOT raise – just return None
        return None


@chat_bp.route("/ask", methods=["POST"])
def ask_question():
    """Main chat endpoint - searches KB first, then uses LLM"""
    try:
        data = request.json or {}
        message = (data.get("message") or "").strip()
        user_id = data.get("user_id")
        session_id = data.get("session_id") or datetime.now().strftime("%Y%m%d%H%M%S")

        if not message:
            return jsonify({"error": "Message cannot be empty"}), 400

        print("\n" + "=" * 60)
        print(f"📩 New question: {message}")
        print(f"👤 User ID: {user_id}")
        print("=" * 60 + "\n")

        # 1) Try knowledge base
        print("🔍 Searching knowledge base...")
        kb_result = search_knowledge_base(message)

        if kb_result:
            print("✅ Found KB answer")
            response_text = kb_result["answer"]
            source = "knowledge_base"
            kb_id = kb_result["kb_id"]

            chat_id = save_chat_history(
                user_id=user_id,
                session_id=session_id,
                message=message,
                response_text=response_text,
                source=source,
                kb_id=kb_id,
            )

            # If we couldn't save history, we still return the answer
            needs_rating = chat_id is not None

            return jsonify(
                {
                    "response": response_text,
                    "source": source,
                    "chat_id": chat_id,
                    "kb_id": kb_id,
                    "category": kb_result.get("category"),
                    "needs_rating": needs_rating,
                }
            ), 200

        # 2) Fallback to LLM
        print("❌ Not in KB, querying LLM...")
        response_text = query_llm(message)
        source = "llm"

        chat_id = save_chat_history(
            user_id=user_id,
            session_id=session_id,
            message=message,
            response_text=response_text,
            source=source,
            kb_id=None,
        )

        # LLM answers don't need rating according to your spec
        return jsonify(
            {
                "response": response_text,
                "source": source,
                "chat_id": chat_id,
                "needs_rating": False,
            }
        ), 200

    except Exception as e:
        print(f"💥 Chat /ask error: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": "Internal chat error"}), 400


@chat_bp.route("/rate", methods=["POST"])
def rate_response():
    """Rate a chat response (only for KB answers)"""
    try:
        data = request.json or {}
        chat_id = data.get("chat_id")
        rating = data.get("rating")
        user_id = data.get("user_id")
        feedback = data.get("feedback", "")

        if not chat_id or rating is None:
            return jsonify({"error": "chat_id and rating required"}), 400

        rating = int(rating)
        if rating < 0 or rating > 5:
            return jsonify({"error": "Rating must be between 0 and 5"}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        # Make sure the chat exists
        cursor.execute(
            "SELECT kb_id, source FROM chat_history WHERE chat_id = %s",
            (chat_id,),
        )
        chat = cursor.fetchone()
        if not chat:
            return jsonify({"error": "Chat not found"}), 404

        is_flagged = rating == 0

        cursor.execute(
            """
            INSERT INTO chat_ratings (chat_id, user_id, rating, feedback, is_flagged)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (chat_id, user_id, rating, feedback, is_flagged),
        )
        rating_id = cursor.lastrowid

        # Update KB stats if this was a KB answer
        if chat["kb_id"]:
            cursor.execute(
                """
                UPDATE knowledge_base kb
                SET 
                    avg_rating = (
                        SELECT AVG(cr.rating)
                        FROM chat_ratings cr
                        JOIN chat_history ch ON cr.chat_id = ch.chat_id
                        WHERE ch.kb_id = kb.kb_id
                    ),
                    total_ratings = (
                        SELECT COUNT(*)
                        FROM chat_ratings cr
                        JOIN chat_history ch ON cr.chat_id = ch.chat_id
                        WHERE ch.kb_id = kb.kb_id
                    )
                WHERE kb_id = %s
                """,
                (chat["kb_id"],),
            )

        conn.commit()
        cursor.close()
        conn.close()

        msg = "Thank you for your feedback!"
        if is_flagged:
            msg = (
                "Your feedback has been flagged for manager review. "
                "Thank you for helping us improve!"
            )

        return jsonify(
            {
                "message": msg,
                "rating_id": rating_id,
                "is_flagged": is_flagged,
            }
        ), 200

    except Exception as e:
        print(f"Rating error: {e}")
        return jsonify({"error": "Failed to submit rating"}), 400


# The rest of your knowledge add / history / flagged / review routes
# can stay exactly as you had them – they are not the ones causing
# the "Sorry, I encountered an error" during normal chatting.

    
    # from flask import Blueprint, request, jsonify
# from db import get_db_connection

# chat_bp = Blueprint('chat', __name__)


# @chat_bp.route('/', methods=['POST'])
# def chat():
#     """AI Assistant chat endpoint"""
#     try:
#         data = request.json
#         message = data['message'].lower()
        
#         # Simple rule-based responses (you can integrate with OpenAI API here)
#         response = ""
#         from_knowledge_base = False
        
#         if 'menu' in message or 'food' in message or 'dish' in message:
#             conn = get_db_connection()
#             if conn:
#                 cursor = conn.cursor(dictionary=True)
#                 cursor.execute("SELECT name, price FROM menu_items WHERE in_stock = TRUE LIMIT 5")
#                 items = cursor.fetchall()
#                 cursor.close()
#                 conn.close()
                
#                 response = "Here are some popular items from our menu:\n\n"
#                 for item in items:
#                     response += f"• {item['name']} - ${float(item['price']):.2f}\n"
#                 response += "\nWould you like to know more about any specific dish?"
#                 from_knowledge_base = True
        
#         elif 'hours' in message or 'open' in message or 'time' in message:
#             response = "We're open daily from 11:00 AM to 10:00 PM. We deliver until 9:30 PM!"
#             from_knowledge_base = True
        
#         elif 'delivery' in message:
#             response = "We offer delivery within a 5-mile radius. Delivery typically takes 30-45 minutes. Delivery fee is $3.99."
#             from_knowledge_base = True
        
#         elif 'order' in message:
#             if data.get('customer_id'):
#                 response = "You can browse our menu and add items to your cart. Once you're ready, proceed to checkout!"
#             else:
#                 response = "To place an order, please login or register first. You can browse our menu as a guest!"
        
#         else:
#             response = "I'm your AI assistant! I can help you with:\n• Menu information\n• Delivery details\n• Restaurant hours\n• Placing orders\n\nWhat would you like to know?"
        
#         return jsonify({
#             "response": response,
#             "from_knowledge_base": from_knowledge_base,
#             "message_id": 1
#         }), 200
        
#     except Exception as e:
#         return jsonify({"error": str(e)}), 400


# @chat_bp.route('/rate', methods=['POST'])
# def rate_chat():
#     """Rate chat response"""
#     try:
#         # In a real system, store ratings for improving AI
#         return jsonify({"message": "Thank you for your feedback!"}), 200
#     except Exception as e:
#         return jsonify({"error": str(e)}), 400