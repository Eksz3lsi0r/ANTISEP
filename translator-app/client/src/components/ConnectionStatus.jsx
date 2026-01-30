import { useState, useEffect } from "react";
import { Wifi, WifiOff, AlertCircle, RefreshCw } from "lucide-react";
import socketService from "../services/socket-v2";

const ConnectionStatus = () => {
  const [status, setStatus] = useState({
    connected: false,
    reconnecting: false,
    error: null,
    attemptNumber: 0,
  });

  useEffect(() => {
    // Connection status listener
    socketService.onConnectionStatus((data) => {
      setStatus((prev) => ({
        ...prev,
        connected: data.connected,
        reconnecting: false,
        error: null,
      }));
    });

    // Connection error listener
    socketService.onConnectionError((data) => {
      setStatus((prev) => ({
        ...prev,
        connected: false,
        reconnecting: true,
        error: data.error,
        attemptNumber: data.attempt,
      }));
    });

    // Reconnect attempt listener
    socketService.onReconnectAttempt((data) => {
      setStatus((prev) => ({
        ...prev,
        reconnecting: true,
        attemptNumber: data.attemptNumber,
      }));
    });

    // Reconnected listener
    socketService.onReconnected(() => {
      setStatus({
        connected: true,
        reconnecting: false,
        error: null,
        attemptNumber: 0,
      });
    });

    // Connection failed listener
    socketService.onConnectionFailed((data) => {
      setStatus({
        connected: false,
        reconnecting: false,
        error: data.message,
        attemptNumber: 0,
      });
    });

    // Initial status
    setStatus((prev) => ({
      ...prev,
      connected: socketService.isConnected(),
    }));
  }, []);

  const handleReconnect = () => {
    socketService.forceReconnect();
  };

  if (status.connected && !status.reconnecting) {
    return (
      <div className="connection-status success">
        <Wifi size={16} />
        <span>Connected</span>
      </div>
    );
  }

  if (status.reconnecting) {
    return (
      <div className="connection-status warning">
        <RefreshCw size={16} className="animate-spin" />
        <span>Reconnecting... (Attempt {status.attemptNumber})</span>
      </div>
    );
  }

  if (!status.connected) {
    return (
      <div className="connection-status error">
        <WifiOff size={16} />
        <span>{status.error || "Disconnected"}</span>
        <button
          onClick={handleReconnect}
          className="reconnect-button"
          style={{
            marginLeft: "8px",
            padding: "4px 8px",
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            borderRadius: "4px",
            color: "white",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return null;
};

export default ConnectionStatus;
