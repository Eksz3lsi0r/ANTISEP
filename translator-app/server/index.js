const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with client URL
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 1e8, // 100 MB for audio data
});

// Store active rooms and their language preferences
const activeRooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (data) => {
    const { roomId, language } = data;
    socket.join(roomId);

    // Initialize room if it doesn't exist
    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, { users: [] });
    }

    const room = activeRooms.get(roomId);
    room.users.push({ socketId: socket.id, language });

    console.log(
      `User ${socket.id} joined room ${roomId} with language ${language}`,
    );
    socket.to(roomId).emit("user-connected", { socketId: socket.id, language });

    // Send current room state to the new user
    const otherUsers = room.users.filter((u) => u.socketId !== socket.id);
    socket.emit("room-state", { users: otherUsers });
  });

  // Handle real-time audio streaming for transcription
  socket.on("audio-stream", async (data) => {
    try {
      const { roomId, audioData, sourceLanguage } = data;

      // Convert base64 audio to buffer
      const audioBuffer = Buffer.from(audioData, "base64");

      // Transcribe using Whisper
      const transcription = await transcribeAudio(audioBuffer, sourceLanguage);

      if (transcription && transcription.text) {
        // Get target languages for translation
        const room = activeRooms.get(roomId);
        if (room) {
          const targetLanguages = room.users
            .filter((u) => u.socketId !== socket.id)
            .map((u) => u.language);

          // Translate to each target language
          for (const targetLang of targetLanguages) {
            if (targetLang !== sourceLanguage) {
              const translation = await translateText(
                transcription.text,
                sourceLanguage,
                targetLang,
              );

              // Generate TTS for the translation
              const audioResponse = await generateSpeech(
                translation,
                targetLang,
              );

              // Send to users with that language preference
              const targetUsers = room.users.filter(
                (u) => u.language === targetLang,
              );
              targetUsers.forEach((user) => {
                io.to(user.socketId).emit("translated-audio", {
                  originalText: transcription.text,
                  translatedText: translation,
                  audioData: audioResponse.toString("base64"),
                  sourceLanguage,
                  targetLanguage: targetLang,
                });
              });
            }
          }

          // Echo back to sender for UI display
          socket.emit("transcription", {
            text: transcription.text,
            language: sourceLanguage,
          });
        }
      }
    } catch (error) {
      console.error("Error processing audio stream:", error);
      socket.emit("error", { message: "Failed to process audio" });
    }
  });

  // Handle text-based translation (fallback or testing)
  socket.on("send-text", async (data) => {
    try {
      const { roomId, text, sourceLanguage } = data;
      const room = activeRooms.get(roomId);

      if (room) {
        const targetLanguages = room.users
          .filter((u) => u.socketId !== socket.id)
          .map((u) => u.language);

        for (const targetLang of targetLanguages) {
          if (targetLang !== sourceLanguage) {
            const translation = await translateText(
              text,
              sourceLanguage,
              targetLang,
            );

            const targetUsers = room.users.filter(
              (u) => u.language === targetLang,
            );
            targetUsers.forEach((user) => {
              io.to(user.socketId).emit("translated-text", {
                originalText: text,
                translatedText: translation,
                sourceLanguage,
                targetLanguage: targetLang,
              });
            });
          }
        }
      }
    } catch (error) {
      console.error("Error translating text:", error);
      socket.emit("error", { message: "Failed to translate text" });
    }
  });

  // WebRTC signaling for direct peer-to-peer audio
  socket.on("offer", (data) => {
    socket
      .to(data.roomId)
      .emit("offer", { offer: data.offer, from: socket.id });
  });

  socket.on("answer", (data) => {
    socket
      .to(data.roomId)
      .emit("answer", { answer: data.answer, from: socket.id });
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.roomId).emit("ice-candidate", {
      candidate: data.candidate,
      from: socket.id,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Remove user from all rooms
    activeRooms.forEach((room, roomId) => {
      const userIndex = room.users.findIndex((u) => u.socketId === socket.id);
      if (userIndex !== -1) {
        room.users.splice(userIndex, 1);
        io.to(roomId).emit("user-disconnected", socket.id);

        // Clean up empty rooms
        if (room.users.length === 0) {
          activeRooms.delete(roomId);
        }
      }
    });
  });
});

// Transcribe audio using OpenAI Whisper
async function transcribeAudio(audioBuffer, language) {
  try {
    // Create a File-like object from the buffer
    const file = new File([audioBuffer], "audio.webm", { type: "audio/webm" });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: getWhisperLanguageCode(language),
      response_format: "json",
    });

    return transcription;
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
}

// Translate text using GPT-4 Turbo (optimized for speed and quality)
async function translateText(text, sourceLanguage, targetLanguage) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // Fast and high quality
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}. Provide ONLY the translation, no explanations or additional text. Preserve the tone, emotion, and context of the original message.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent translations
      max_tokens: 1000,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

// Generate speech using OpenAI TTS
async function generateSpeech(text, language) {
  try {
    const voice = getVoiceForLanguage(language);

    const mp3 = await openai.audio.speech.create({
      model: "tts-1", // Fast model for real-time use
      voice: voice,
      input: text,
      speed: 1.0,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error("TTS error:", error);
    throw error;
  }
}

// Map language to Whisper language codes
function getWhisperLanguageCode(language) {
  const languageMap = {
    English: "en",
    Spanish: "es",
    French: "fr",
    German: "de",
    Italian: "it",
    Portuguese: "pt",
    Russian: "ru",
    Japanese: "ja",
    Korean: "ko",
    Chinese: "zh",
    Arabic: "ar",
    Hindi: "hi",
    Turkish: "tr",
    Dutch: "nl",
    Polish: "pl",
  };

  return languageMap[language] || "en";
}

// Map language to TTS voice
function getVoiceForLanguage(language) {
  // OpenAI TTS voices: alloy, echo, fable, onyx, nova, shimmer
  // Using different voices for variety
  const voiceMap = {
    English: "alloy",
    Spanish: "nova",
    French: "shimmer",
    German: "onyx",
    Italian: "fable",
    Portuguese: "echo",
    Russian: "alloy",
    Japanese: "shimmer",
    Korean: "nova",
    Chinese: "alloy",
    Arabic: "onyx",
    Hindi: "fable",
    Turkish: "echo",
    Dutch: "alloy",
    Polish: "nova",
  };

  return voiceMap[language] || "alloy";
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🌍 Real-time Translation Server running on port ${PORT}`);
  console.log(`🚀 Uniting humanity through language!`);
});
