import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Globe,
  Users,
  MessageCircle,
  Volume2,
  Settings,
  Copy,
  Check,
} from "lucide-react";
import socketService from "./services/socket";
import useAudioRecorder from "./hooks/useAudioRecorder";
import useAudioPlayer from "./hooks/useAudioPlayer";
import "./App.css";

const SUPPORTED_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Russian",
  "Japanese",
  "Korean",
  "Chinese",
  "Arabic",
  "Hindi",
  "Turkish",
  "Dutch",
  "Polish",
];

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const [inCall, setInCall] = useState(false);
  const [messages, setMessages] = useState([]);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [copiedRoom, setCopiedRoom] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { isRecording, audioLevel, startRecording, stopRecording } =
    useAudioRecorder();
  const { playAudio, isPlaying } = useAudioPlayer();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const socket = socketService.connect();

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socketService.onUserConnected((data) => {
      setConnectedUsers((prev) => [...prev, data]);
      addMessage("system", `User joined speaking ${data.language}`);
    });

    socketService.onUserDisconnected((socketId) => {
      setConnectedUsers((prev) => prev.filter((u) => u.socketId !== socketId));
      addMessage("system", "User left the call");
    });

    socketService.onRoomState((data) => {
      setConnectedUsers(data.users);
    });

    socketService.onTranscription((data) => {
      addMessage("sent", data.text, data.language);
    });

    socketService.onTranslatedAudio((data) => {
      addMessage(
        "received",
        data.translatedText,
        data.targetLanguage,
        data.originalText,
      );
      playAudio(data.audioData);
    });

    socketService.onTranslatedText((data) => {
      addMessage(
        "received",
        data.translatedText,
        data.targetLanguage,
        data.originalText,
      );
    });

    socketService.onError((error) => {
      console.error("Socket error:", error);
      addMessage("error", error.message);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addMessage = (type, text, language, originalText) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type,
        text,
        language,
        originalText,
        timestamp: new Date(),
      },
    ]);
  };

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    socketService.joinRoom(newRoomId, selectedLanguage);
    setInCall(true);
    addMessage(
      "system",
      `Neuer Raum erstellt: ${newRoomId} (${selectedLanguage})`,
    );
  };

  const handleJoinRoom = () => {
    if (!roomInput.trim()) {
      addMessage("error", "Bitte gib eine Raumnummer ein");
      return;
    }
    setRoomId(roomInput.trim().toUpperCase());
    socketService.joinRoom(roomInput.trim().toUpperCase(), selectedLanguage);
    setInCall(true);
    addMessage(
      "system",
      `Raum ${roomInput.trim().toUpperCase()} beigetreten (${selectedLanguage})`,
    );
  };

  const handleLeaveCall = () => {
    stopRecording();
    setInCall(false);
    setMessages([]);
    setConnectedUsers([]);
    addMessage("system", "Left the call");
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      try {
        await startRecording((audioData) => {
          socketService.sendAudioStream(roomId, audioData, selectedLanguage);
        });
      } catch (error) {
        console.error("Failed to start recording:", error);
        addMessage(
          "error",
          "Failed to access microphone. Please grant permission.",
        );
      }
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedRoom(true);
    setTimeout(() => setCopiedRoom(false), 2000);
  };

  return (
    <div className="app-container">
      {/* Animated background */}
      <div className="background-animation">
        <div className="gradient-sphere gradient-sphere-1"></div>
        <div className="gradient-sphere gradient-sphere-2"></div>
        <div className="gradient-sphere gradient-sphere-3"></div>
      </div>

      <div className="main-content">
        {!inCall ? (
          // Landing / Setup Screen
          <div className="setup-screen animate-fade-in">
            <div className="logo-section">
              <div className="logo-icon">
                <Globe size={48} className="animate-wave" />
              </div>
              <h1 className="app-title gradient-text">Universal Translator</h1>
              <p className="app-subtitle">Übersetze Gespräche in Echtzeit</p>
            </div>

            <div className="setup-card glass">
              <div className="setup-header">
                <h2>Anruf starten</h2>
                <p>Verbinde dich in jeder Sprache</p>
              </div>

              <div className="form-group">
                <label htmlFor="sourceLanguage">Meine Sprache</label>
                <div className="select-wrapper">
                  <Globe size={20} className="select-icon" />
                  <select
                    id="sourceLanguage"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="language-select"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="targetLanguage">Ziel-Sprache</label>
                <div className="select-wrapper">
                  <Globe size={20} className="select-icon" />
                  <select
                    id="targetLanguage"
                    className="language-select"
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="roomNumber">Raum Nummer</label>
                <div className="room-input-wrapper">
                  <Users
                    size={20}
                    className="select-icon"
                    style={{
                      position: "absolute",
                      left: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      opacity: 0.5,
                    }}
                  />
                  <input
                    id="roomNumber"
                    type="text"
                    placeholder="Z.B. ABC123"
                    className="room-input"
                    style={{ paddingLeft: "48px" }}
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && roomInput.trim()) {
                        handleJoinRoom();
                      }
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
                <button
                  onClick={handleJoinRoom}
                  disabled={!isConnected || !roomInput.trim()}
                  className="btn-join"
                  style={{ flex: 1 }}
                >
                  <Users size={24} />
                  Raum beitreten
                </button>

                <button
                  onClick={handleCreateRoom}
                  disabled={!isConnected}
                  className="btn-join"
                  style={{
                    flex: 1,
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  }}
                >
                  <Globe size={24} />
                  Neuer Raum
                </button>
              </div>

              {!isConnected && (
                <div className="connection-status error">
                  <div className="status-dot"></div>
                  Verbinde mit Server...
                </div>
              )}
            </div>
          </div>
        ) : (
          // Call Screen
          <div className="call-screen animate-fade-in">
            {/* Header */}
            <div className="call-header glass">
              <div className="call-info">
                <div className="room-badge">
                  <span className="room-label">Room:</span>
                  <span className="room-id">{roomId}</span>
                  <button
                    onClick={copyRoomId}
                    className="copy-btn"
                    title="Copy Room ID"
                  >
                    {copiedRoom ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <div className="language-badge">
                  <Globe size={16} />
                  {selectedLanguage}
                </div>
              </div>

              <div className="call-actions">
                <button
                  className="settings-btn"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings size={20} />
                </button>
                <div className="users-count">
                  <Users size={20} />
                  <span>{connectedUsers.length + 1}</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="messages-container glass-dark">
              <div className="messages-scroll">
                {messages.length === 0 ? (
                  <div className="empty-messages">
                    <MessageCircle size={48} opacity={0.3} />
                    <p>Start speaking to see translations</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message message-${msg.type} animate-slide-in`}
                    >
                      {msg.type === "system" ? (
                        <div className="message-system">
                          <div className="system-icon"></div>
                          <span>{msg.text}</span>
                        </div>
                      ) : msg.type === "error" ? (
                        <div className="message-error">
                          <span>⚠️ {msg.text}</span>
                        </div>
                      ) : (
                        <div className="message-bubble">
                          <div className="message-header">
                            <span className="message-lang">{msg.language}</span>
                            <span className="message-time">
                              {msg.timestamp.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="message-text">{msg.text}</div>
                          {msg.originalText && (
                            <div className="message-original">
                              Original: {msg.originalText}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Controls */}
            <div className="call-controls glass">
              <div className="audio-visualizer">
                {isRecording && (
                  <div className="audio-bars">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="audio-bar"
                        style={{
                          height: `${Math.max(10, audioLevel * 100 * (Math.random() * 0.5 + 0.5))}%`,
                          animationDelay: `${i * 50}ms`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="control-buttons">
                <button
                  onClick={handleToggleRecording}
                  className={`btn-mic ${isRecording ? "recording" : ""}`}
                >
                  {isRecording ? <Mic size={32} /> : <MicOff size={32} />}
                  <span className="btn-label">
                    {isRecording ? "Speaking..." : "Tap to Speak"}
                  </span>
                </button>

                <button onClick={handleLeaveCall} className="btn-end-call">
                  <PhoneOff size={24} />
                  <span className="btn-label">End Call</span>
                </button>
              </div>

              {isPlaying && (
                <div className="playing-indicator animate-pulse-slow">
                  <Volume2 size={20} />
                  <span>Playing translation...</span>
                </div>
              )}
            </div>

            {/* Connected Users Panel */}
            {connectedUsers.length > 0 && (
              <div className="users-panel glass">
                <h3>Connected Users</h3>
                <div className="users-list">
                  {connectedUsers.map((user) => (
                    <div key={user.socketId} className="user-item">
                      <div className="user-avatar">
                        <Globe size={16} />
                      </div>
                      <span className="user-language">{user.language}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <p className="text-shadow">🌍 Uniting Humanity Through Language</p>
      </footer>
    </div>
  );
}

export default App;
