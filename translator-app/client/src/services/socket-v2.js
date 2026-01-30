import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.isIntentionalDisconnect = false;
    this.eventHandlers = new Map();
  }

  connect(serverUrl = "http://localhost:3001") {
    if (this.socket && this.socket.connected) {
      console.log("✅ Socket already connected");
      return this.socket;
    }

    console.log("🔌 Connecting to server:", serverUrl);

    this.socket = io(serverUrl, {
      transports: ["websocket", "polling"], // Try WebSocket first, fallback to polling
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: this.maxReconnectDelay,
      timeout: 20000,
      autoConnect: true,
    });

    this.setupEventHandlers();
    return this.socket;
  }

  setupEventHandlers() {
    // Connection events
    this.socket.on("connect", () => {
      console.log("✅ Connected to server:", this.socket.id);
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      
      // Notify listeners
      this.emit("connection-status", { connected: true, socketId: this.socket.id });
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from server. Reason:", reason);
      
      this.emit("connection-status", { connected: false, reason });

      // Handle different disconnect reasons
      if (reason === "io server disconnect") {
        // Server forcefully disconnected - manual reconnect
        if (!this.isIntentionalDisconnect) {
          console.log("🔄 Server disconnected us. Attempting to reconnect...");
          setTimeout(() => {
            if (!this.socket.connected) {
              this.socket.connect();
            }
          }, this.reconnectDelay);
        }
      } else if (reason === "transport close" || reason === "ping timeout") {
        // Network issue - automatic reconnection by socket.io
        console.log("🔄 Network issue detected. Auto-reconnecting...");
      }
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error.message);
      this.reconnectAttempts++;

      // Exponential backoff
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.maxReconnectDelay
      );

      this.emit("connection-error", {
        error: error.message,
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
      });

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("❌ Max reconnection attempts reached");
        this.emit("connection-failed", {
          message: "Failed to connect to server after multiple attempts",
        });
      }
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log("✅ Reconnected after", attemptNumber, "attempts");
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      
      this.emit("reconnected", { attemptNumber });
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      console.log("🔄 Reconnection attempt", attemptNumber);
      this.emit("reconnect-attempt", { attemptNumber });
    });

    this.socket.on("reconnect_error", (error) => {
      console.error("❌ Reconnection error:", error.message);
    });

    this.socket.on("reconnect_failed", () => {
      console.error("❌ Reconnection failed");
      this.emit("reconnect-failed", {
        message: "Unable to reconnect to server",
      });
    });

    // Error handling
    this.socket.on("error", (error) => {
      console.error("❌ Socket error:", error);
      this.emit("socket-error", error);
    });
  }

  // Enhanced event listener management
  on(event, callback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(callback);
    
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
    
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    // Emit to internal handlers
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Room management
  joinRoom(roomId, language) {
    if (!this.socket || !this.socket.connected) {
      throw new Error("Socket not connected. Please wait for connection.");
    }

    console.log(`🚪 Joining room ${roomId} with language ${language}`);
    this.socket.emit("join-room", { roomId, language });
  }

  // Audio streaming with error handling
  sendAudioStream(roomId, audioData, sourceLanguage) {
    if (!this.socket || !this.socket.connected) {
      console.warn("⚠️  Socket not connected. Audio data dropped.");
      return false;
    }

    try {
      this.socket.emit("audio-stream", {
        roomId,
        audioData,
        sourceLanguage,
      });
      return true;
    } catch (error) {
      console.error("❌ Error sending audio stream:", error);
      return false;
    }
  }

  // Text message with error handling
  sendText(roomId, text, sourceLanguage) {
    if (!this.socket || !this.socket.connected) {
      throw new Error("Socket not connected");
    }

    this.socket.emit("send-text", {
      roomId,
      text,
      sourceLanguage,
    });
  }

  // WebRTC signaling
  sendOffer(roomId, offer) {
    if (!this.socket || !this.socket.connected) {
      throw new Error("Socket not connected");
    }

    this.socket.emit("offer", { roomId, offer });
  }

  sendAnswer(roomId, answer) {
    if (!this.socket || !this.socket.connected) {
      throw new Error("Socket not connected");
    }

    this.socket.emit("answer", { roomId, answer });
  }

  sendIceCandidate(roomId, candidate) {
    if (!this.socket || !this.socket.connected) {
      throw new Error("Socket not connected");
    }

    this.socket.emit("ice-candidate", { roomId, candidate });
  }

  // Event listeners for application
  onUserConnected(callback) {
    this.on("user-connected", callback);
  }

  onUserDisconnected(callback) {
    this.on("user-disconnected", callback);
  }

  onRoomState(callback) {
    this.on("room-state", callback);
  }

  onTranscription(callback) {
    this.on("transcription", callback);
  }

  onTranslatedAudio(callback) {
    this.on("translated-audio", callback);
  }

  onTranslatedText(callback) {
    this.on("translated-text", callback);
  }

  onError(callback) {
    this.on("error", callback);
  }

  onConnectionStatus(callback) {
    this.on("connection-status", callback);
  }

  onConnectionError(callback) {
    this.on("connection-error", callback);
  }

  onConnectionFailed(callback) {
    this.on("connection-failed", callback);
  }

  onReconnected(callback) {
    this.on("reconnected", callback);
  }

  onReconnectAttempt(callback) {
    this.on("reconnect-attempt", callback);
  }

  onReconnectFailed(callback) {
    this.on("reconnect-failed", callback);
  }

  // WebRTC event listeners
  onOffer(callback) {
    this.on("offer", callback);
  }

  onAnswer(callback) {
    this.on("answer", callback);
  }

  onIceCandidate(callback) {
    this.on("ice-candidate", callback);
  }

  // Connection state
  isConnected() {
    return this.socket && this.socket.connected;
  }

  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  // Graceful disconnect
  disconnect() {
    if (this.socket) {
      console.log("🔌 Disconnecting from server...");
      this.isIntentionalDisconnect = true;
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Force reconnect
  forceReconnect() {
    console.log("🔄 Forcing reconnection...");
    if (this.socket) {
      this.socket.disconnect();
      setTimeout(() => {
        this.socket.connect();
      }, 500);
    }
  }

  // Health check
  async checkHealth() {
    try {
      const response = await fetch("http://localhost:3001/health");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ Health check failed:", error);
      return null;
    }
  }
}

// Singleton instance
const socketService = new SocketService();

export default socketService;
