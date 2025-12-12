# # routes/chat.py
# from flask import Blueprint, request, jsonify
# from db import get_db_connection
# from datetime import datetime
# import requests

# chat_bp = Blueprint('chat', __name__)


# def search_knowledge_base(query):
#     """Search knowledge base for relevant answers"""
#     try:
#         conn = get_db_connection()
#         if not conn:
#             return None

#         cursor = conn.cursor(dictionary=True)
#         query_clean = query.lower().strip()

#         # Try exact match first
#         cursor.execute("""
#             SELECT kb_id, question, answer, category, avg_rating
#             FROM knowledge_base
#             WHERE is_active = TRUE 
#               AND is_approved = TRUE
#               AND LOWER(question) LIKE %s
#             ORDER BY avg_rating DESC
#             LIMIT 1
#         """, (f"%{query_clean}%",))

#         result = cursor.fetchone()

#         # Keyword fallback
#         if not result:
#             keywords = query_clean.split()
#             if keywords:
#                 cursor.execute("""
#                     SELECT kb_id, question, answer, category, avg_rating
#                     FROM knowledge_base
#                     WHERE is_active = TRUE 
#                       AND is_approved = TRUE
#                       AND (LOWER(question) LIKE %s OR LOWER(answer) LIKE %s)
#                     ORDER BY avg_rating DESC
#                     LIMIT 1
#                 """, (f"%{keywords[0]}%", f"%{keywords[0]}%"))
#                 result = cursor.fetchone()

#         cursor.close()
#         conn.close()
#         return result

#     except Exception as e:
#         print(f"Knowledge base search error: {e}")
#         return None


# def query_llm(question):
#     """Query LLM (Ollama) for answer"""
#     try:
#         url = "http://localhost:11434/api/generate"

#         prompt = f"""You are a helpful restaurant assistant for SD Foods.
# Answer the following question concisely and professionally.

# Question: {question}

# Answer:"""

#         payload = {
#             "model": "phi",
#             "prompt": prompt,
#             "stream": False,
#         }

#         response = requests.post(url, json=payload, timeout=120)

#         if response.status_code == 200:
#             data = response.json()
#             answer = (data.get("response") or "").strip()
#             if answer:
#                 return answer

#         return "I'm having trouble answering that right now. Please try again later."

#     except requests.exceptions.Timeout:
#         return "I'm taking too long to respond. Please try a simpler question."
#     except requests.exceptions.ConnectionError:
#         return "I can't reach the AI service. Please make sure Ollama is running."
#     except Exception as e:
#         print(f"LLM error: {e}")
#         return "I encountered an error. Please try again later."


# @chat_bp.route("/ask", methods=["POST"])
# def ask_question():
#     """Main chat endpoint - searches KB first, then uses LLM"""
#     try:
#         data = request.json or {}
#         message = (data.get("message") or "").strip()
#         user_id = data.get("user_id")
#         session_id = data.get("session_id") or datetime.now().strftime("%Y%m%d%H%M%S")

#         if not message:
#             return jsonify({"error": "Message cannot be empty"}), 400

#         # Try knowledge base
#         kb_result = search_knowledge_base(message)

#         if kb_result:
#             response_text = kb_result["answer"]
#             source = "knowledge_base"
#             kb_id = kb_result["kb_id"]

#             # Save chat history
#             conn = get_db_connection()
#             chat_id = None
#             if conn:
#                 try:
#                     cursor = conn.cursor()
#                     cursor.execute("""
#                         INSERT INTO chat_history (user_id, session_id, message, response, source, kb_id)
#                         VALUES (%s, %s, %s, %s, %s, %s)
#                     """, (user_id, session_id, message, response_text, source, kb_id))
#                     chat_id = cursor.lastrowid
#                     conn.commit()
#                     cursor.close()
#                     conn.close()
#                 except Exception as e:
#                     print(f"Error saving chat history: {e}")

#             return jsonify({
#                 "response": response_text,
#                 "source": source,
#                 "chat_id": chat_id,
#                 "kb_id": kb_id,
#                 "category": kb_result.get("category"),
#                 "needs_rating": True
#             }), 200

