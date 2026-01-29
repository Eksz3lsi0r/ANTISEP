import { useState, useEffect, useCallback } from 'react';

const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    window.speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices();

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text, lang = 'en-US') => {
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    
    // Attempt to find a matching voice for the language
    const voice = voices.find(v => v.lang.startsWith(lang));
    if (voice) {
        utterance.voice = voice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
        console.error("Speech synthesis error", e);
        setIsSpeaking(false);
    };

    window.speechSynthesis.cancel(); // Stop previous
    window.speechSynthesis.speak(utterance);
  }, [voices]);

  return { speak, isSpeaking, voices };
};

export default useSpeechSynthesis;
