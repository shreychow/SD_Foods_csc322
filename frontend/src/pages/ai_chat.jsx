import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send,
  ArrowLeft,
  Bot,
  User,
  Star,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  BookOpen,
  Plus,
  Mic,
  MicOff,
  StopCircle
} from "lucide-react";
import client from "../api/client";

export default function ChatPage() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const [customer, setCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(Date.now().toString());
  const [showAddKnowledge, setShowAddKnowledge] = useState(false);

  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceError, setVoiceError] = useState("");

  // Add knowledge form
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newCategory, setNewCategory] = useState("General");

  // Initialize voice recognition
  useEffect(() => {
    const stored = localStorage.getItem("customer");
    if (stored) {
      setCustomer(JSON.parse(stored));
    }

    // Check for Web Speech API support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setVoiceSupported(true);
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError("");
      };

      recognition.onresult = (event) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript + " ";
          } else {
            interim += transcript;
          }
        }

        if (final) {
          setInputMessage((prev) => (prev || "") + final);
          setInterimTranscript("");
        } else {
          setInterimTranscript(interim);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setVoiceError(`Voice error: ${event.error}. Please try again.`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript("");
      };

      recognitionRef.current = recognition;
    }

    // Add welcome message
    setMessages([
      {
        id: 0,
        role: "assistant",
        content:
          "Hello! I'm your AI assistant. I can help you with menu information, hours, delivery details, and more. You can type or use voice 🎤 to ask your questions. What would you like to know?",
        source: "system",
        timestamp: new Date()
      }
    ]);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleVoiceRecognition = () => {
    if (!voiceSupported) {
      alert(
        "Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari."
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (error) {
        console.error("Failed to start recognition:", error);
        setVoiceError("Failed to start voice recognition. Please try again.");
      }
    }
  };

  const handleSend = async () => {
    const trimmed = inputMessage.trim();
    if (!trimmed) return;

    // Stop voice recognition if active
    if (isListening) {
      recognitionRef.current?.stop();
    }

    const now = new Date();

    // Add user message
    setMessages((prev) => {
      const newId = prev.length ? prev[prev.length - 1].id + 1 : 1;
      const userMessage = {
        id: newId,
        role: "user",
        content: trimmed,
        timestamp: now
      };
      return [...prev, userMessage];
    });

    setInputMessage("");
    setLoading(true);

    try {
      const response = await client.post("/chat/ask", {
        message: trimmed,
        user_id: customer?.user_id || customer?.id,
        session_id: sessionId
      });

      const data = response.data || {};

      setMessages((prev) => {
        const newId = prev.length ? prev[prev.length - 1].id + 1 : 1;
        const assistantMessage = {
          id: newId,
          role: "assistant",
          content: data.response || "No response from server.",
          source: data.source,
          chat_id: data.chat_id,
          kb_id: data.kb_id,
          needs_rating: data.needs_rating,
          category: data.category,
          timestamp: new Date()
        };
        return [...prev, assistantMessage];
      });
    } catch (error) {
      console.error("Chat error:", error);

      const backendError =
        error.response?.data?.response ||
        error.response?.data?.error ||
        error.message ||
        "Sorry, I encountered an error. Please try again.";

      setMessages((prev) => {
        const newId = prev.length ? prev[prev.length - 1].id + 1 : 1;
        const errorMessage = {
          id: newId,
          role: "assistant",
          content: backendError,
          source: "error",
          timestamp: new Date()
        };
        return [...prev, errorMessage];
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (chatId, rating) => {
    try {
      await client.post("/chat/rate", {
        chat_id: chatId,
        rating: rating,
        user_id: customer?.user_id || customer?.id
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.chat_id === chatId
            ? { ...msg, rated: true, user_rating: rating }
            : msg
        )
      );

      if (rating === 0) {
        alert("Thank you for flagging this response. Our manager will review it.");
      }
    } catch (error) {
      console.error("Rating error:", error);
      alert("Failed to submit rating. Please try again.");
    }
  };

  const handleAddKnowledge = async (e) => {
    e.preventDefault();

    if (!customer) {
      alert("Please login to add knowledge!");
      return;
    }

    try {
      const response = await client.post("/chat/knowledge/add", {
        question: newQuestion,
        answer: newAnswer,
        category: newCategory,
        user_id: customer.user_id || customer.id
      });

      alert(response.data.message);
      setNewQuestion("");
      setNewAnswer("");
      setNewCategory("General");
      setShowAddKnowledge(false);
    } catch (error) {
      console.error("Add knowledge error:", error);
      alert("Failed to add knowledge. Please try again.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="page page-chat">
      {/* Header */}
      <div className="navbar">
        <div className="flex gap-md">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(customer ? "/customer" : "/")}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex gap-md">
            <div className="brand-logo-sm">
              <Bot size={24} />
            </div>
            <div>
              <span className="brand-name">AI Assistant</span>
              {voiceSupported && (
                <span className="chat-voice-label"> Voice enabled</span>
              )}
            </div>
          </div>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowAddKnowledge(!showAddKnowledge)}
        >
          <Plus size={16} /> Add Knowledge
        </button>
      </div>

      {/* Add Knowledge Form */}
      {showAddKnowledge && (
        <div className="container chat-add-knowledge">
          <div className="card card-sm">
            <h3 className="title-md mb-2">Contribute Knowledge</h3>
            <p className="text-small text-muted mb-3">
              Help improve our AI by adding questions and answers!
              {customer?.role === "customer" && " (Subject to manager approval)"}
            </p>
            <form onSubmit={handleAddKnowledge}>
              <div className="form-group">
                <label className="form-label">Question</label>
                <input
                  type="text"
                  className="input"
                  placeholder="What question should this answer?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Answer</label>
                <textarea
                  className="textarea"
                  rows={4}
                  placeholder="Provide a helpful answer..."
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="input"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  <option value="General">General</option>
                  <option value="Menu">Menu</option>
                  <option value="Hours">Hours</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Payment">Payment</option>
                  <option value="VIP">VIP Program</option>
                  <option value="Policy">Policy</option>
                  <option value="Orders">Orders</option>
                </select>
              </div>
              <div className="flex gap-sm">
                <button type="submit" className="btn btn-primary">
                  Submit Knowledge
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddKnowledge(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="container chat-main">
        {/* Messages */}
        <div className="chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`chat-row ${
                message.role === "user" ? "chat-row-user" : "chat-row-assistant"
              }`}
            >
              {message.role === "assistant" && (
                <div className="chat-avatar chat-avatar-bot">
                  <Bot size={24} color="white" />
                </div>
              )}

              <div className="chat-bubble-wrapper">
                <div
                  className={`card card-compact chat-bubble ${
                    message.role === "user"
                      ? "chat-bubble-user"
                      : "chat-bubble-assistant"
                  }`}
                >
                  <p className="chat-text">{message.content}</p>

                  {/* Source badge */}
                  {message.source &&
                    message.source !== "system" &&
                    message.source !== "error" && (
                      <div className="chat-source">
                        {message.source === "knowledge_base" ? (
                          <>
                            <BookOpen size={14} className="chat-source-icon" />
                            <span className="chat-source-label">
                              From Knowledge Base
                              {message.category && ` • ${message.category}`}
                            </span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} className="chat-source-icon" />
                            <span className="chat-source-label">
                              AI Generated
                            </span>
                          </>
                        )}
                      </div>
                    )}

                  {/* Rating buttons for KB answers */}
                  {message.needs_rating && !message.rated && (
                    <div className="chat-rating">
                      <p className="chat-rating-label">Was this answer helpful?</p>
                      <div className="chat-rating-buttons">
                        {[5, 4, 3, 2, 1, 0].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => handleRating(message.chat_id, rating)}
                            className="btn btn-secondary btn-sm"
                          >
                            {rating === 0 ? (
                              <>
                                <ThumbsDown size={14} /> Flag
                              </>
                            ) : (
                              <>
                                <Star
                                  size={14}
                                  fill={rating >= 4 ? "#facc15" : "none"}
                                />{" "}
                                {rating}
                              </>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show rating if already rated */}
                  {message.rated && (
                    <div className="chat-rating-done">
                      <ThumbsUp size={14} />
                      <span>Rated: {message.user_rating}/5</span>
                    </div>
                  )}
                </div>

                <span className="chat-timestamp">
                  {message.timestamp instanceof Date
                    ? message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                    : new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                </span>
              </div>

              {message.role === "user" && (
                <div className="chat-avatar chat-avatar-user">
                  <User size={24} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="chat-row chat-row-assistant">
              <div className="chat-avatar chat-avatar-bot">
                <Bot size={24} color="white" />
              </div>
              <div className="card card-compact chat-bubble chat-bubble-assistant">
                <div className="chat-typing">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Voice Status Banner */}
        {isListening && (
          <div className="alert alert-warning chat-voice-banner">
            <div className="listening-dot" />
            <div className="chat-voice-banner-text">
              <div className="chat-voice-title">🎤 Listening to your voice...</div>
              {interimTranscript && (
                <div className="chat-voice-interim">"{interimTranscript}"</div>
              )}
            </div>
            <button
              onClick={toggleVoiceRecognition}
              className="btn btn-sm chat-stop-btn"
            >
              <StopCircle size={16} /> Stop
            </button>
          </div>
        )}

        {/* Voice Error */}
        {voiceError && (
          <div className="alert alert-error chat-voice-error">{voiceError}</div>
        )}

        {/* Input */}
        <div className="card card-compact chat-input-bar">
          <div className="flex gap-md chat-input-inner">
            {voiceSupported && (
              <button
                onClick={toggleVoiceRecognition}
                disabled={loading}
                className={`btn btn-icon chat-voice-btn ${
                  isListening ? "chat-voice-btn-active" : ""
                }`}
                title={isListening ? "Stop recording" : "Start voice input"}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}

            <textarea
              className="input chat-input"
              placeholder={
                voiceSupported
                  ? "Type or use 🎤 voice to ask..."
                  : "Ask me anything about the restaurant..."
              }
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1}
            />

            <button
              className="btn btn-primary"
              onClick={handleSend}
              disabled={loading || !inputMessage.trim()}
            >
              <Send size={18} />
            </button>
          </div>

          {!voiceSupported && (
            <div className="chat-voice-tip">
              💡 Tip: Voice input works best in Chrome, Edge, or Safari
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
