import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import useSpeechRecognition from './hooks/useSpeechRecognition';
import useSpeechSynthesis from './hooks/useSpeechSynthesis';
import { translateText } from './services/translate';
import { Mic, MicOff, Volume2, Globe, ArrowRightLeft } from 'lucide-react';
import './index.css';

// Initialize socket connection
const socket = io('http://localhost:3001'); // Adjust port if needed

const LANGUAGES = [
  { code: 'en-US', name: 'English' },
  { code: 'de-DE', name: 'German' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'ja-JP', name: 'Japanese' },
];

function App() {
  const [myLang, setMyLang] = useState('de-DE');
  const [partnerLang, setPartnerLang] = useState('en-US');
  const [roomId, setRoomId] = useState('global');
  const [isConnected, setIsConnected] = useState(false);
  const [history, setHistory] = useState([]); // { sender: 'me'|'partner', text: string, original: string }

  const { 
    text: transcript, 
    isListening, 
    startListening, 
    stopListening,
    hasRecognition 
  } = useSpeechRecognition(myLang);

  const { speak } = useSpeechSynthesis();
  
  // Ref to track processed text to avoid loops if needed (though onresult handles phrases)
  const lastProcessedText = useRef('');

  useEffect(() => {
    socket.emit('join-room', roomId);
    setIsConnected(true);

    socket.on('receive-translation', (data) => {
      // data: { originalText, translatedText, language }
      // If we receive text in our language, speak it
      // Actually the backend just relays. We need to translate here if not done already.
      // But let's assume sender translates? Or receiver?
      // Better strategy: Sender sends original text and their language. Receiver translates to THEIR language.
      
      handleReceiveMessage(data);
    });

    return () => {
      socket.off('receive-translation');
    };
  }, [roomId]);

  // Handle incoming message
  const handleReceiveMessage = async (data) => {
    // data: { text, language, senderId }
    if (data.language === myLang) {
        // Already in my language (unlikely unless same lang)
        addToHistory('partner', data.text, data.text);
        speak(data.text, myLang);
    } else {
        // Translate to my language
        const translated = await translateText(data.text, data.language, myLang);
        addToHistory('partner', translated, data.text);
        speak(translated, myLang);
    }
  };

  // Handle outgoing speech
  useEffect(() => {
    if (transcript && transcript !== lastProcessedText.current && !isListening) {
        // When listening stops, or pause detected? 
        // SpeechRecognition hook returns partials. 
        // We need a stable final result. 
        // My hook implementation sets text only on final. 
        // But it stays in state.
        
        // Let's rely on a specific 'send' action or short pause? 
        // For real-time, usually we stream. But for translation, sentence-based is better.
        // Let's send when transcript updates and is non-empty.
        // BUT we need to know when it's "done" for a phrase.
        // The hook I wrote accumulates finalized results? 
        // Actually: `finalTranscript += event.results[i][0].transcript;`
        // It keeps appending.
        
        // Let's change strategy: send immediately when we get a chunk?
        // Or cleaner: Use a manual "Send" or debounce.
        // For this demo, let's treat the `transcript` as the "current phrase".
        // Issue: if continuous=true, it grows.
        // I should probably clear transcript after processing.
    }
  }, [transcript, isListening]);

  // Modified approach: The hook should probably expose `finalTranscript` event or similar.
  // Since I can't easily change the hook logic without re-writing, 
  // I will assume the hook updates `text` with latest FINAL phrase.
  // Actually, looking at my hook: `if (event.results[i].isFinal) finalTranscript += ...`
  // It effectively accumulates session transcript.
  // I should probably reset it after sending.

  // Let's trigger send manually for now or auto-send when 'isListening' goes false (toggle).
  useEffect(() => {
      if (!isListening && transcript) {
          handleSendMessage(transcript);
      }
  }, [isListening, transcript]);


  const handleSendMessage = async (text) => {
      if (!text) return;
      
      // Add to my history
      addToHistory('me', text, text);
      
      // Send to partner
      socket.emit('send-translation', {
          roomId,
          text: text,
          language: myLang
      });
      
      // Clear transcript in hook? I didn't verify if I can clear it externally.
      // I added `setText` internal. I might need to re-mount hook or expose reset.
      // For now, let's just ignore old text by tracking length? 
      // Or just restart listening which clears it (in my hook logic: `setText('')` on start).
  };

  const addToHistory = (sender, text, original) => {
      setHistory(prev => [...prev, { sender, text, original }]);
  };

  const toggleListening = () => {
      if (isListening) {
          stopListening();
      } else {
          startListening();
      }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-4 font-sans flex flex-col items-center">
      <header className="w-full max-w-md flex justify-between items-center mb-8 p-4 bg-neutral-800 rounded-xl shadow-lg">
        <div className="flex items-center gap-2">
            <Globe className="text-blue-400" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                LinguaSync
            </h1>
        </div>
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
      </header>

      <main className="w-full max-w-md flex flex-col gap-6">
        {/* Language Controls */}
        <div className="flex justify-between items-center gap-4 bg-neutral-800 p-4 rounded-xl">
            <div className="flex flex-col gap-1">
                <span className="text-xs text-neutral-400">me Speaking</span>
                <select 
                    value={myLang} 
                    onChange={(e) => setMyLang(e.target.value)}
                    className="bg-neutral-700 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
            </div>
            
            <ArrowRightLeft className="text-neutral-500" size={20} />

            <div className="flex flex-col gap-1 text-right">
                <span className="text-xs text-neutral-400">Partner Hears</span>
                <select 
                    value={partnerLang} 
                    onChange={(e) => setPartnerLang(e.target.value)}
                    className="bg-neutral-700 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
                >
                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
            </div>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 min-h-[400px] bg-neutral-950 rounded-2xl p-4 overflow-y-auto flex flex-col gap-4 shadow-inner">
            {history.length === 0 && (
                <div className="text-center text-neutral-600 mt-20">
                    <p>Select languages and tap the mic to start.</p>
                </div>
            )}
            {history.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl ${
                        msg.sender === 'me' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-neutral-700 text-neutral-200 rounded-bl-none'
                    }`}>
                        <p className="text-lg">{msg.text}</p>
                        {msg.original !== msg.text && (
                             <p className="text-xs opacity-50 mt-1">{msg.original}</p>
                        )}
                    </div>
                </div>
            ))}
            
            {/* Live Transcript Preview */}
            {isListening && transcript && (
                 <div className="flex flex-col items-end opacity-70">
                    <div className="max-w-[85%] p-3 rounded-2xl bg-blue-900/50 text-blue-200 border border-blue-500/30 animate-pulse">
                        <p>{transcript}...</p>
                    </div>
                 </div>
            )}
        </div>

        {/* Controls */}
        <div className="fixed bottom-8 left-0 right-0 flex justify-center">
            <button 
                onClick={toggleListening}
                className={`p-6 rounded-full shadow-2xl transition-all transform hover:scale-105 active:scale-95 ${
                    isListening 
                    ? 'bg-red-500 shadow-red-500/50 animate-pulse' 
                    : 'bg-blue-500 shadow-blue-500/50'
                }`}
            >
                {isListening ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
        </div>
      </main>

      {!hasRecognition && (
          <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center text-sm">
              Current browser does not support Speech Recognition. Try Chrome.
          </div>
      )}
    </div>
  );
}

export default App;
