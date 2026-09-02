# AI Study Assistant

#### Video Demo: [https://youtu.be/your-video-id](https://youtu.be/your-video-id)

A modern, full-stack AI-powered study companion designed to empower students with personalized tutoring, active recall evaluation, and multimodal academic assistance. Built with modern web technologies, Firebase for authentication and real-time database management, and a secure serverless backend integrating the Google Gemini Multimodal AI engine.

---

## Overview & Motivation

In modern education, students often encounter complex academic concepts, dense textbook materials, and difficult exam preparation without immediate, personalized feedback. **AI Study Assistant** was built to solve this problem by serving as an on-demand, 24/7 academic tutor. 

Unlike generic chatbots, the AI Study Assistant is specifically calibrated for educational workflows. It provides distinct study modes—from conceptual Socratic mentorship to strict test proctoring—and allows students to attach diagrams, homework problems, and textbook pages for instant, multimodal explanation.

---

## Key Features

- **4 Specialized Study Modes**:
  - **Normal Mode**: Standard academic Q&A, study summaries, and structured explanations.
  - **Deep Study (Socratic Mentor)**: Emphasizes first principles, conceptual depth, step-by-step reasoning, and thoughtful inquiry.
  - **Test Mode (Exam Proctor)**: Generates customized quizzes and exam questions without upfront answers, then evaluates user submissions with detailed scoring and feedback.
  - **Chat Mode**: A friendly, versatile conversational partner for open-ended questions, brainstorming, and general discussions.
- **Multimodal AI Capabilities**:
  - Powered by Google Gemini with multi-turn conversational context memory.
  - Supports image, diagram, and study document attachments parsed seamlessly for visual problem-solving.
- **User Authentication & Profiles**:
  - Secure email/password signup, login, password resets, and session persistence backed by Firebase Auth.
  - In-app profile modal allowing username customization and password updates.
- **Session & History Management**:
  - Create, search, rename, and delete multiple independent chat sessions.
  - Generate unique, secure shareable links to share study sessions with peers.
- **Real-Time Database & Offline Sync**:
  - Full real-time synchronization with Cloud Firestore.
  - Offline persistence enabled via IndexedDB so students can review previous study sessions without an active internet connection.
- **Voice & Accessibility**:
  - Voice-to-text transcription powered by the Web Speech API.
  - Text-to-speech (TTS) audio playback for listening to AI responses.
- **Interactive Message Actions**:
  - Copy message content, like/dislike AI responses, edit previous prompts, regenerate answers, and delete individual messages.
- **Modern Responsive UI**:
  - Futuristic dark theme with neon accents alongside a clean light mode toggle.
  - Fully responsive layout optimized for mobile, tablet, and desktop screens with collapsible history sidebars.
- **Feedback & Developer Contact**:
  - Integrated feedback system with star ratings that delivers instant notifications to the developer via WhatsApp (WAHA webhook integration).
  - Direct contact modal offering quick links for Email, Portfolio, and WhatsApp.

---

## Tech Stack

- **Frontend**: HTML5, CSS3 (Custom Properties, Flexbox, Grid), Vanilla JavaScript (ES6+ Modules) — *Zero build steps or heavy frameworks required*.
- **Backend & Database**:
  - **Firebase Authentication**: User identity and secure session management.
  - **Cloud Firestore**: Real-time NoSQL database with offline persistence.
  - **Firebase Security Rules**: Granular database access control.
- **AI & Serverless Architecture**:
  - **Google Gemini API (`gemini-3.6-flash`)**: High-speed, multimodal LLM handling text and image inputs.
  - **Vercel Serverless Functions**: Node.js backend routes (`/api/chat` and `/api/feedback`) ensuring zero client-side secret exposure.
  - **WAHA API**: Webhook automation for delivering real-time user feedback directly to WhatsApp.
- **Browser APIs**: Web Speech Recognition & SpeechSynthesis APIs, KaTeX for LaTeX mathematical typesetting.

---

## File-by-File Breakdown

Here is an overview of the role and implementation details of each file in the codebase:

- **[`index.html`](index.html)**:
  Contains the structural markup of the single-page application. It defines the header, chat workspace, message input area, collapsible history sidebar, and all modal dialogues (Auth Login/Signup, Profile Settings, Share Session, Feedback Form, and Contact Manager). It also loads external assets such as FontAwesome icons and KaTeX stylesheets.

- **[`css/styles.css`](css/styles.css)**:
  Implements the complete design system using CSS custom properties (variables) for theme switching (dark/light mode). Contains layout rules using Flexbox and CSS Grid, custom scrollbars, glowing neon accents, typing indicator animations, modal styling, and responsive media queries (`max-width: 768px`) for mobile optimization.

