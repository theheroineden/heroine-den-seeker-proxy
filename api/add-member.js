const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(
  cors({
    origin: ["https://theheroineden.com"],
    methods: ["POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const KLAVIYO_PRIVATE_API_KEY = process.env.KLAVIYO_PRIVATE_API_KEY;
const PASSWORD_SEEKERS_LIST_ID = process.env.KLAVIYO_LIST_ID;
const MASTER_LIST_ID = process.env.KLAVIYO_MASTER_LIST_ID;

app.post("/add-member", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  try {
    // Create or update the profile and mark as subscribed
    const profileResponse = await fetch("https://a.klaviyo.com/api/profiles/", {
      method: "POST",
      headers: {
        accept: "application/json",
        revision: "2023-10-15",
        "content-type": "application/json",
        Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_API_KEY}`,
      },
      body: JSON.stringify({
        data: {
          type: "profile",
          attributes: {
            email,
            subscriptions: {
              email: { marketing: "subscribed" },
            },
          },
        },
      }),
    });

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error("Klaviyo profile creation error:", errorText);
      throw new Error("Failed to create or update profile in Klaviyo");
    }

    // Add the profile to both lists
    const addToList = async (listId) => {
      const listResponse = await fetch(
        `https://a.klaviyo.com/api/lists/${listId}/relationships/profiles/`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
            revision: "2023-10-15",
            "content-type": "application/json",
            Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_API_KEY}`,
          },
          body: JSON.stringify({
            data: [{ type: "profile", id: email }],
          }),
        }
      );

      if (!listResponse.ok) {
        const errorText = await listResponse.text();
        console.error("Klaviyo Add-to-List error:", errorText);
        throw new Error("Failed to add profile to list in Klaviyo");
      }
    };

    await addToList(PASSWORD_SEEKERS_LIST_ID);
    await addToList(MASTER_LIST_ID);

    res.json({ success: true, message: "Email added to both lists and subscribed!" });
  } catch (error) {
    console.error("Klaviyo API Error:", error);
    res.status(500).json({ error: error.message || "Server error. Please try again." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
