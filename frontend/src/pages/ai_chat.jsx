import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Bot, User, ArrowLeft, Loader, ThumbsUp, ThumbsDown } from "lucide-react";
import client from "../api/client";

export default function ChatPage() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem("customer");
    if (stored) {
      setCustomer(JSON.parse(stored));
    }
    // Don't redirect - allow visitors to use chat
    
    setMessages([{
      role: "assistant",
      content: "Hello! I'm your AI assistant. Ask me anything about our restaurant, menu, delivery, or place an order!",
      timestamp: new Date(),
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: input.trim(), timestamp: new Date() }]);
    setInput("");
    setLoading(true);

    try {
      const response = await client.post("/chat/", {
        message: input.trim(),
        customer_id: customer?.customer_id || customer?.id || null, // null for visitors
      });

      setMessages((prev) => [...prev, {
        role: "assistant",
        content: response.data.response || response.data.message,
        fromKnowledgeBase: response.data.from_knowledge_base,
        messageId: response.data.message_id,
        timestamp: new Date(),
      }]);
    } catch (error) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting. Please try again or contact support.",
        timestamp: new Date(),
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (messageId, rating) => {
    try {
      await client.post("/chat/rate", {
        message_id: messageId,
        rating: rating,
        customer_id: customer?.customer_id || customer?.id || null,
      });
      setMessages((prev) => prev.map((msg) => msg.messageId === messageId ? { ...msg, rated: rating } : msg));
    } catch (error) {
      console.error("Rating error:", error);
    }
  };

  return (
    <div className="page" style={{ padding: 0, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div className="navbar">
        <button onClick={() => navigate(customer ? "/customer" : "/")} className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="text-center">
          <h1 className="title-md" style={{ margin: 0 }}>AI ASSISTANT</h1>
          <p className="text-muted text-small">Ask about menu, orders, or restaurant info</p>
        </div>
        <div style={{ width: "80px" }} />
      </div>

      {/* Visitor Notice */}
      {!customer && (
        <div style={{ padding: "0 20px", paddingTop: "100px" }}>
          <div className="alert alert-info">
            <p style={{ margin: 0 }}>
              Chatting as a visitor. <strong>Login or register</strong> to place orders!{" "}
              <button
                onClick={() => navigate("/register")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#f97316",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                Register now
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: customer ? "150px 20px 20px" : "20px 20px 20px", display: "flex", justifyContent: "center" }}>
        <div className="container-md" style={{ width: "100%" }}>
          {messages.map((msg, idx) => (
            <div key={idx} className="mb-3" style={{ display: "flex", gap: "15px", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
              <div className="brand-logo-sm" style={{ background: msg.role === "user" ? "linear-gradient(135deg, #a8a29e, #78716c)" : undefined }}>
                {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
              </div>
              
              <div style={{ maxWidth: "70%" }}>
                <div className="card-compact" style={{
                  background: msg.role === "user" ? "rgba(249, 115, 22, 0.08)" : msg.isError ? "rgba(239, 68, 68, 0.08)" : undefined,
                  borderRadius: msg.role === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px"
                }}>
                  <p style={{ margin: 0, lineHeight: "1.6" }}>{msg.content}</p>
                  {msg.fromKnowledgeBase && <span className="badge mt-2" style={{ fontSize: "0.7rem" }}>FROM KB</span>}
                </div>

                {msg.fromKnowledgeBase && !msg.rated && (
                  <div className="flex gap-sm mt-1">
                    <span className="text-small text-muted">Rate:</span>
                    <button onClick={() => handleRating(msg.messageId, 1)} className="btn-sm" style={{ border: "1px solid #22c55e", background: "none", color: "#22c55e", padding: "4px 10px", fontSize: "0.7rem" }}>
                      <ThumbsUp size={12} /> Good
                    </button>
                    <button onClick={() => handleRating(msg.messageId, 0)} className="btn-sm" style={{ border: "1px solid #ef4444", background: "none", color: "#ef4444", padding: "4px 10px", fontSize: "0.7rem" }}>
                      <ThumbsDown size={12} /> Bad
                    </button>
                  </div>
                )}

                <span className="text-small" style={{ color: "#d4d4d8" }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-md mb-3">
              <div className="brand-logo-sm"><Bot size={20} /></div>
              <div className="card-compact flex gap-sm">
                <Loader size={16} style={{ color: "#f97316", animation: "spin 1s linear infinite" }} />
                <span className="text-muted">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="navbar" style={{ position: "relative", display: "flex", justifyContent: "center" }}>
        <div className="container-md flex gap-md">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSubmit(e)}
            placeholder="Ask about menu, orders, delivery..."
            disabled={loading}
            className="input"
            style={{ flex: 1, borderRadius: "50px" }}
          />
          <button onClick={handleSubmit} disabled={loading || !input.trim()} className="btn btn-primary">
            <Send size={18} /> Send
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}