#         else:
#             # Fallback to LLM
#             response_text = query_llm(message)
#             source = "llm"

#             # Save chat history
#             conn = get_db_connection()
#             chat_id = None
#             if conn:
#                 try:
#                     cursor = conn.cursor()
#                     cursor.execute("""
#                         INSERT INTO chat_history (user_id, session_id, message, response, source)
#                         VALUES (%s, %s, %s, %s, %s)
#                     """, (user_id, session_id, message, response_text, source))
#                     chat_id = cursor.lastrowid
#                     conn.commit()
#                     cursor.close()
#                     conn.close()
#                 except Exception as e:
#                     print(f"Error saving chat history: {e}")

#             return jsonify({
#                 "response": response_text,
#                 "source": source,
#                 "chat_id": chat_id,
#                 "needs_rating": False
#             }), 200

#     except Exception as e:
#         print(f"Chat error: {e}")
#         import traceback
#         traceback.print_exc()
#         return jsonify({"error": str(e)}), 400


# @chat_bp.route("/rate", methods=["POST"])
# def rate_response():
#     """Rate a chat response (only for KB answers)"""
#     try:
#         data = request.json or {}
#         chat_id = data.get("chat_id")
#         rating = data.get("rating")
#         user_id = data.get("user_id")
#         feedback = data.get("feedback", "")

#         if not chat_id or rating is None:
#             return jsonify({"error": "chat_id and rating required"}), 400

#         rating = int(rating)
#         if rating < 0 or rating > 5:
#             return jsonify({"error": "Rating must be between 0 and 5"}), 400

#         conn = get_db_connection()
#         if not conn:
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor(dictionary=True)

#         # Get chat details
#         cursor.execute(
#             "SELECT kb_id, source FROM chat_history WHERE chat_id = %s",
#             (chat_id,),
#         )
#         chat = cursor.fetchone()
#         if not chat:
#             cursor.close()
#             conn.close()
#             return jsonify({"error": "Chat not found"}), 404

#         is_flagged = (rating == 0)

#         cursor.execute("""
#             INSERT INTO chat_ratings (chat_id, user_id, rating, feedback, is_flagged)
#             VALUES (%s, %s, %s, %s, %s)
#         """, (chat_id, user_id, rating, feedback, is_flagged))
#         rating_id = cursor.lastrowid

#         # Update KB stats if this was a KB answer
#         if chat["kb_id"]:
#             cursor.execute("""
#                 UPDATE knowledge_base kb
#                 SET 
#                     avg_rating = (
#                         SELECT AVG(cr.rating)
#                         FROM chat_ratings cr
#                         JOIN chat_history ch ON cr.chat_id = ch.chat_id
#                         WHERE ch.kb_id = kb.kb_id
#                     ),
#                     total_ratings = (
#                         SELECT COUNT(*)
#                         FROM chat_ratings cr
#                         JOIN chat_history ch ON cr.chat_id = ch.chat_id
#                         WHERE ch.kb_id = kb.kb_id
#                     )
#                 WHERE kb_id = %s
#             """, (chat["kb_id"],))

#         conn.commit()
#         cursor.close()
#         conn.close()

#         msg = "Thank you for your feedback!"
#         if is_flagged:
#             msg = "Your feedback has been flagged for manager review. Thank you for helping us improve!"

#         return jsonify({
#             "message": msg,
#             "rating_id": rating_id,
#             "is_flagged": is_flagged,
#         }), 200

#     except Exception as e:
#         print(f"Rating error: {e}")
#         import traceback
#         traceback.print_exc()
#         return jsonify({"error": str(e)}), 400


# @chat_bp.route("/knowledge/add", methods=["POST"])
# def add_knowledge():
#     """Add new knowledge to the knowledge base"""
#     try:
#         data = request.json or {}
#         question = (data.get("question") or "").strip()
#         answer = (data.get("answer") or "").strip()
#         category = data.get("category", "General")
#         created_by = data.get("user_id")

