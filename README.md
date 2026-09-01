# AI Study Assistant

A modern, web-based AI study chatbot designed to help students learn, test their knowledge, and organize study sessions. Built with vanilla web technologies on the frontend, Firebase for authentication and real-time database storage, and a native Google Gemini Multimodal AI engine with serverless endpoints.

---

## Features

- **4 Specialized Study Modes**:
  - **Normal Mode**: Standard Q&A, study summaries, and general academic assistance.
  - **Deep Study**: Socratic teaching, conceptual depth, first principles, and step-by-step breakdowns.
  - **Test Mode**: Generates quizzes and exam questions without answers, evaluates user submissions, and grades results.
  - **Chat Mode**: Friendly, conversational AI for open-ended questions and general discussions.
- **Multimodal AI Engine**:
  - Powered by Google Gemini with multi-turn conversational context.
  - Supports image and study document attachments.
- **User Authentication & Profiles**:
  - Email & password signup, login, and secure session persistence backed by Firebase Auth.
  - Profile customization, username editing, and password updates.
- **Session Management**:
  - Create, search, rename, and delete multiple chat sessions.
  - Share specific chat sessions via unique shareable links.
- **Real-Time & Offline Sync**:
  - Chat history and messages sync with Cloud Firestore in real time.
  - Offline persistence enabled via IndexedDB to review chats without an active connection.
- **Voice & Audio**:
  - Voice-to-text input using the Web Speech Recognition API.
  - Text-to-speech (TTS) audio playback for AI responses.
- **Message Actions**:
  - Copy message text, like/dislike responses, edit sent prompts, regenerate answers, and delete messages.
- **Customizable UI**:
  - Cyberpunk dark theme with neon accents and a clean light theme toggle.
  - Fully responsive design optimized for mobile and desktop screens.
- **Feedback & Manager Contact**:
  - Built-in feedback form with rating system that sends notifications via WAHA.
  - Direct developer contact modal with quick links for WhatsApp, Email, and Portfolio.

---

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (CSS Variables, Flexbox/Grid), Modern JavaScript (ES6+) — *no frameworks or build steps required*
- **Backend & Database**:
  - **Firebase Authentication** (User management)
  - **Cloud Firestore** (Real-time database with offline persistence)
  - **Firebase Storage** (File and image attachments)
- **AI & Serverless Processing**:
  - **Google Gemini API** (Multimodal LLM with reasoning & multi-turn memory)
  - **Vercel Serverless Functions** (`/api/chat` and `/api/feedback`)
  - **WAHA API** (WhatsApp automation for user feedback notifications)
- **Browser APIs**: Web Speech API (`SpeechRecognition` & `speechSynthesis`)

---

## Project Structure

```
Ai Study Assistant/
├── index.html          # Main application markup & UI modals
├── .gitignore          # Git ignore rules (.env, secrets)
├── api/
│   ├── chat.js         # Serverless AI engine (Gemini Multimodal & study modes)
│   └── feedback.js     # Serverless feedback processing & WhatsApp alerts
├── css/
│   └── styles.css      # Cyberpunk dark/light themes & responsive styles
├── js/
│   └── script.js       # Client application logic (Firebase, chat, auth, UI)
└── README.md           # Project documentation
```

---

## Author

- **Developer**: M. Hamza (AI Solutions Developer & Systems Engineer)
- **Portfolio**: [hamza-systems.tech](https://hamza-systems.tech/)
- **Contact**: [m.hamza.systems@gmail.com](mailto:m.hamza.systems@gmail.com)
