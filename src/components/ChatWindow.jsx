// javascript
import React, { useEffect, useRef } from "react";
import "./App.css";

function linkify(text) {
  // Simple linkify: finds http/https links and returns an array of React nodes
  // Keeps other text segments as plain strings
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    const { index } = match;
    if (index > lastIndex) parts.push(text.slice(lastIndex, index));
    parts.push(
      <a key={index} href={match[0]} target="_blank" rel="noopener noreferrer">
        {match[0]}
      </a>
    );
    lastIndex = index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function ChatWindow({ messages = [] }) {
  const containerRef = useRef(null);
  const chatEndRef = useRef(null);

  // Helper: determine if the user is near the bottom of the scroll
  const isNearBottom = (el, threshold = 120) => {
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Auto-scroll only if user is near bottom to avoid interrupting reading older messages
    if (isNearBottom(container)) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div
      className="chat-window"
      ref={containerRef}
      role="log"
      aria-live="polite"
      aria-atomic="false"
    >
      {messages.map((msg, idx) => {
        const key =
          msg.id ??
          `${msg.sender ?? "unknown"}-${idx}-${String(msg.text ?? "").slice(0, 24)}`;

        return (
          <div key={key} className={`chat-message ${msg.sender ?? ""}`}>
            <div className="message-meta" aria-hidden="true">
              <span className={`avatar ${msg.sender ?? ""}`} />
              <span className="sender-label">{msg.sender ?? "user"}</span>
            </div>
            <div className="message-content">
              {typeof msg.text === "string" ? linkify(msg.text) : String(msg.text)}
            </div>
          </div>
        );
      })}
      <div ref={chatEndRef} />
    </div>
  );
}

export default ChatWindow;
