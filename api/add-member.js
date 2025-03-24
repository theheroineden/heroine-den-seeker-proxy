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

    // STEP 1: Create the profile or get profile ID
    let profileId = null;

    const profileResponse = await fetch('https://a.klaviyo.com/api/profiles/', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        revision: '2023-02-22',
        'content-type': 'application/json',
        Authorization: Klaviyo-API-Key ${apiKey}
      },
      body: JSON.stringify({
        data: {
          type: 'profile',
          attributes: { 
            email,
            location: {
              ip: ip
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

    // STEP 1.5: Explicitly pass consent  
    await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        revision: '2023-02-22',
        'content-type': 'application/json',
        Authorization: Klaviyo-API-Key ${apiKey}
      },
      body: JSON.stringify({
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            subscriptions: [
              {
                channel: "EMAIL",
                email: email,
                consent: "EXPLICIT"
              }
            ]
          }
        }
      })
    });

    // STEP 2: Add profile to Password Seekers list
const seekersListResponse = await fetch(
  https://a.klaviyo.com/api/lists/${seekersListId}/relationships/profiles/,
  {
    method: 'POST',
    headers: {
      accept: 'application/json',
      revision: '2023-02-22',
      'content-type': 'application/json',
      Authorization: Klaviyo-API-Key ${apiKey}
    },
    body: JSON.stringify({
      data: [
        {
          type: 'profile',
          id: profileId
        }
      ]
    })
  }
);

    if (!seekersListResponse.ok) {
      const listError = await seekersListResponse.text();
      console.error('Klaviyo Add-to-Seekers-List error:', listError);
      throw new Error('Failed to add profile to seekers list in Klaviyo');
    }

    res.status(200).json({
      success: true,
      message: 'Email added and added to Password Seekers list successfully!'
    });

  } catch (error) {
    console.error('Klaviyo API Error:', error);
    res.status(500).json({ error: error.message || 'Server error. Please try again.' });
  }
};
