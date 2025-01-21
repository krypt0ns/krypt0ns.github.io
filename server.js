const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');  // Add this if using Node.js < 18
const app = express();

// Enable CORS
app.use(cors({
    origin: 'https://www.krypt0n.net',
    methods: ['POST'],
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/discord/token', async (req, res) => {
    const { code } = req.body;
    
    const data = {
        client_id: '1325220923162230805',
        client_secret: 'CnsILKBdkD12PUbU2HnoKCEE_dc6mfgZ',
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'https://www.krypt0n.net/discord/callback'
    };

    try {
        const response = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams(data),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const responseData = await response.text();
        
        if (!response.ok) {
            console.error('Discord API Error:', responseData);
            return res.status(response.status).json({ 
                error: 'Failed to exchange code for token',
                details: responseData
            });
        }

        try {
            const tokenData = JSON.parse(responseData);
            res.json(tokenData);
        } catch (e) {
            console.error('Error parsing token data:', e);
            res.status(500).json({
                error: 'Invalid token response',
                details: responseData
            });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Failed to exchange code for token',
            details: error.message
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});