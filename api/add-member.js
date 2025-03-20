const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const KLAVIYO_PRIVATE_API_KEY = process.env.KLAVIYO_PRIVATE_API_KEY;
const KLAVIYO_PASSWORD_LIST_ID = process.env.KLAVIYO_LIST_ID;
const KLAVIYO_MASTER_LIST_ID = process.env.KLAVIYO_MASTER_LIST_ID;

app.post("/add-member", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  try {
    // First, create the profile with consent and custom properties
    const createProfileResponse = await fetch("https://a.klaviyo.com/api/profiles/", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "revision": "2023-02-22",
        "content-type": "application/json",
        "Authorization": `Klaviyo-API-Key ${KLAVIYO_PRIVATE_API_KEY}`
      },
      body: JSON.stringify({
        data: {
          type: "profile",
          attributes: {
            email: email,
            consent: ["email"],
            custom_properties: {
              source: "Password Seeker Entry"
            }
          }
        }
      })
    });

    if (!createProfileResponse.ok) {
      const errorText = await createProfileResponse.text();
      console.error("Klaviyo profile creation error:", errorText);
      throw new Error("Failed to create profile in Klaviyo");
    }

    // Add the newly created profile to both lists
    const addToPasswordListResponse = await fetch(`https://a.klaviyo.com/api/lists/${KLAVIYO_PASSWORD_LIST_ID}/relationships/profiles/`, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "revision": "2023-02-22",
        "content-type": "application/json",
        "Authorization": `Klaviyo-API-Key ${KLAVIYO_PRIVATE_API_KEY}`
      },
      body: JSON.stringify({
        data: [{ type: "profile", id: email }]
      })
    });

    if (!addToPasswordListResponse.ok) {
      const errorText = await addToPasswordListResponse.text();
      console.error("Error adding to password list:", errorText);
      throw new Error("Failed to add profile to password list in Klaviyo");
    }

    const addToMasterListResponse = await fetch(`https://a.klaviyo.com/api/lists/${KLAVIYO_MASTER_LIST_ID}/relationships/profiles/`, {
      method: "POST",
      headers: {
        "accept": "application/json",
        "revision": "2023-02-22",
        "content-type": "application/json",
        "Authorization": `Klaviyo-API-Key ${KLAVIYO_PRIVATE_API_KEY}`
      },
      body: JSON.stringify({
        data: [{ type: "profile", id: email }]
      })
    });

    if (!addToMasterListResponse.ok) {
      const errorText = await addToMasterListResponse.text();
      console.error("Error adding to master list:", errorText);
      throw new Error("Failed to add profile to master list in Klaviyo");
    }

    // Success!
    res.json({ success: true, message: "Email added successfully to both lists!" });

  } catch (error) {
    console.error("Klaviyo API Error:", error);
    res.status(500).json({ error: error.message || "Server error. Please try again." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
