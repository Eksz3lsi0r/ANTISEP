import { useEffect, useState, useCallback } from 'react';

const useSpeechRecognition = (language = 'en-US') => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = language;

      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
           setText(finalTranscript);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setError(event.error);
        if (event.error === 'not-allowed') {
            setIsListening(false);
        }
      };
      
      recognitionInstance.onend = () => {
          // Auto restart if it was supposed to be listening? 
          // For now, let's just update state
          if (isListening) {
             // recognitionInstance.start(); // aggressive restart
             // or just let it stop
          }
      };

      setRecognition(recognitionInstance);
    } else {
      setError('Browser does not support Speech Recognition');
    }
  }, [language]);

  const startListening = useCallback(() => {
    if (recognition) {
      try {
          recognition.start();
          setIsListening(true);
          setText(''); 
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

  return { text, isListening, startListening, stopListening, hasRecognition: !!recognition, error };
};

export default useSpeechRecognition;
