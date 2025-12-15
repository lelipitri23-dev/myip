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
// Limit body size untuk upload test
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(requestIp.mw());

// --- API UTAMA (IP INFO) ---
app.get('/api/myip', (req, res) => {
    try {
        const clientIp = req.clientIp;
        const userAgent = req.headers['user-agent'];
        const agent = useragent.parse(userAgent);
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
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// --- API SPEEDTEST ---

// 1. Latency / Ping Endpoint
app.get('/api/speedtest/ping', (req, res) => {
    res.status(200).send('pong');
});

// 2. Download Test (Mengirim junk data 5MB)
app.get('/api/speedtest/download', (req, res) => {
    // Generate buffer 5MB (sekitar 5 juta byte)
    const sizeInBytes = 5 * 1024 * 1024; 
    const buffer = Buffer.alloc(sizeInBytes, 'a');
    
    res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Length': sizeInBytes,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.send(buffer);
});

// 3. Upload Test (Menerima junk data)
app.post('/api/speedtest/upload', (req, res) => {
    // Data diterima tapi tidak disimpan untuk menghemat memori
    res.status(200).json({ success: true, message: 'Upload received' });
});


// Endpoint Halaman
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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
