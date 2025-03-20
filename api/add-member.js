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
    // Create or update profile with consent + custom property
    const profileResponse = await fetch("https://a.klaviyo.com/api/profiles/", {
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

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error("Klaviyo Profile creation error:", errorText);
      throw new Error("Failed to create profile in Klaviyo");
    }

    // Add profile to both lists
    const addToLists = [KLAVIYO_PASSWORD_LIST_ID, KLAVIYO_MASTER_LIST_ID].map(listId =>
      fetch(`https://a.klaviyo.com/api/lists/${listId}/relationships/profiles/`, {
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
      })
    );

    const results = await Promise.all(addToLists);
    for (const result of results) {
      if (!result.ok) {
        const errorText = await result.text();
        console.error("Klaviyo Add-to-List error:", errorText);
        throw new Error("Failed to add profile to one of the lists in Klaviyo");
      }
    }

    res.json({ success: true, message: "Email added successfully to both lists!" });

  } catch (error) {
    console.error("Klaviyo API Error:", error);
    res.status(500).json({ error: error.message || "Server error. Please try again." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