#         print(f"\n{'='*60}")
#         print(f"📝 Add Knowledge Request")
#         print(f"Question: {question}")
#         print(f"Answer: {answer[:50]}...")
#         print(f"Category: {category}")
#         print(f"User ID: {created_by}")
#         print(f"{'='*60}\n")

#         if not question or not answer:
#             return jsonify({"error": "Question and answer are required"}), 400

#         if not created_by:
#             return jsonify({"error": "User ID is required"}), 400

#         conn = get_db_connection()
#         if not conn:
#             print("❌ Database connection failed")
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor(dictionary=True)

#         # Check user role
#         cursor.execute("SELECT role FROM users WHERE user_id = %s", (created_by,))
#         user = cursor.fetchone()

#         if not user:
#             cursor.close()
#             conn.close()
#             print(f"❌ User not found: {created_by}")
#             return jsonify({"error": "User not found"}), 404

#         print(f"✅ User found: {user['role']}")

#         # Auto-approve for employees
#         is_approved = user['role'] in ['chef', 'driver', 'delivery', 'manager', 'admin']
#         print(f"📋 Auto-approve: {is_approved}")

#         cursor.execute("""
#             INSERT INTO knowledge_base (question, answer, category, created_by, is_approved)
#             VALUES (%s, %s, %s, %s, %s)
#         """, (question, answer, category, created_by, is_approved))

#         kb_id = cursor.lastrowid
#         conn.commit()
#         cursor.close()
#         conn.close()

#         print(f"✅ Knowledge added with ID: {kb_id}")

#         message = "Knowledge added successfully!"
#         if not is_approved:
#             message = "Knowledge submitted for manager approval!"

#         return jsonify({
#             "message": message,
#             "kb_id": kb_id,
#             "is_approved": is_approved
#         }), 201

#     except Exception as e:
#         print(f"💥 Add knowledge error: {e}")
#         import traceback
#         traceback.print_exc()
#         return jsonify({"error": str(e)}), 400


# @chat_bp.route("/history", methods=["GET"])
# def get_chat_history():
#     """Get chat history for a user"""
#     try:
#         user_id = request.args.get("user_id")
#         limit = int(request.args.get("limit", 20))

#         conn = get_db_connection()
#         if not conn:
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor(dictionary=True)

#         if user_id:
#             cursor.execute("""
#                 SELECT chat_id, message, response, source, created_at
#                 FROM chat_history
#                 WHERE user_id = %s
#                 ORDER BY created_at DESC
#                 LIMIT %s
#             """, (user_id, limit))
#         else:
#             cursor.execute("""
#                 SELECT chat_id, message, response, source, created_at
#                 FROM chat_history
#                 ORDER BY created_at DESC
#                 LIMIT %s
#             """, (limit,))

#         history = cursor.fetchall()
#         cursor.close()
#         conn.close()

#         return jsonify(history), 200

#     except Exception as e:
#         print(f"History error: {e}")
#         return jsonify({"error": str(e)}), 400


# @chat_bp.route("/knowledge/flagged", methods=["GET"])
# def get_flagged_knowledge():
#     """Get flagged knowledge for manager review"""
#     try:
#         conn = get_db_connection()
#         if not conn:
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor(dictionary=True)

#         cursor.execute("""
#             SELECT 
#                 cr.rating_id,
#                 cr.chat_id,
#                 cr.rating,
#                 cr.feedback,
#                 cr.review_status,
#                 cr.created_at,
#                 ch.message as question,
#                 ch.response as answer,
#                 kb.kb_id,
#                 kb.question as kb_question,
#                 kb.created_by,
#                 u.name as author_name
#             FROM chat_ratings cr
#             JOIN chat_history ch ON cr.chat_id = ch.chat_id
#             LEFT JOIN knowledge_base kb ON ch.kb_id = kb.kb_id
#             LEFT JOIN users u ON kb.created_by = u.user_id
#             WHERE cr.is_flagged = TRUE AND cr.review_status = 'pending'
#             ORDER BY cr.created_at DESC
#         """)

#         flagged = cursor.fetchall()
#         cursor.close()
#         conn.close()

#         return jsonify(flagged), 200

#     except Exception as e:
#         print(f"Flagged knowledge error: {e}")
#         return jsonify({"error": str(e)}), 400