- **[`js/script.js`](js/script.js)**:
  The core frontend controller. It manages:
  - Firebase initialization and authentication state listeners.
  - Firestore real-time snapshots (`onSnapshot`) for syncing chat sessions and message streams.
  - User interface interactions (sidebar toggling, theme switching, modal handling, voice recognition, and TTS playback).
  - Multi-turn conversation assembly and communication with backend endpoints (`/api/chat` and `/api/feedback`).

- **[`api/chat.js`](api/chat.js)**:
  A secure Vercel Serverless Node.js function. It receives chat requests from the client, constructs the prompt with role-specific system instructions, formats multimodal attachments (base64 images), and calls the Google Gemini API. It features a multi-key fallback rotation mechanism to prevent downtime and rate limits.

- **[`api/feedback.js`](api/feedback.js)**:
  A Vercel Serverless function that processes user feedback submissions, formats structured notification payloads, and forwards them to the WAHA (WhatsApp HTTP API) service for real-time delivery to the administrator.

- **[`api/firestorerules`](api/firestorerules)**:
  Declarative Firestore Security Rules specifying permission boundaries. It enforces that users can only read/write their own private chat histories while allowing public read access to specifically shared chat sessions.

- **[`.gitignore`](.gitignore)**:
  Ensures that sensitive local environment files (`.env`, `.env.local`), node modules, and system files are excluded from version control.

---

## Key Design Decisions

1. **Why Vanilla JavaScript over Frontend Frameworks (React/Vue)?**
   - Choosing pure vanilla JavaScript guarantees lightning-fast load times, eliminates build dependencies and node bundle overhead, and demonstrates core DOM manipulation, event-driven programming, and native browser API integration from first principles.

2. **Why a Serverless Backend Architecture (`/api`)?**
   - Keeping external API keys (Gemini and WAHA) on the client side exposes them to theft via browser inspection tools. Moving AI and webhook communication to Vercel Serverless Functions (`/api/chat` and `/api/feedback`) keeps all API keys strictly on the server (`process.env`) while scaling seamlessly on demand.

3. **Why Cloud Firestore with Offline Persistence?**
   - Firestore provides instant real-time synchronization between multiple devices and tabs. Enabling IndexedDB offline persistence guarantees that students can review their past study notes even when offline or experiencing poor network connectivity.

4. **Why Multimodal AI (`gemini-3.6-flash`)?**
   - Academic study frequently involves diagrams, textbook figures, charts, and handwritten mathematical problems. Integrating multimodal vision support allows the assistant to explain visual material directly without requiring manual transcription.

---

## How to Run & Deploy

### Prerequisites
- Node.js (v18 or higher)
- A Google Gemini API Key ([Google AI Studio](https://aistudio.google.com/))
- A Firebase Project with Authentication & Firestore enabled ([Firebase Console](https://console.firebase.google.com/))

### 1. Local Development (with Serverless Backend)
Because the project uses Node.js serverless functions in `/api/`, run the project using the Vercel CLI to execute both frontend and backend locally:

```bash
# 1. Clone the repository
git clone https://github.com/hamza19-2006/Ai_Study_Assitant.git
cd Ai_Study_Assitant

# 2. Create a local .env file in the root directory
# Add your environment keys:
GEMINI_API_KEY_1=your_gemini_api_key_here
WAHA_API_URL=https://your-waha-endpoint.com
WAHA_API_KEY=your_waha_key
WAHA_TARGET_NUMBER=your_whatsapp_number

# 3. Start the local development server
npx vercel dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Deploying to Vercel
1. Push your code to your GitHub repository.
2. Import the repository into [Vercel](https://vercel.com).
3. Navigate to **Project Settings > Environment Variables** in Vercel and add:
   - `GEMINI_API_KEY_1`
   - `GEMINI_API_KEY_2` *(optional fallback)*
   - `GEMINI_API_KEY_3` *(optional fallback)*
   - `WAHA_API_URL`
   - `WAHA_API_KEY`
   - `WAHA_TARGET_NUMBER`
4. Deploy the project. Vercel will host the frontend and serve the serverless functions automatically.

---

## Author

- **Developer**: M. Hamza (AI Solutions Developer & Systems Engineer)
- **Portfolio**: [hamza-systems.tech](https://hamza-systems.tech/)
- **Contact**: [m.hamza.systems@gmail.com](mailto:m.hamza.systems@gmail.com)
- **GitHub**: [@hamza19-2006](https://github.com/hamza19-2006)
