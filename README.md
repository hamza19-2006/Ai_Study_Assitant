# AI Study Assistant

A lightweight, web-based AI study chatbot designed to help students learn, test their knowledge, and organize study sessions. Built with vanilla web technologies on the frontend, Firebase for authentication and real-time database storage, and n8n webhooks connecting to an AI backend.

It comes with a neon cyberpunk dark theme, a clean light theme toggle, voice input, file attachments, and dedicated study modes for different learning styles.

---

## Preview

> _Add your screenshot or demo GIF here:_  
> `![AI Study Assistant Preview](assets/preview.png)`

---

## Features

- **4 Study Modes**:
  - **Normal Mode**: Standard Q&A and general study assistance.
  - **Deep Study**: Detailed explanations, step-by-step breakdowns, and conceptual depth.
  - **Test Mode**: Generates quizzes, tests recall, and evaluates your answers.
  - **Chat Mode**: Casual conversation and quick brainstorming.
- **User Authentication**: Email & password signup, login, and session persistence backed by Firebase Auth.
- **Session Management**:
  - Create multiple chat sessions and switch between them easily.
  - Search, rename, and delete sessions.
  - Share specific chat sessions via unique shareable links.
- **Real-Time & Offline Sync**:
  - Chat history and messages sync with Cloud Firestore in real time.
  - Offline persistence enabled via IndexedDB so you can review chats without an active connection.
- **Voice & Audio**:
  - Voice-to-text input using the Web Speech Recognition API.
  - Text-to-speech (TTS) audio playback for bot responses.
- **File Uploads**: Attach images or study documents with live image previews before sending (stored in Firebase Storage).
- **Message Actions**: Copy message text, like/dislike responses, edit sent prompts, re-generate answers, or delete messages.
- **Customizable UI**:
  - Dark theme (cyberpunk aesthetic with neon blue/purple accents) and clean light theme with smooth transitions.
  - Fully responsive layout with mobile sidebar drawer and adaptive header.
  - Non-intrusive toast notifications for user actions.
- **User Profile & Feedback**:
  - Update username and change account password.
  - Built-in feedback modal with a star rating system sent directly to a webhook.
  - Quick contact links for developer support (WhatsApp / Instagram).

---

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (CSS Variables, Flexbox/Grid), Modern JavaScript (ES6+) — *no frameworks or build steps required*
- **Backend & Database**:
  - **Firebase Authentication** (User management)
  - **Cloud Firestore** (Real-time database with offline persistence)
  - **Firebase Storage** (File and image attachments)
- **AI Processing**: [n8n](https://n8n.io/) Webhooks (orchestrating LLM workflows and response streaming)
- **Browser APIs**: Web Speech API (`SpeechRecognition` & `speechSynthesis`)

---

## Project Structure

```
Ai Study Assistant/
├── index.html          # Main HTML markup
├── .gitignore          # Prevents committing .env, secrets, and temp files
├── .env.example        # Template for environment variables and secrets
├── css/
│   └── styles.css      # All styles (dark/light themes, responsive)
├── js/
│   └── script.js       # Application logic (Firebase, chat, auth, UI)
└── README.md           # Project documentation
```

---

## Security & Environment Configuration

### 1. Protect Secrets with `.gitignore`
A pre-configured `.gitignore` is included in the repository. It automatically prevents `.env`, local configs, and temporary files from being committed:
```bash
# Verify your .env is ignored before pushing to Git
git status
```

### 2. Firestore Security Rules
Because client-side Firebase API keys are public by design, **Firestore Security Rules** are your primary layer of defense. Apply these rules in your [Firebase Console > Firestore Database > Rules](https://console.firebase.google.com/):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 1. User Profiles: Only the authenticated user can read & edit their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 2. Chat Sessions & Messages: Strict owner-only isolation
    match /chats/{userId}/sessions/{sessionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Nested messages inside a session
      match /messages/{messageId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // 3. Shared Chats: Allow public read only if marked as shared
    match /chats/{userId}/sessions/{sessionId} {
      allow read: if resource.data.isShared == true;
    }
  }
}
```

### 3. Google Cloud API Key Restrictions
To prevent other websites from using your Firebase credentials:
1. Open the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials).
2. Click on your `Browser key (auto created by Firebase)`.
3. Under **Application restrictions**, choose **Websites / HTTP referrers**.
4. Add your domain(s) (e.g., `https://yourdomain.com/*`, `http://localhost:*` for development).
5. Under **API restrictions**, select only **Firebase Authentication**, **Cloud Firestore API**, and **Cloud Storage for Firebase**.

### 4. Protect n8n AI Webhooks
- **Never expose your LLM API keys (OpenAI / Claude / Gemini) in frontend JavaScript.** All LLM keys should stay securely inside n8n credential managers.
- In n8n, configure the Webhook node to check for an authorization header (e.g. `X-Webhook-Token`) or restrict allowed CORS origins to your website domain.

---

## Contributing

Contributions, bug reports, and suggestions are welcome!

1. Fork the project.
2. Create a feature branch (`git checkout -b feature/new-feature`).
3. Commit your changes (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature/new-feature`).
5. Open a Pull Request.

---

## License

Distributed under the [MIT License](https://opensource.org/licenses/MIT).

---

## Author & Credits

- **Developer**: Hamza
- **Technologies**: Vanilla JavaScript, Firebase, n8n
