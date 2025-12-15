require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const requestIp = require('request-ip');
const useragent = require('useragent');
const geoip = require('geoip-lite');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disable for simplicity, configure properly in production
}));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(requestIp.mw());

// API endpoint untuk mendapatkan informasi IP
app.get('/api/myip', (req, res) => {
    try {
        const clientIp = req.clientIp;
        const userAgent = req.headers['user-agent'];
        const agent = useragent.parse(userAgent);
        
        // Dapatkan informasi lokasi dari IP
        const geo = geoip.lookup(clientIp);
        
        // Informasi browser dan OS
        const browserInfo = {
            browser: agent.family,
            version: agent.toVersion(),
            os: agent.os.family,
            osVersion: agent.os.toVersion(),
            device: agent.device.family
        };
        
        // Informasi koneksi
        const connectionInfo = {
            secure: req.secure,
            protocol: req.protocol,
            host: req.get('host'),
            origin: req.get('origin') || 'N/A'
        };
        
        // Informasi headers
        const headersInfo = {
            acceptLanguage: req.headers['accept-language'] || 'N/A',
            acceptEncoding: req.headers['accept-encoding'] || 'N/A',
            connection: req.headers['connection'] || 'N/A',
            cacheControl: req.headers['cache-control'] || 'N/A'
        };
        
        // Response data
        const responseData = {
            success: true,
            timestamp: new Date().toISOString(),
            ipAddress: clientIp,
            location: geo ? {
                country: geo.country,
                region: geo.region,
                city: geo.city,
                timezone: geo.timezone,
                ll: geo.ll, // Latitude dan Longitude
                metro: geo.metro,
                range: geo.range
            } : null,
            userAgent: browserInfo,
            connection: connectionInfo,
            headers: headersInfo,
            rawHeaders: req.headers,
            method: req.method,
            url: req.originalUrl,
            query: req.query
        };
        
        res.json(responseData);
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Endpoint untuk halaman utama
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint untuk halaman about
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

// Endpoint untuk testing
app.get('/api/test', (req, res) => {
    res.json({
        message: 'API is working!',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Something went wrong!'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log(`API endpoint: http://localhost:${PORT}/api/myip`);
});