# @chat_bp.route("/knowledge/review/<int:rating_id>", methods=["POST"])
# def review_flagged_knowledge(rating_id):
#     """Manager reviews flagged knowledge"""
#     try:
#         data = request.json or {}
#         action = data.get("action")
#         manager_id = data.get("manager_id")

#         if action not in ["remove", "keep"]:
#             return jsonify({"error": "Action must be 'remove' or 'keep'"}), 400

#         conn = get_db_connection()
#         if not conn:
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor(dictionary=True)

#         # Get rating details
#         cursor.execute("""
#             SELECT cr.chat_id, ch.kb_id, kb.created_by
#             FROM chat_ratings cr
#             JOIN chat_history ch ON cr.chat_id = ch.chat_id
#             LEFT JOIN knowledge_base kb ON ch.kb_id = kb.kb_id
#             WHERE cr.rating_id = %s
#         """, (rating_id,))

#         rating_data = cursor.fetchone()

#         if not rating_data:
#             cursor.close()
#             conn.close()
#             return jsonify({"error": "Rating not found"}), 404

#         if action == "remove":
#             if rating_data["kb_id"]:
#                 cursor.execute("""
#                     UPDATE knowledge_base 
#                     SET is_active = FALSE 
#                     WHERE kb_id = %s
#                 """, (rating_data["kb_id"],))

#                 if rating_data["created_by"]:
#                     cursor.execute("""
#                         UPDATE users 
#                         SET amount_warnings = amount_warnings + 1 
#                         WHERE user_id = %s
#                     """, (rating_data["created_by"],))

#             review_status = "approved"
#         else:
#             review_status = "rejected"

#         cursor.execute("""
#             UPDATE chat_ratings 
#             SET review_status = %s, reviewed_by = %s 
#             WHERE rating_id = %s
#         """, (review_status, manager_id, rating_id))

#         conn.commit()
#         cursor.close()
#         conn.close()

#         return jsonify({
#             "message": f"Knowledge {'removed' if action == 'remove' else 'kept'} successfully"
#         }), 200

#     except Exception as e:
#         print(f"Review knowledge error: {e}")
#         return jsonify({"error": str(e)}), 400

# # Add these endpoints to your chat.py file (after the existing routes)

# @chat_bp.route("/knowledge/pending", methods=["GET"])
# def get_pending_knowledge():
#     """Get knowledge base entries awaiting manager approval"""
#     try:
#         conn = get_db_connection()
#         if not conn:
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor(dictionary=True)

#         cursor.execute("""
#             SELECT 
#                 kb.kb_id,
#                 kb.question,
#                 kb.answer,
#                 kb.category,
#                 kb.created_at,
#                 u.name as author_name,
#                 u.user_id as created_by
#             FROM knowledge_base kb
#             JOIN users u ON kb.created_by = u.user_id
#             WHERE kb.is_approved = FALSE AND kb.is_active = TRUE
#             ORDER BY kb.created_at DESC
#         """)

#         pending = cursor.fetchall()
#         cursor.close()
#         conn.close()

#         return jsonify(pending), 200

#     except Exception as e:
#         print(f"Pending knowledge error: {e}")
#         return jsonify({"error": str(e)}), 400


# @chat_bp.route("/knowledge/approve/<int:kb_id>", methods=["POST"])
# def approve_knowledge(kb_id):
#     """Manager approves pending knowledge"""
#     try:
#         conn = get_db_connection()
#         if not conn:
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor()

#         cursor.execute("""
#             UPDATE knowledge_base 
#             SET is_approved = TRUE 
#             WHERE kb_id = %s
#         """, (kb_id,))

#         conn.commit()
#         cursor.close()
#         conn.close()

#         return jsonify({"message": "Knowledge approved successfully"}), 200

#     except Exception as e:
#         print(f"Approve knowledge error: {e}")
#         return jsonify({"error": str(e)}), 400


# @chat_bp.route("/knowledge/reject/<int:kb_id>", methods=["POST"])
# def reject_knowledge(kb_id):
#     """Manager rejects pending knowledge"""
#     try:
#         conn = get_db_connection()
#         if not conn:
#             return jsonify({"error": "Database connection failed"}), 500

