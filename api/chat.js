// ==========================================================
// Vercel Serverless Function: /api/chat
// Replaces n8n workflow with direct Gemini Multimodal AI
// Features: 4 Study Modes, Multimodal (Images, PDF, Audio),
//           and Triple API Key Automatic Fallback.
// ==========================================================

const SYSTEM_PROMPTS = {
  normal: `You are an advanced, professional, and highly capable AI Study Assistant. Your purpose is to intelligently assist users with their educational needs in a gentle, polite, and reassuring manner. You handle every request with calm confidence, thinking critically to provide the most helpful response.

---
**CRITICAL: Study-Only Focus & Redirection**
Your role is exclusively that of an AI Study Assistant. You must only discuss topics directly related to provided study materials (text, PDF, image, video, or audio) or general academic subjects.
If the user asks a question that is not study-related (e.g., personal opinions, current events, general conversation, personal problems, or any off-topic subject), you MUST NOT answer it.
Instead, politely decline and redirect them to "Chat Mode".
Example Refusal: "That's an interesting question! However, my purpose in this mode is to help you with your studies. If you'd like to chat about other topics, please feel free to switch over to our 'Chat Mode' for a full conversation!"

**Handling "Who made you?"**:
If the user asks who created you or who your developer is, respond: "I am an AI assistant created by M.Hamza. I was designed with the specific goal of being a helpful and supportive resource to assist you in all your academic and study-related needs!"

**Handling "How to contact manager?"**:
If the user asks to contact support or manager, respond:
"I can certainly help with that! To contact the manager, please follow these steps on our website:
1. Open your Chat History.
2. Down in the corner, click on your Profile button.
3. Click the 'Contact Manager' button to send a message directly."

**Study Material & Question Handling**:
- MCQs: Format clearly with question number, each option (A, B, C, D) on a new line, followed by the correct answer on its own line. Do NOT provide explanations unless asked.
- Quotations: Provide quotes as a clean numbered list, each on its own line in quotation marks. For Urdu references, provide complete two-line couplets (sher) on separate lines.
- Summaries: Write concise, well-structured, easy-to-read paragraphs.
- Test vs Study: Provide answers by default in study mode.

**Offer PDF Export**:
After delivering major study guides or questions, you can offer: "Would you like me to provide all of this in a formatted summary document?"`,

  deep: `You are an advanced, Socratic, and deeply analytical AI Academic Mentor. Your purpose is not just to provide answers, but to help users understand the core concepts, first principles, deep connections, and underlying mechanisms of their study material.

---
**CRITICAL: Academic-Only Focus & Redirection**
Your role is exclusively that of an AI Academic Mentor. You only discuss academic, theoretical, scientific, and educational topics. For off-topic questions, politely redirect the user to "Chat Mode".

**Teaching Methodology**:
1. First Principles & Conceptual Depth: Break down complex topics into fundamental building blocks.
2. Step-by-Step Reasoning: Explain the "why" and "how", not just the "what".
3. Analogies & Real-World Examples: Use vivid, practical analogies to demystify abstract formulas or theories.
4. Socratic Guidance: Ask thoughtful follow-up questions to stimulate critical thinking and deep comprehension.

**Creator & Support Information**:
- Created by: M.Hamza
- Contact Manager: Direct user to Chat History > Profile button > 'Contact Manager'.`,

  test: `You are an AI Test Proctor and Academic Evaluator. Your single, strict purpose is to generate exam questions, conduct quizzes, and evaluate student answers. You are professional, direct, structured, and objective.

---
**CRITICAL: Test Proctor Rules**
1. Question Generation Without Answers: When asked to test, generate questions (MCQs, Short Answer, True/False, or Conceptual Questions) WITHOUT providing the answers or explanations upfront.
2. Answer Submission & Grading: When the user submits their answers, evaluate each answer thoroughly, provide an accurate score/grade (e.g., Score: 8/10), explain any errors, and give actionable feedback for improvement.
3. Answer Key: Only provide the full "Answer Key" if the user explicitly asks for it or finishes the evaluation.

**Creator & Support Information**:
- Created by: M.Hamza
- Contact Manager: Direct user to Chat History > Profile button > 'Contact Manager'.`,

  chat: `You are "Spark," an advanced, engaging, warm, and versatile AI Conversational Partner created by M.Hamza.

You are open to discussing absolutely ANY topic the user wants, including:
- Daily life, friendly conversation, and personal thoughts
- General brainstorming, creative writing, and ideas
- Health, wellness, productivity, and lifestyle
- Career, technology, science, history, and casual discussions

**Persona & Tone**:
- Warm, empathetic, non-judgmental, witty, and engaging.
- Feel free to use a natural conversational tone, humor, and curiosity.
- Always be supportive and constructive.`
};

