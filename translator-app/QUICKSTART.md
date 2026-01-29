# 🚀 Quick Start Guide

## Prerequisites Checklist

Before starting, make sure you have:

- [x] Node.js 18+ installed
- [ ] OpenAI API key (get from https://platform.openai.com/api-keys)
- [ ] Microphone access permissions

## Step-by-Step Setup

### 1. Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (you won't be able to see it again!)

### 2. Add Your API Key

Open the file `server/.env` and replace `your_openai_api_key_here` with your actual API key:

```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
PORT=3001
```

### 3. Start the Application

From the project root directory, run:

```bash
./start.sh
```

Or if that doesn't work:

```bash
chmod +x start.sh
./start.sh
```

### 4. Open in Browser

The app will automatically open at:

```
http://localhost:5173
```

## First Call Test

### To test by yourself:

1. Open the app in two different browser windows/tabs
2. In Window 1:
   - Select "English" as your language
   - Click "Create New Call"
   - Copy the Room ID shown
3. In Window 2:
   - Select "Spanish" (or any other language)
   - Paste the Room ID
   - Click "Join Call"
4. Grant microphone access in both windows
5. In Window 1, click the microphone and say "Hello, how are you?"
6. In Window 2, you should hear the Spanish translation!

### To test with a friend:

1. Start a call and select your language
2. Copy the Room ID
3. Send the Room ID to your friend
4. They enter the Room ID and select their language
5. Start speaking - you'll hear each other in your own languages!

## Common Issues

### "Failed to access microphone"

- Make sure you granted microphone permissions
- Check your browser settings
- Try using Chrome/Firefox (Safari has limited support)

### "Connection error"

- Make sure the server is running
- Check that nothing is using port 3001
- Try restarting both server and client

### "Translation not working"

- Verify your OpenAI API key is correct in `server/.env`
- Check your OpenAI account has credits
- Look at the server console for error messages

### "No sound"

- Check your system volume
- Make sure speakers/headphones are connected
- Try using headphones to prevent echo

## Tips for Best Experience

1. **Use headphones** - Prevents echo and feedback
2. **Speak clearly** - Pause between sentences for better transcription
3. **Good internet** - Required for real-time translation
4. **Quiet environment** - Reduces background noise in transcription

## Cost Estimation

Each minute of translated conversation costs approximately:

- Whisper (Speech-to-Text): $0.006
- GPT-4 Turbo (Translation): $0.01-0.03
- TTS (Text-to-Speech): $0.015

**Total: ~$0.03-0.05 per minute**

A 10-minute conversation = ~$0.30-0.50

## Need Help?

Check the main README.md for more detailed documentation.

---

**🌍 Enjoy breaking language barriers!**