#         cursor = conn.cursor()

#         # Deactivate the knowledge entry
#         cursor.execute("""
#             UPDATE knowledge_base 
#             SET is_active = FALSE 
#             WHERE kb_id = %s
#         """, (kb_id,))

#         conn.commit()
#         cursor.close()
#         conn.close()

#         return jsonify({"message": "Knowledge rejected"}), 200

#     except Exception as e:
#         print(f"Reject knowledge error: {e}")
#         return jsonify({"error": str(e)}), 400

        

from flask import Blueprint, request, jsonify
from db import get_db_connection
from datetime import datetime
import requests

chat_bp = Blueprint('chat', __name__)

def search_knowledge_base(query):
    # search KB for matching questions
    try:
        conn = get_db_connection()
        if not conn:
            return None

        cursor = conn.cursor(dictionary=True)
        query_clean = query.lower().strip()

        # try exact match first
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

        # if no exact match, try keywords
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
        print(f"KB search error: {e}")
        return None

def query_llm(question):
    # call ollama for AI response
    try:
        url = "http://localhost:11434/api/generate"

        prompt = f"""You are a helpful restaurant assistant for SD Foods.
Answer the following question concisely and professionally.

Question: {question}

Answer:"""

        payload = {
            "model": "phi",
            "prompt": prompt,
            "stream": False,
        }

        response = requests.post(url, json=payload, timeout=120)

        if response.status_code == 200:
            data = response.json()
            answer = (data.get("response") or "").strip()
            if answer:
                return answer

        return "I'm having trouble answering that right now. Please try again later."

    except requests.exceptions.Timeout:
        return "I'm taking too long to respond. Please try a simpler question."
    except requests.exceptions.ConnectionError:
        return "I can't reach the AI service. Please make sure Ollama is running."
    except Exception as e:
        print(f"LLM error: {e}")
        return "I encountered an error. Please try again later."

