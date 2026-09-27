const fs = require('fs');
const https = require('https');

https.get('https://demo.inelabteamdev.com/assets/index-GaW5Fnef.js', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        // Find URLs or fetch calls
        const apiMatches = data.match(/['"]\/api\/[^'"]+['"]/g);
        console.log('API Endpoints found in JS:', [...new Set(apiMatches)]);
    });
});
