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

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
    const listId = process.env.KLAVIYO_LIST_ID;
    const masterListId = process.env.KLAVIYO_MASTER_LIST_ID;

    // Step 1: Create the profile or get profile ID and mark as subscribed
    let profileId = null;

    const profileResponse = await fetch('https://a.klaviyo.com/api/profiles/', {
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
          attributes: { 
            email,
            subscriptions: {
              email: { marketing: 'subscribed' }
            }
          }
        }
      })
    });

    if (profileResponse.ok) {
      const data = await profileResponse.json();
      profileId = data.data.id;
    } else {
      const errorData = await profileResponse.json();
      if (
        errorData.errors &&
        errorData.errors[0].code === 'duplicate_profile' &&
        errorData.errors[0].meta &&
        errorData.errors[0].meta.duplicate_profile_id
      ) {
        profileId = errorData.errors[0].meta.duplicate_profile_id;
      } else {
        throw new Error('Failed to create profile in Klaviyo');
      }
    }

    // Step 2: Add profile to Password Seekers list
    const addToList = async (id) => {
      const listResponse = await fetch(
        `https://a.klaviyo.com/api/lists/${id}/relationships/profiles/`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'revision': '2023-02-22',
            'content-type': 'application/json',
            Authorization: `Klaviyo-API-Key ${apiKey}`
          },
          body: JSON.stringify({
            data: [{ type: 'profile', id: profileId }]
          })
        }
      );

      if (!listResponse.ok) {
        const listError = await listResponse.text();
        console.error(`Klaviyo Add-to-List error (List ${id}):`, listError);
        throw new Error('Failed to add profile to list in Klaviyo');
      }
    };

    await addToList(listId); // Add to password seekers list
    await addToList(masterListId); // Add to master list

    res.status(200).json({ success: true, message: 'Email added, subscribed, and added to both lists!' });
  } catch (error) {
    console.error('Klaviyo API Error:', error);
    res.status(500).json({ error: error.message || 'Server error. Please try again.' });
  }
};