@chat_bp.route("/ask", methods=["POST"])
def ask_question():
    try:
        data = request.json
        message = data.get("message", "").strip()
        user_id = data.get("user_id")
        session_id = data.get("session_id") or datetime.now().strftime("%Y%m%d%H%M%S")

        if not message:
            return jsonify({"error": "Message cannot be empty"}), 400

        # check knowledge base first
        kb_result = search_knowledge_base(message)

        if kb_result:
            response_text = kb_result["answer"]
            source = "knowledge_base"
            kb_id = kb_result["kb_id"]

            # save to chat history
            conn = get_db_connection()
            chat_id = None
            if conn:
                try:
                    cursor = conn.cursor()
                    cursor.execute("""
                        INSERT INTO chat_history (user_id, session_id, message, response, source, kb_id)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (user_id, session_id, message, response_text, source, kb_id))
                    chat_id = cursor.lastrowid
                    conn.commit()
                    cursor.close()
                    conn.close()
                except Exception as e:
                    print(f"Error saving chat: {e}")

            return jsonify({
                "response": response_text,
                "source": source,
                "chat_id": chat_id,
                "kb_id": kb_id,
                "category": kb_result.get("category"),
                "needs_rating": True
            }), 200

        else:
            # use LLM if Knowlege base doesn't know
            response_text = query_llm(message)
            source = "llm"

            conn = get_db_connection()
            chat_id = None
            if conn:
                try:
                    cursor = conn.cursor()
                    cursor.execute("""
                        INSERT INTO chat_history (user_id, session_id, message, response, source)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (user_id, session_id, message, response_text, source))
                    chat_id = cursor.lastrowid
                    conn.commit()
                    cursor.close()
                    conn.close()
                except Exception as e:
                    print(f"Error saving chat: {e}")

            return jsonify({
                "response": response_text,
                "source": source,
                "chat_id": chat_id,
                "needs_rating": False
            }), 200

    except Exception as e:
        print(f"Chat error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400 # HTTP 400 = Bad Request

@chat_bp.route("/rate", methods=["POST"])
def rate_response():
    try:
        data = request.json
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

        # get the chat info
        cursor.execute(
            "SELECT kb_id, source FROM chat_history WHERE chat_id = %s",
            (chat_id,),
        )
        chat = cursor.fetchone()
        if not chat:
            cursor.close()
            conn.close()
            return jsonify({"error": "Chat not found"}), 404

        is_flagged = (rating == 0)

        cursor.execute("""
            INSERT INTO chat_ratings (chat_id, user_id, rating, feedback, is_flagged)
            VALUES (%s, %s, %s, %s, %s)
        """, (chat_id, user_id, rating, feedback, is_flagged))
        rating_id = cursor.lastrowid

        # update KB stats if from knowledge base
        if chat["kb_id"]:
            cursor.execute("""
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
            """, (chat["kb_id"],))

        conn.commit()
        cursor.close()
        conn.close()

        msg = "Thank you for your feedback!"
        if is_flagged:
            msg = "Your feedback has been flagged for manager review. Thank you for helping us improve!"

        return jsonify({
            "message": msg,
            "rating_id": rating_id,
            "is_flagged": is_flagged,
        }), 200

    except Exception as e:
        print(f"Rating error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400

@chat_bp.route("/knowledge/add", methods=["POST"])

def add_knowledge():
    try:
        data = request.json
        question = data.get("question", "").strip()
        answer = data.get("answer", "").strip()
        category = data.get("category", "General")
        created_by = data.get("user_id")

        print(f"\n{'='*60}")
        print(f"📝 Add Knowledge Request")
        print(f"Question: {question}")
        print(f"Answer: {answer[:50]}...")
        print(f"Category: {category}")
        print(f"User ID: {created_by}")
        print(f"{'='*60}\n")

        # check if question is empty
        if not question or question == "":
            return jsonify({"error": "Question is required"}), 400
        # check if answer is empty  
        if not answer or answer == "":
            return jsonify({"error": "Answer is required"}), 400

        conn = get_db_connection()
        if not conn:
            print("Database connection failed")
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        # check user role to see if we auto-approve
        cursor.execute("SELECT role FROM users WHERE user_id = %s", (created_by,))
        user = cursor.fetchone()

        if not user:
            cursor.close()
            conn.close()
            print(f"❌ User not found: {created_by}")
            return jsonify({"error": "User not found"}), 404

        print(f"✅ User found: {user['role']}")

        # employees get auto-approved
        is_approved = user['role'] in ['chef', 'driver', 'delivery', 'manager', 'admin']
        print(f"📋 Auto-approve: {is_approved}")

        cursor.execute("""
            INSERT INTO knowledge_base (question, answer, category, created_by, is_approved)
            VALUES (%s, %s, %s, %s, %s)
        """, (question, answer, category, created_by, is_approved))

        kb_id = cursor.lastrowid
        conn.commit()
        cursor.close()
        conn.close()

        print(f"✅ Knowledge added with ID: {kb_id}")

        message = "Knowledge added successfully!"
        if not is_approved:
            message = "Knowledge submitted for manager approval!"

        return jsonify({
            "message": message,
            "kb_id": kb_id,
            "is_approved": is_approved
        }), 201

    except Exception as e:
        print(f"💥 Add knowledge error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400

@chat_bp.route("/history", methods=["GET"])
def get_chat_history():
    try:
        user_id = request.args.get("user_id")
        limit = int(request.args.get("limit", 20))

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        if user_id:
            cursor.execute("""
                SELECT chat_id, message, response, source, created_at
                FROM chat_history
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s
            """, (user_id, limit))
        else:
            cursor.execute("""
                SELECT chat_id, message, response, source, created_at
                FROM chat_history
                ORDER BY created_at DESC
                LIMIT %s
            """, (limit,))

        history = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify(history), 200

    except Exception as e:
        print(f"History error: {e}")
        return jsonify({"error": str(e)}), 400

@chat_bp.route("/knowledge/flagged", methods=["GET"])
def get_flagged_knowledge():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT 
                cr.rating_id,
                cr.chat_id,
                cr.rating,
                cr.feedback,
                cr.review_status,
                cr.created_at,
                ch.message as question,
                ch.response as answer,
                kb.kb_id,
                kb.question as kb_question,
                kb.created_by,
                u.name as author_name
            FROM chat_ratings cr
            JOIN chat_history ch ON cr.chat_id = ch.chat_id
            LEFT JOIN knowledge_base kb ON ch.kb_id = kb.kb_id
            LEFT JOIN users u ON kb.created_by = u.user_id
            WHERE cr.is_flagged = TRUE AND cr.review_status = 'pending'
            ORDER BY cr.created_at DESC
        """)

        flagged = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify(flagged), 200

    except Exception as e:
        print(f"Flagged knowledge error: {e}")
        return jsonify({"error": str(e)}), 400

@chat_bp.route("/knowledge/review/<int:rating_id>", methods=["POST"])
def review_flagged_knowledge(rating_id):
    # manager reviews flagged content
    try:
        data = request.json
        action = data.get("action")
        manager_id = data.get("manager_id")

        if action not in ["remove", "keep"]:
            return jsonify({"error": "Action must be 'remove' or 'keep'"}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        # get rating details
        cursor.execute("""
            SELECT cr.chat_id, ch.kb_id, kb.created_by
            FROM chat_ratings cr
            JOIN chat_history ch ON cr.chat_id = ch.chat_id
            LEFT JOIN knowledge_base kb ON ch.kb_id = kb.kb_id
            WHERE cr.rating_id = %s
        """, (rating_id,))

        rating_data = cursor.fetchone()

        if not rating_data:
            cursor.close()
            conn.close()
            return jsonify({"error": "Rating not found"}), 404

        if action == "remove":
            if rating_data["kb_id"]:
                # deactivate the KB entry
                cursor.execute("""
                    UPDATE knowledge_base 
                    SET is_active = FALSE 
                    WHERE kb_id = %s
                """, (rating_data["kb_id"],))

                # give user a warning
                if rating_data["created_by"]:
                    cursor.execute("""
                        UPDATE users 
                        SET amount_warnings = amount_warnings + 1 
                        WHERE user_id = %s
                    """, (rating_data["created_by"],))

            review_status = "approved"
        else:
            review_status = "rejected"

        cursor.execute("""
            UPDATE chat_ratings 
            SET review_status = %s, reviewed_by = %s 
            WHERE rating_id = %s
        """, (review_status, manager_id, rating_id))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "message": f"Knowledge {'removed' if action == 'remove' else 'kept'} successfully"
        }), 200

    except Exception as e:
        print(f"Review knowledge error: {e}")
        return jsonify({"error": str(e)}), 400

@chat_bp.route("/knowledge/pending", methods=["GET"])
def get_pending_knowledge():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT 
                kb.kb_id,
                kb.question,
                kb.answer,
                kb.category,
                kb.created_at,
                u.name as author_name,
                u.user_id as created_by
            FROM knowledge_base kb
            JOIN users u ON kb.created_by = u.user_id
            WHERE kb.is_approved = FALSE AND kb.is_active = TRUE
            ORDER BY kb.created_at DESC
        """)

        pending = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify(pending), 200

    except Exception as e:
        print(f"Pending knowledge error: {e}")
        return jsonify({"error": str(e)}), 400

@chat_bp.route("/knowledge/approve/<int:kb_id>", methods=["POST"])
def approve_knowledge(kb_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()

        cursor.execute("""
            UPDATE knowledge_base 
            SET is_approved = TRUE 
            WHERE kb_id = %s
        """, (kb_id,))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Knowledge approved successfully"}), 200

    except Exception as e:
        print(f"Approve knowledge error: {e}")
        return jsonify({"error": str(e)}), 400

@chat_bp.route("/knowledge/reject/<int:kb_id>", methods=["POST"])
def reject_knowledge(kb_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()

        # deactivate instead of deleting
        cursor.execute("""
            UPDATE knowledge_base 
            SET is_active = FALSE 
            WHERE kb_id = %s
        """, (kb_id,))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Knowledge rejected"}), 200

    except Exception as e:
        print(f"Reject knowledge error: {e}")
        return jsonify({"error": str(e)}), 400
