import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3001";

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on("connect", () => {
        console.log("Connected to server:", this.socket.id);
      });

      this.socket.on("disconnect", () => {
        console.log("Disconnected from server");
      });

      this.socket.on("error", (error) => {
        console.error("Socket error:", error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(roomId, language) {
    if (this.socket) {
      this.socket.emit("join-room", { roomId, language });
    }
  }

  sendAudioStream(roomId, audioData, sourceLanguage) {
    if (this.socket) {
      this.socket.emit("audio-stream", {
        roomId,
        audioData,
        sourceLanguage,
      });
    }
  }

  sendText(roomId, text, sourceLanguage) {
    if (this.socket) {
      this.socket.emit("send-text", {
        roomId,
        text,
        sourceLanguage,
      });
    }
  }

  onUserConnected(callback) {
    if (this.socket) {
      this.socket.on("user-connected", callback);
    }
  }

  onUserDisconnected(callback) {
    if (this.socket) {
      this.socket.on("user-disconnected", callback);
    }
  }

  onRoomState(callback) {
    if (this.socket) {
      this.socket.on("room-state", callback);
    }
  }

  onTranscription(callback) {
    if (this.socket) {
      this.socket.on("transcription", callback);
    }
  }

  onTranslatedAudio(callback) {
    if (this.socket) {
      this.socket.on("translated-audio", callback);
    }
  }

  onTranslatedText(callback) {
    if (this.socket) {
      this.socket.on("translated-text", callback);
    }
  }

  onError(callback) {
    if (this.socket) {
      this.socket.on("error", callback);
    }
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();
