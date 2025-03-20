export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    const response = await fetch(`https://a.klaviyo.com/api/v2/list/${process.env.KLAVIYO_LIST_ID}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_PRIVATE_API_KEY}`
      },
      body: JSON.stringify({ profiles: [{ email }] })
    });

    if (!response.ok) {
      throw new Error('Failed to add email to Klaviyo');
    }

    res.status(200).json({ success: true, message: 'Email added successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
