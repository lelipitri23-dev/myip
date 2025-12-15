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
    contentSecurityPolicy: false,
}));
app.use(cors());

// Limit body dikembalikan ke default (kecil) karena tidak ada upload test lagi
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(requestIp.mw());

// --- API UTAMA (IP INFO) ---
app.get('/api/myip', (req, res) => {
    try {
        const clientIp = req.clientIp;
        const userAgent = req.headers['user-agent'];
        const agent = useragent.parse(userAgent);
        
        // GeoIP Lookup
        const geo = geoip.lookup(clientIp);
        
        const browserInfo = {
            browser: agent.family,
            version: agent.toVersion(),
            os: agent.os.family,
            osVersion: agent.os.toVersion(),
            device: agent.device.family
        };
        
        const connectionInfo = {
            secure: req.secure,
            protocol: req.protocol,
            host: req.get('host'),
            origin: req.get('origin') || 'N/A'
        };
        
        const headersInfo = {
            acceptLanguage: req.headers['accept-language'] || 'N/A',
            acceptEncoding: req.headers['accept-encoding'] || 'N/A',
            connection: req.headers['connection'] || 'N/A',
            cacheControl: req.headers['cache-control'] || 'N/A'
        };
        
        const responseData = {
            success: true,
            timestamp: new Date().toISOString(),
            ipAddress: clientIp,
            location: geo ? {
                country: geo.country,
                region: geo.region,
                city: geo.city,
                timezone: geo.timezone,
                ll: geo.ll,
                metro: geo.metro,
                range: geo.range,
                org: geo.org // Kadang geoip-lite punya field org (opsional)
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
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Endpoint Halaman Utama
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint Halaman About
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
