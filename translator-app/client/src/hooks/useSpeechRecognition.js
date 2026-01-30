import { useEffect, useState, useCallback, useMemo } from "react";

const useSpeechRecognition = (language = "en-US") => {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    return SpeechRecognition
      ? null
      : "Browser does not support Speech Recognition";
  });
  // Memoize the recognition instance to avoid setting state in useEffect
  const recognition = useMemo(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = language;
      return recognitionInstance;
    }
    return null;
  }, [language]);

  useEffect(() => {
    if (!recognition) return;

    const handleResult = (event) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setText(finalTranscript);
      }
    };

    const handleError = (event) => {
      console.error("Speech recognition error", event.error);
      setError(event.error);
      if (event.error === "not-allowed") {
        setIsListening(false);
      }
    };

    const handleEnd = () => {
      // Auto restart logic if needed, currently placeholder
    };

    recognition.addEventListener("result", handleResult);
    recognition.addEventListener("error", handleError);
    recognition.addEventListener("end", handleEnd);

    return () => {
      recognition.removeEventListener("result", handleResult);
      recognition.removeEventListener("error", handleError);
      recognition.removeEventListener("end", handleEnd);
      // Abort recognition if the component unmounts or language changes
      recognition.abort();
    };
  }, [recognition]);

  const startListening = useCallback(() => {
    if (recognition) {
      try {
        recognition.start();
        setIsListening(true);
        setText("");
      } catch (e) {
        console.error("Error starting recognition", e);
      }
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition]);

  return {
    text,
    isListening,
    startListening,
    stopListening,
    hasRecognition: !!recognition,
    error,
  };
};

export default useSpeechRecognition;
