const express = require('express');
const app = express();

// Serve static files from the current directory
app.use(express.static('.'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/discord/token', async (req, res) => {
    const { code } = req.body;
    
    const data = {
        client_id: '1325220923162230805',
        client_secret: 'CnsILKBdkD12PUbU2HnoKCEE_dc6mfgZ',
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'https://www.krypt0n.net/discord/callback'  // Updated to match the client redirect URI
    };

    try {
        const response = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams(data),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Discord API Error:', errorText);
            return res.status(response.status).json({ 
                error: 'Failed to exchange code for token',
                details: errorText
            });
        }

        const tokenData = await response.json();
        res.json(tokenData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Failed to exchange code for token',
            details: error.message
        });
    }
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});