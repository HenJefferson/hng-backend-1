const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000; // Setting port to 3000 explicitly
app.get("/",(req,res)=> {
    res.json({
        "code": 200,
        "message" : "active"
    })
})
app.get('/api/hello', async (req, res) => {
    let visitorName = req.query.visitor_name || 'Guest';
    visitorName = visitorName.replace(/['"]/g, '').trim()
    let clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // Adjust IP address format if needed (strip IPv6 prefix)
    if (clientIp.includes(':')) {
        clientIp = clientIp.split(':').pop();
    }

    // Fallback IP for local testing
    if (clientIp === '::1' || clientIp === '127.0.0.1') {
        clientIp = '8.8.8.8'; // Google's public DNS server IP for testing
    }

    try {
        const locationResponse = await axios.get(`https://ipapi.co/${clientIp}/json/`);
        const { city, latitude, longitude } = locationResponse.data;

        if (!city || !latitude || !longitude) {
            throw new Error('Incomplete location data');
        }

        const weatherResponse = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const temperature = weatherResponse.data.current_weather.temperature;

        res.json({
            client_ip: clientIp,
            location: city,
            greeting: `Hello, ${visitorName}!, the temperature is ${temperature} degrees Celsius in ${city}`
        });
    } catch (error) {
        return res.send(error);
        console.error('Error fetching data:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        res.status(500).json({ error: 'Unable to fetch data' });
    }
});

app.listen(port,  () => {
    console.log(`Server is running on http://127.0.0.1:${port}`);
});