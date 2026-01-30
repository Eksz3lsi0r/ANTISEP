import { useState, useEffect } from "react";
import { AlertCircle, X } from "lucide-react";
import socketService from "../services/socket-v2";

const ErrorNotification = () => {
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    // Listen for errors from socket
    socketService.onError((error) => {
      addError(error.message || "An error occurred");
    });

    // Listen for socket errors
    socketService.on("socket-error", (error) => {
      addError(error.message || "Socket error occurred");
    });
  }, []);

  const addError = (message) => {
    const id = Date.now();
    setErrors((prev) => [...prev, { id, message }]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeError(id);
    }, 5000);
  };

  const removeError = (id) => {
    setErrors((prev) => prev.filter((error) => error.id !== id));
  };

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="error-notifications">
      {errors.map((error) => (
        <div key={error.id} className="error-notification animate-slide-in">
          <AlertCircle size={20} />
          <span>{error.message}</span>
          <button
            onClick={() => removeError(error.id)}
            className="close-button"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ErrorNotification;
