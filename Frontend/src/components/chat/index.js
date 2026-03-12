import React from "react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";

import Spinner from "../common/Spinner";
import { timeAgo, getInitials } from "../../utils/helpers";

// chat components
// Message Bubble
export function MessageBubble({ message, isOwn }) {
  return (
    <div style={{ display: "flex", justifyContent: isOwn ? "flex-end" : "flex-start", marginBottom: 8 }}>
      <div
        style={{
          maxWidth: "70%",
          background: isOwn ? "linear-gradient(135deg, #0EA5E9, #6366F1)" : "#1E293B",
          borderRadius: isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          padding: "10px 14px",
          border: isOwn ? "none" : "1px solid #334155",
        }}
      >
        {message.isDeleted ? (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontStyle: "italic", margin: 0 }}>
            This message was deleted
          </p>
        ) : (
          <p style={{ color: "#fff", fontSize: 13, margin: 0, lineHeight: 1.5, wordBreak: "break-word" }}>
            {message.content}
          </p>
        )}

        <div
          style={{
            color: isOwn ? "rgba(255,255,255,0.6)" : "#64748B",
            fontSize: 10,
            marginTop: 4,
            textAlign: isOwn ? "right" : "left",
          }}
        >
          {message.createdAt ? format(new Date(message.createdAt), "HH:mm") : ""}
          {isOwn && <span style={{ marginLeft: 4 }}>{message.isRead ? "✓✓" : "✓"}</span>}
        </div>
      </div>
    </div>
  );
}


// Typing Indicator
export function TypingIndicator({ name }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#64748B",
              animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <span style={{ color: "#64748B", fontSize: 12 }}>{name} is typing...</span>
    </div>
  );
}


// Chat Sidebar
export function ChatSidebar({ conversations, isLoading }) {
  const { conversationId } = useParams();

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #334155" }}>
        <h3 style={{ color: "#F1F5F9", fontSize: 16, margin: 0 }}>Messages</h3>
      </div>

      {conversations.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "#64748B", fontSize: 13 }}>
          No conversations yet
        </div>
      ) : (
        conversations.map((conv) => {
          const other = conv.otherParticipant;
          const isActive = conv._id === conversationId;

          return (
            <Link
              key={conv._id}
              to={`/messages/${conv._id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                textDecoration: "none",
                background: isActive ? "rgba(14,165,233,0.1)" : "transparent",
                borderLeft: `3px solid ${isActive ? "#0EA5E9" : "transparent"}`,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #0EA5E9, #6366F1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                {other?.profilePicture ? (
                  <img src={other.profilePicture} alt="" style={{ width: "100%", height: "100%" }} />
                ) : (
                  getInitials(other?.firstName, other?.lastName)
                )}
              </div>

              <div style={{ flex: 1 }}>
                <span style={{ color: "#F1F5F9" }}>
                  {other?.firstName} {other?.lastName}
                </span>
                <p style={{ color: "#64748B", fontSize: 12 }}>
                  {conv.lastMessage?.content || "No messages yet"}
                </p>
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
}