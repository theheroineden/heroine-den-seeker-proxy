module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://theheroineden.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight (OPTIONS) requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { email } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  
  try {
    const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
    const response = await fetch(`https://a.klaviyo.com/api/v2023-02-22/profiles/relationships/lists`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'revision': '2023-02-22',
        'content-type': 'application/json',
        Authorization: `Klaviyo-API-Key ${apiKey}`
      },
      body: JSON.stringify({
  "data": {
    "type": "profile",
    "attributes": {
      "email": "user@example.com"
    },
    "relationships": {
      "lists": {
        "data": [
          {
            "type": "list",
            "id": "QZE9kG"
          }
        ]
      }
    }
  }
}

  
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Klaviyo API response error:', errorText);
      throw new Error('Failed to add email to Klaviyo');
    }
  
    res.status(200).json({ success: true, message: 'Email added successfully!' });
  } catch (error) {
    console.error('Klaviyo API Error:', error);
    res.status(500).json({ error: error.message || 'Server error. Please try again.' });
  }
};
