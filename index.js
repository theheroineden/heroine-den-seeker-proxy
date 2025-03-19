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
const KLAVIYO_LIST_ID = "QZE9kG"; // Your Klaviyo List ID

app.post("/add-member", async (req, res) => {
    const { email } = req.body;

    if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "Invalid email address." });
    }

    try {
        const response = await fetch(`https://a.klaviyo.com/api/v2/list/${KLAVIYO_LIST_ID}/members`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Klaviyo-API-Key ${KLAVIYO_PRIVATE_API_KEY}`,
            },
            body: JSON.stringify({ profiles: [{ email }] })
        });

        if (!response.ok) {
            throw new Error("Failed to add email to Klaviyo");
        }

        res.json({ success: true, message: "Email added successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Server error. Please try again." });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