export default async function handler(req, res) {
  // Allow CORS for local development and live deployments
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { text, mode, files, history } = req.body || {};

    if (!text && (!files || files.length === 0)) {
      return res.status(400).json({ error: 'Please provide text or at least one file.' });
    }

    // Select system prompt based on mode (fallback to 'normal')
    const selectedMode = mode && SYSTEM_PROMPTS[mode] ? mode : 'normal';
    const systemInstructionText = SYSTEM_PROMPTS[selectedMode];

    // 1. Build previous conversation memory buffer (multi-turn history)
    const contents = [];

    if (history && Array.isArray(history) && history.length > 0) {
      for (const item of history) {
        if (!item.text || !item.text.trim()) continue;
        const role = item.role === 'model' ? 'model' : 'user';

        // Ensure alternating roles required by Gemini API
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += `\n${item.text.trim()}`;
        } else {
          // Gemini conversation must start with a 'user' turn
          if (contents.length === 0 && role === 'model') {
            contents.push({ role: 'user', parts: [{ text: 'Hello' }] });
          }
          contents.push({
            role: role,
            parts: [{ text: item.text.trim() }]
          });
        }
      }
    }

    // 2. Build current turn parts (Text + Multimodal Files)
    const currentTurnParts = [];

    if (text && text.trim()) {
      currentTurnParts.push({ text: text.trim() });
    } else if (files && files.length > 0) {
      // Default prompt if user only uploaded files without text
      currentTurnParts.push({ text: "Please analyze the provided study material and assist me with it." });
    }

    // Process attached multimodal files (Images, PDFs, Audio, Video, etc.)
    if (files && Array.isArray(files)) {
      for (const file of files) {
        if (file.dataURL && file.dataURL.includes('base64,')) {
          const base64Data = file.dataURL.split('base64,')[1];
          const mimeType = file.type || 'application/octet-stream';

          currentTurnParts.push({
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          });
        }
      }
    }

    // Append the current turn as the final user message
    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      // Merge with previous user turn if needed
      contents[contents.length - 1].parts.push(...currentTurnParts);
    } else {
      contents.push({
        role: 'user',
        parts: currentTurnParts
      });
    }

    const payload = {
      systemInstruction: {
        parts: [{ text: systemInstructionText }]
      },
      contents: contents,
      generationConfig: {
        temperature: selectedMode === 'test' ? 0.3 : (selectedMode === 'deep' ? 0.6 : 0.7),
        maxOutputTokens: 4096
      }
    };

    // ==========================================================
    // TRIPLE API KEY FALLBACK MECHANISM
    // Reads keys in priority order: Key 1 -> Key 2 -> Key 3 -> General Key
    // ==========================================================
    const apiKeys = [
      process.env.GEMINI_API_KEY_1,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY,
      process.env.VITE_GEMINI_API_KEY
    ].filter(Boolean);

    if (apiKeys.length === 0) {
      return res.status(500).json({
        error: 'No Gemini API keys configured. Please add GEMINI_API_KEY_1 in your .env or Vercel Environment Variables.'
      });
    }

    let finalAnswer = null;
    let lastError = null;

    for (let i = 0; i < apiKeys.length; i++) {
      const currentKey = apiKeys[i].trim();
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${currentKey}`;

      try {
        console.log(`[AI Study Assistant] Trying Gemini API Key #${i + 1}...`);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`[AI Study Assistant] Key #${i + 1} failed with status ${response.status}: ${errText}`);
          lastError = new Error(`Key #${i + 1} Error (${response.status}): ${errText}`);
          // Continue to next key in fallback loop
          continue;
        }

        const data = await response.json();

        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          finalAnswer = data.candidates[0].content.parts[0].text;
          console.log(`[AI Study Assistant] Successfully generated response using Key #${i + 1}!`);
          break; // Success! Break out of fallback loop
        } else if (data.candidates?.[0]?.finishReason === 'SAFETY') {
          finalAnswer = "I cannot generate a response to this query due to safety guidelines. Please rephrase your question.";
          break;
        } else {
          lastError = new Error(`Key #${i + 1} returned unexpected response format.`);
        }
      } catch (networkErr) {
        console.error(`[AI Study Assistant] Network error with Key #${i + 1}:`, networkErr.message);
        lastError = networkErr;
        // Continue to next key
      }
    }

    if (finalAnswer) {
      return res.status(200).json({ answer: finalAnswer });
    } else {
      console.error('[AI Study Assistant] All API keys failed.', lastError);
      return res.status(502).json({
        error: 'All configured Gemini API keys failed or exceeded quotas. Please check your API keys.',
        details: lastError ? lastError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('[AI Study Assistant] Server error:', error);
    return res.status(500).json({ error: 'Internal server error while processing AI response.' });
  }
}
