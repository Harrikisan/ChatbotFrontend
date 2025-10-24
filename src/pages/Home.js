// javascript
import React, { useState, useEffect, useCallback } from "react";
import PersonaSelector from "../components/PersonaSelector";
import UploadButton from "../components/UploadButton";
import ChatWindow from "../components/ChatWindow";
import SearchBar from "../components/SearchBar";
import { sendMessage, uploadFile, listFiles } from "../services/api";
import "../App.css";
 
const BASE_URL = process.env.REACT_APP_API_BASE || "http://localhost:8000";
 
function Home() {
  const [mode, setMode] = useState("chat"); // chat or documents
  const [role, setRole] = useState("HR");
  const roles = ["HR", "Legal", "L1", "L2"];
 
  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
 
  // Document state
  const [documents, setDocuments] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewText, setPreviewText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);
 
  // Notification
  const [notification, setNotification] = useState("");
 
  // -----------------------
  // Memoized fetchDocuments function
  // -----------------------
  const fetchDocuments = useCallback(async () => {
    setDocsLoading(true);
    try {
      const files = await listFiles(role);
      setDocuments(Array.isArray(files) ? files : []);
    } catch (err) {
      console.error("Failed to list files:", err);
      setDocuments([]);
    } finally {
      setDocsLoading(false);
    }
  }, [role]); // Only recreate when role changes
 
  // -----------------------
  // Fetch documents when mode or role changes
  // -----------------------
  useEffect(() => {
    if (mode === "documents") {
      fetchDocuments();
    }
  }, [role, mode, fetchDocuments]);
 
  // Lock background scroll while modal is open
  const modalOpen = Boolean(previewFile || previewText || processing);
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);
 
  // Auto clear notifications
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(() => setNotification(""), 3000);
    return () => clearTimeout(t);
  }, [notification]);
 
  // -----------------------
  // Handle Chat Message
  // -----------------------
  const handleSend = async () => {
    const trimmed = input?.trim();
    if (!trimmed || sending) return;
    setMessages((prev) => [...prev, { sender: "user", text: trimmed }]);
    setSending(true);
    setInput("");
    try {
      const res = await sendMessage(trimmed, role);
      const replyText = res?.reply ?? "No reply from server.";
      setMessages((prev) => [...prev, { sender: "bot", text: replyText }]);
    } catch (err) {
      console.error("sendMessage error:", err);
      setMessages((prev) => [...prev, { sender: "bot", text: "Error sending message." }]);
    } finally {
      setSending(false);
    }
  };
 
  // -----------------------
  // Handle File Upload
  // -----------------------
  const handleUpload = async (file) => {
    if (!file) return;
    try {
      const res = await uploadFile(file, role);
      if (res?.message) setNotification(res.message);
      else setNotification("File uploaded");
      if (mode === "documents") fetchDocuments();
    } catch (err) {
      console.error("uploadFile error:", err);
    }
  };
 
  // -----------------------
  // Handle File Preview
  // -----------------------
  const handlePreview = async (filename) => {
    if (!filename) return;
    const encoded = encodeURIComponent(filename);
    const url = `${BASE_URL}/download/${role}/${encoded}`;
 
    if (filename.toLowerCase().endsWith(".txt")) {
      try {
        setProcessing(true);
        const resp = await fetch(url);
        const text = await resp.text();
        setPreviewText(text);
        setPreviewFile(null);
      } catch (err) {
        console.error("Failed to fetch .txt:", err);
        setPreviewText("");
        setPreviewFile(null);
      } finally {
        setProcessing(false);
      }
    } else if (filename.toLowerCase().endsWith(".pdf")) {
      setProcessing(true);
      setPreviewFile(url);
      setPreviewText("");
      try {
        const resp = await fetch(`${BASE_URL}/process_pdf/${role}/${encoded}`);
        if (!resp.ok) throw new Error("Processing failed");
        const data = await resp.json();
        setPreviewText(data?.text ?? "");
      } catch (err) {
        console.error("Error processing PDF:", err);
      } finally {
        setProcessing(false);
      }
    } else {
      setPreviewFile(url);
      setPreviewText("");
    }
  };
 
  // -----------------------
  // UI Rendering
  // -----------------------
  return (
    <div className="home-container">
      <h2>LangChain + Groq Persona Portal</h2>
 
      <div className="mode-toggle">
        <button
          type="button"
          className={mode === "chat" ? "active" : ""}
          onClick={() => setMode("chat")}
        >
          Chat
        </button>
        <button
          type="button"
          className={mode === "documents" ? "active" : ""}
          onClick={() => setMode("documents")}
        >
          Documents
        </button>
      </div>
 
      <div className="controls">
        <PersonaSelector roles={roles} selectedRole={role} onChange={setRole} />
        <UploadButton onUpload={handleUpload} />
      </div>
 
      {mode === "chat" ? (
        <>
          <ChatWindow messages={messages} />
          <div className="input-container">
            <SearchBar value={input} onChange={setInput} />
            <button type="button" onClick={handleSend} disabled={sending}>
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </>
      ) : (
        <div className="document-list">
          <h3>Documents for {role}</h3>
          {docsLoading ? (
            <p>Loading documents...</p>
          ) : documents.length === 0 ? (
            <p>No documents uploaded yet.</p>
          ) : (
            <ul>
              {documents.map((doc) => (
                <li
                  key={doc}
                  className="document-item"
                  onClick={() => handlePreview(doc)}
                >
                  {doc}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
 
      {(previewFile || previewText || processing) && (
        <div
          className="preview-modal"
          onClick={() => {
            setPreviewFile(null);
            setPreviewText("");
          }}
        >
          <div
            className="preview-content"
            onClick={(e) => e.stopPropagation()}
          >
            {processing && <p>Processing... Please wait.</p>}
 
            {previewFile && previewFile.toLowerCase().endsWith(".pdf") && (
              <embed
                src={previewFile}
                type="application/pdf"
                width="100%"
                height="600px"
              />
            )}
 
            {previewFile && !previewFile.toLowerCase().endsWith(".pdf") && (
              <img
                src={previewFile}
                alt="Document Preview"
                style={{ maxWidth: "100%", maxHeight: "72vh" }}
              />
            )}
 
            {previewText && (
              <textarea
                value={previewText}
                readOnly
                style={{ width: "100%", height: "400px", resize: "vertical" }}
              />
            )}
 
            <button
              type="button"
              onClick={() => {
                setPreviewFile(null);
                setPreviewText("");
              }}
              className="close-btn"
            >
              Close
            </button>
          </div>
        </div>
      )}
 
      {notification && (
        <div
          style={{
            position: "fixed",
            right: 20,
            top: 20,
            background:
              "linear-gradient(135deg, rgba(122,162,255,0.12), rgba(110,231,183,0.06))",
            color: "#041026",
            padding: "10px 14px",
            borderRadius: 10,
            boxShadow: "0 6px 20px rgba(2,6,23,0.6)",
            zIndex: 1400,
          }}
        >
          {notification}
        </div>
      )}
    </div>
  );
}
 
export default Home;
