// ==========================================================
// Vercel Serverless Function: /api/feedback
// Handles user feedback submissions with zero third parties
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

    console.log('[Feedback Received]', {
      name,
      email,
      rating,
      feedback,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Feedback received successfully! Thank you.'
    });

  } catch (err) {
    console.error('[Feedback Error]', err);
    return res.status(500).json({ error: 'Failed to process feedback.' });
  }
}
