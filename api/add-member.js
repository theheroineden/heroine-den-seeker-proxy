module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://theheroineden.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
    const listId = process.env.KLAVIYO_LIST_ID;

    // Step 1: Create the profile
    const createProfileResponse = await fetch('https://a.klaviyo.com/api/profiles/', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'revision': '2023-02-22',
        'content-type': 'application/json',
        'Authorization': `Klaviyo-API-Key ${apiKey}`
      },
      body: JSON.stringify({
        data: {
          type: 'profile',
          attributes: { email }
        }
      })
    });

    if (!createProfileResponse.ok) {
      const errorText = await createProfileResponse.text();
      console.error('Klaviyo Profile creation error:', errorText);
      throw new Error('Failed to create profile in Klaviyo');
    }

    // Step 2: Add profile to list
    const addToListResponse = await fetch(`https://a.klaviyo.com/api/lists/${listId}/relationships/profiles/`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'revision': '2023-02-22',
        'content-type': 'application/json',
        'Authorization': `Klaviyo-API-Key ${apiKey}`
      },
      body: JSON.stringify({
        data: [{ type: 'profile', id: email }]
      })
    });

    if (!addToListResponse.ok) {
      const errorText = await addToListResponse.text();
      console.error('Klaviyo Add-to-List error:', errorText);
      throw new Error('Failed to add profile to list in Klaviyo');
    }

    res.status(200).json({ success: true, message: 'Email added and subscribed successfully!' });

  } catch (error) {
    console.error('Klaviyo API Error:', error);
    res.status(500).json({ error: error.message || 'Server error. Please try again.' });
  }
};
