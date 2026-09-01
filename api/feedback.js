// ==========================================================
// Vercel Serverless Function: /api/feedback
// Automatically sends user feedback directly to your WhatsApp via WAHA!
// ==========================================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { name, email, feedback, rating } = req.body || {};

    if (!name || !email || !feedback) {
      return res.status(400).json({ error: 'Please provide all required fields.' });
    }

    // Format WhatsApp message with emojis and bold text
    const ratingEmoji = rating === '5' ? '⭐⭐⭐⭐⭐ (5/5)' :
                        rating === '4' ? '⭐⭐⭐⭐ (4/5)' :
                        rating === '3' ? '⭐⭐⭐ (3/5)' :
                        rating === '2' ? '⭐⭐ (2/5)' :
                        rating === '1' ? '⭐ (1/5)' : `${rating}`;

    const waMessage = `🌟 *NEW AI STUDY ASSISTANT FEEDBACK* 🌟\n\n` +
                      `👤 *Name:* ${name}\n` +
                      `📧 *Email:* ${email}\n` +
                      `📊 *Rating:* ${ratingEmoji}\n` +
                      `💬 *Feedback:*\n"${feedback}"\n\n` +
                      `📅 *Time:* ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}`;

    // WAHA Configuration
    const wahaApiUrl = process.env.WAHA_API_URL || 'https://waha-whfe.onrender.com';
    const wahaApiKey = process.env.WAHA_API_KEY;
    const targetPhone = process.env.WAHA_TARGET_NUMBER || '923032172766';
    const chatId = targetPhone.includes('@c.us') ? targetPhone : `${targetPhone.replace(/^0/, '92')}@c.us`;

    console.log(`[Feedback] Sending WhatsApp notification to ${chatId} via WAHA...`);

    // Call WAHA API to deliver message directly to your WhatsApp
    const waResponse = await fetch(`${wahaApiUrl.replace(/\/$/, '')}/api/sendText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': wahaApiKey
      },
      body: JSON.stringify({
        chatId: chatId,
        text: waMessage,
        session: 'default'
      })
    });

    if (!waResponse.ok) {
      const errText = await waResponse.text();
      console.warn(`[WAHA Error] Status ${waResponse.status}: ${errText}`);
    } else {
      console.log('[Feedback] WhatsApp notification successfully delivered!');
    }

    return res.status(200).json({
      success: true,
      message: 'Feedback received and sent  successfully!'
    });

  } catch (err) {
    console.error('[Feedback Server Error]', err);
    // Still return 200 to user so their UX is smooth even if notification network blips
    return res.status(200).json({ 
      success: true, 
      message: 'Feedback received successfully!' 
    });
  }
}
