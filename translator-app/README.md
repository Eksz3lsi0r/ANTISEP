# 🌍 Universal Translator - Real-time Voice Translation

**Breaking language barriers in real-time**

A revolutionary real-time voice translation application that enables people speaking different languages to communicate seamlessly through voice calls. Using cutting-edge AI technology, this app transcribes speech, translates it, and converts it back to speech in real-time.

## ✨ Features

- 🎤 **Real-time Voice Translation** - Speak and hear translations instantly
- 🌐 **15+ Languages Supported** - English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Arabic, Hindi, Turkish, Dutch, Polish
- 🔊 **Text-to-Speech (TTS)** - Hear translations in natural-sounding voices
- 📝 **Live Transcription** - See both original and translated text
- 👥 **Multi-user Support** - Multiple users can join the same conversation
- 🎨 **Beautiful UI** - Modern, glass-morphic design with smooth animations
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🔒 **Privacy Focused** - No conversation data is stored

## 🚀 Technology Stack

### Backend

- **Node.js + Express** - Server framework
- **Socket.io** - Real-time bidirectional communication
- **OpenAI Whisper API** - Speech-to-Text (industry-leading accuracy)
- **OpenAI GPT-4 Turbo** - Translation (fast + high quality)
- **OpenAI TTS** - Text-to-Speech (natural voices)

### Frontend

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **Lucide React** - Beautiful icons
- **Web Audio API** - Audio recording and playback
- **MediaRecorder API** - Audio capture

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key (get one at https://platform.openai.com/api-keys)
- Microphone access

## 🛠️ Installation

1. **Clone or navigate to the project directory**

2. **Set up the server**

```bash
cd server
npm install
```

3. **Create environment file**

```bash
cp .env.example .env
```

4. **Add your OpenAI API key to `.env`**

```
OPENAI_API_KEY=your_actual_api_key_here
PORT=3001
```

5. **Set up the client**

```bash
cd ../client
npm install
```

## 🎯 Running the Application

### Option 1: Run both server and client together (Recommended)

From the project root directory:

```bash
chmod +x start.sh
./start.sh
```

### Option 2: Run separately

**Terminal 1 - Start the server:**

```bash
cd server
npm start
```

**Terminal 2 - Start the client:**

```bash
cd client
npm run dev
```

The application will open at `http://localhost:5173`

## 📱 How to Use

### Starting a Call

1. **Select Your Language** - Choose the language you'll be speaking
2. **Create or Join a Room**
   - Leave the Room ID empty to create a new room
   - OR enter an existing Room ID to join someone else's call
3. **Click "Create New Call" or "Join Call"**
4. **Share the Room ID** - Give the Room ID to others so they can join

### During a Call

1. **Tap the Microphone Button** - Hold or tap to start speaking
2. **Speak Naturally** - Your speech will be:
   - Transcribed to text
   - Translated to other participants' languages
   - Converted to speech and played to them
3. **See Translations** - View both original and translated messages in real-time
4. **End Call** - Click the red phone button when finished

### Tips for Best Results

- **Speak clearly** and at a moderate pace
- **Avoid background noise** for better transcription accuracy
- **Use headphones** to prevent echo and feedback
- **Grant microphone permissions** when prompted
- **Stable internet connection** recommended for real-time performance

## 🏗️ Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   User 1    │         │   Server    │         │   User 2    │
│  (English)  │◄───────►│  (Node.js)  │◄───────►│  (Spanish)  │
└─────────────┘         └─────────────┘         └─────────────┘
      │                        │                        │
      │ 1. Speak              │                        │
      │ 2. Audio Stream       │                        │
      ├──────────────────────►│                        │
      │                       │ 3. Whisper STT         │
      │                       │    (Audio → Text)      │
      │                       │                        │
      │                       │ 4. GPT-4 Translation   │
      │                       │    (English → Spanish) │
      │                       │                        │
      │                       │ 5. TTS                 │
      │                       │    (Text → Audio)      │
      │                       │                        │
      │                       ├───────────────────────►│
      │                       │ 6. Translated Audio    │
      │                       │                        │ 7. Play Audio
```

### Data Flow

1. **Audio Capture** - User speaks, audio is captured via MediaRecorder API
2. **Stream to Server** - Audio chunks sent via WebSocket (Socket.io)
3. **Speech-to-Text** - OpenAI Whisper transcribes audio to text
4. **Translation** - GPT-4 Turbo translates text to target language
5. **Text-to-Speech** - OpenAI TTS generates natural-sounding audio
6. **Stream to Client** - Translated audio sent back via WebSocket
7. **Playback** - Audio automatically plays for the recipient

## 🎨 Design Philosophy

This application uses modern web design principles:

- **Glass-morphism** - Translucent, frosted-glass UI elements
- **Gradient Aesthetics** - Vibrant color gradients throughout
- **Micro-animations** - Smooth transitions and feedback
- **Responsive Typography** - Inter font family for readability
- **Dynamic Backgrounds** - Animated gradient spheres
- **Dark Mode** - Easy on the eyes, premium feel

## 🔧 Configuration

### Supported Languages

The app currently supports these languages:

- English, Spanish, French, German, Italian
- Portuguese, Russian, Japanese, Korean, Chinese
- Arabic, Hindi, Turkish, Dutch, Polish

### API Costs (OpenAI)

Approximate costs per minute of conversation:

- **Whisper (STT)**: ~$0.006/minute
- **GPT-4 Turbo (Translation)**: ~$0.01-0.03/minute
- **TTS**: ~$0.015/minute

**Total**: ~$0.03-0.05 per minute of translated conversation

### Performance Optimizations

- Audio chunks sent every 1 second for near real-time translation
- GPT-4 Turbo used for fastest translation speed
- TTS-1 model used (faster than TTS-1-HD)
- WebSocket for low-latency communication
- Client-side audio buffering for smooth playback

## 🚧 Known Limitations

1. **Latency** - Translation takes 2-4 seconds due to API processing
2. **API Costs** - Requires OpenAI API credits
3. **Internet Dependent** - Requires stable internet connection
4. **Browser Support** - Requires modern browsers with Web Audio API
5. **Simultaneous Speech** - Works best when speakers take turns

## 🛣️ Future Enhancements

- [ ] WebRTC for peer-to-peer audio (lower latency)
- [ ] Support for additional translation providers (DeepL, Google)
- [ ] Offline mode with local models (Whisper.cpp)
- [ ] Video call support
- [ ] Conversation history and transcripts
- [ ] Custom voice selection
- [ ] Background noise suppression
- [ ] Mobile apps (React Native)
- [ ] Group calls (3+ participants)
- [ ] End-to-end encryption

## 🤝 Contributing

This project aims to unite humanity through breaking language barriers. Contributions are welcome!

## 📄 License

MIT License - Feel free to use this for good!

## 🌟 Acknowledgments

- OpenAI for their incredible AI APIs
- The open-source community
- Everyone working towards a more connected world

---

**🌍 Uniting Humanity Through Language**

Made with ❤️ for a world without language barriers
