import { useState, useRef, useCallback } from "react";

const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState("prompt"); // 'granted', 'denied', 'prompt'

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const onAudioDataRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Check microphone permission
  const checkPermission = useCallback(async () => {
    try {
      if (!navigator.permissions) {
        return "unknown";
      }

      const result = await navigator.permissions.query({ name: "microphone" });
      setPermissionStatus(result.state);
      
      // Listen for permission changes
      result.onchange = () => {
        setPermissionStatus(result.state);
      };

      return result.state;
    } catch (error) {
      console.warn("Permission API not supported:", error);
      return "unknown";
    }
  }, []);

  // Visualize audio level
  const visualizeAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = Math.min(average / 128, 1); // Normalize to 0-1

    setAudioLevel(normalizedLevel);

    animationFrameRef.current = requestAnimationFrame(visualizeAudio);
  }, []);

  // Start recording
  const startRecording = useCallback(
    async (onAudioData) => {
      try {
        setError(null);
        
        // Check permission first
        const permission = await checkPermission();
        if (permission === "denied") {
          throw new Error(
            "Microphone access denied. Please enable microphone permissions in your browser settings."
          );
        }

        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100,
          },
        });

        streamRef.current = stream;
        onAudioDataRef.current = onAudioData;

        // Setup audio context for visualization
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;

        // Start visualization
        visualizeAudio();

        // Setup MediaRecorder
        const mimeType = MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType,
          audioBitsPerSecond: 128000,
        });

        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);

            // Convert to base64 and send
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64Audio = reader.result.split(",")[1];
              if (onAudioDataRef.current) {
                onAudioDataRef.current(base64Audio);
              }
            };
            reader.readAsDataURL(event.data);
          }
        };

        mediaRecorderRef.current.onerror = (event) => {
          console.error("MediaRecorder error:", event.error);
          setError("Recording error: " + event.error.message);
          stopRecording();
        };

        mediaRecorderRef.current.onstop = () => {
          console.log("Recording stopped");
        };

        // Start recording with 1-second chunks
        mediaRecorderRef.current.start(1000);
        setIsRecording(true);
        setPermissionStatus("granted");

        console.log("✅ Recording started");
      } catch (error) {
        console.error("❌ Error starting recording:", error);
        
        let errorMessage = "Failed to start recording";
        
        if (error.name === "NotAllowedError") {
          errorMessage = "Microphone access denied. Please grant permission and try again.";
          setPermissionStatus("denied");
        } else if (error.name === "NotFoundError") {
          errorMessage = "No microphone found. Please connect a microphone and try again.";
        } else if (error.name === "NotReadableError") {
          errorMessage = "Microphone is already in use by another application.";
        } else if (error.name === "OverconstrainedError") {
          errorMessage = "Microphone does not meet the required constraints.";
        } else if (error.message) {
          errorMessage = error.message;
        }

        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [checkPermission, visualizeAudio]
  );

  // Stop recording
  const stopRecording = useCallback(() => {
    try {
      // Stop MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Stop visualization
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      setIsRecording(false);
      setAudioLevel(0);
      audioChunksRef.current = [];

      console.log("✅ Recording stopped");
    } catch (error) {
      console.error("❌ Error stopping recording:", error);
      setError("Failed to stop recording");
    }
  }, []);

  // Toggle recording
  const toggleRecording = useCallback(
    async (onAudioData) => {
      if (isRecording) {
        stopRecording();
      } else {
        await startRecording(onAudioData);
      }
    },
    [isRecording, startRecording, stopRecording]
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check if microphone is available
  const checkMicrophoneAvailability = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const microphones = devices.filter((device) => device.kind === "audioinput");
      return microphones.length > 0;
    } catch (error) {
      console.error("Error checking microphone availability:", error);
      return false;
    }
  }, []);

  return {
    isRecording,
    audioLevel,
    error,
    permissionStatus,
    startRecording,
    stopRecording,
    toggleRecording,
    clearError,
    checkPermission,
    checkMicrophoneAvailability,
  };
};

export default useAudioRecorder;
