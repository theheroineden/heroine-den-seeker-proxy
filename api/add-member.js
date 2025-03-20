module.exports = async function handler(req, res) {
  // Set headers to handle CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://theheroineden.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight (OPTIONS) requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Allow only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  // Validate the email input
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;

    // Send request to Klaviyo API
    const response = await fetch(`https://a.klaviyo.com/api/v2023-02-22/profiles/relationships/lists`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'revision': '2023-02-22',
        'content-type': 'application/json',
        Authorization: `Klaviyo-API-Key ${apiKey}`
      },
      body: JSON.stringify({
        data: {
          type: 'profile',
          attributes: { email },
          relationships: {
            lists: {
              data: [
                { type: 'list', id: process.env.KLAVIYO_LIST_ID }
              ]
            }
          }
        }
      })
    });

    // Check response status
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Klaviyo API response error:', errorText);
      throw new Error('Failed to add email to Klaviyo');
    }

    // Respond with success
    res.status(200).json({ success: true, message: 'Email added successfully!' });

  } catch (error) {
    // Log and return server error
    console.error('Klaviyo API Error:', error);
    res.status(500).json({ error: error.message || 'Server error. Please try again.' });
  }
};
