import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, XCircle, Star } from "lucide-react";
import client from "../api/client";

export default function KnowledgeReview({ manager }) {
  const [flaggedItems, setFlaggedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlaggedItems();
  }, []);

  const loadFlaggedItems = async () => {
    try {
      setLoading(true);
      const response = await client.get("/chat/knowledge/flagged");
      setFlaggedItems(response.data);
    } catch (error) {
      console.error("Failed to load flagged items:", error);
      setFlaggedItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (ratingId, action) => {
    try {
      await client.post(`/chat/knowledge/review/${ratingId}`, {
        action: action, // 'remove' or 'keep'
        manager_id: manager.user_id || manager.id
      });

      alert(`Knowledge ${action === 'remove' ? 'removed' : 'kept'} successfully!`);
      loadFlaggedItems(); // Reload
    } catch (error) {
      console.error("Review failed:", error);
      alert("Failed to process review. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="card card-sm">
        <p className="text-muted text-center" style={{ padding: "40px" }}>
          Loading flagged knowledge...
        </p>
      </div>
    );
  }

  return (
    <div className="card card-sm">
      <h3 className="title-md mb-3">
        <AlertTriangle size={20} style={{ color: "#ef4444", marginRight: "8px" }} />
        Flagged Knowledge Base Entries ({flaggedItems.length})
      </h3>

      {flaggedItems.length === 0 ? (
        <div className="text-center" style={{ padding: "40px" }}>
          <CheckCircle size={48} style={{ color: "#22c55e", margin: "0 auto 10px" }} />
          <p className="text-muted">No flagged knowledge to review!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {flaggedItems.map((item) => (
            <div 
              key={item.rating_id} 
              className="card card-compact"
              style={{ background: "rgba(239, 68, 68, 0.05)" }}
            >
              {/* Flagged Info */}
              <div className="flex-between mb-3">
                <span className="badge badge-danger">
                  <AlertTriangle size={14} /> Flagged by User
                </span>
                <span className="text-small text-muted">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* User Rating */}
              <div className="mb-3" style={{ 
                background: "rgba(239, 68, 68, 0.1)", 
                padding: "12px", 
                borderRadius: "8px" 
              }}>
                <div className="flex gap-sm mb-2">
                  <strong>Rating:</strong>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        fill={i < item.rating ? "#facc15" : "none"}
                        color={i < item.rating ? "#facc15" : "#d4d4d8"}
                      />
                    ))}
                    <span className="text-small text-muted">({item.rating}/5)</span>
                  </div>
                </div>
                {item.feedback && (
                  <div>
                    <strong>Feedback:</strong>
                    <p className="text-small" style={{ margin: "5px 0 0 0" }}>
                      "{item.feedback}"
                    </p>
                  </div>
                )}
              </div>

              {/* Original Question */}
              <div className="mb-2">
                <strong>User Question:</strong>
                <p className="text-small text-muted" style={{ margin: "5px 0" }}>
                  {item.question}
                </p>
              </div>

              {/* KB Answer */}
              <div className="mb-2">
                <strong>KB Answer:</strong>
                <p style={{ 
                  margin: "8px 0", 
                  padding: "12px", 
                  background: "rgba(249, 115, 22, 0.05)",
                  borderRadius: "8px",
                  borderLeft: "3px solid #f97316"
                }}>
                  {item.answer}
                </p>
              </div>

              {/* KB Metadata */}
              {item.kb_question && (
                <div className="mb-3">
                  <div className="text-small text-muted">
                    <strong>KB Entry:</strong> {item.kb_question}
                  </div>
                  {item.author_name && (
                    <div className="text-small text-muted">
                      <strong>Created by:</strong> {item.author_name}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-sm" style={{ borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: "12px" }}>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => handleReview(item.rating_id, 'remove')}
                >
                  <XCircle size={16} /> Remove & Warn Author
                </button>
                <button 
                  className="btn btn-success btn-sm"
                  onClick={() => handleReview(item.rating_id, 'keep')}
                >
                  <CheckCircle size={16} /> Keep Knowledge
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}