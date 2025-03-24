const fetch = require('node-fetch');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://theheroineden.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || null;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
    const seekersListId = process.env.KLAVIYO_LIST_ID;

    // ✅ Just use the subscribe endpoint!
    const subscribeResponse = await fetch(`https://a.klaviyo.com/api/lists/${seekersListId}/subscribe/`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        revision: '2023-02-22',
        'content-type': 'application/json',
        Authorization: `Klaviyo-API-Key ${apiKey}`
      },
      body: JSON.stringify({
        profiles: [
          {
            email: email,
            location: { ip: ip },
            consent: "explicit"
          }
        ]
      })
    });

    if (!subscribeResponse.ok) {
      const subscribeError = await subscribeResponse.text();
      console.error('Klaviyo Subscribe error:', subscribeError);
      throw new Error('Failed to subscribe profile in Klaviyo');
    }

    res.status(200).json({
      success: true,
      message: 'Email added and subscribed successfully!'
    });

  } catch (error) {
    console.error('Klaviyo API Error:', error);
    res.status(500).json({ error: error.message || 'Server error. Please try again.' });
  }
};
