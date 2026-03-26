const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post('/api/get-video-link', async (req, res) => {
    const { url } = req.body;

    if (!url || !url.includes('teraboxapp.com') && !url.includes('terabox.com')) {
        return res.status(400).json({ error: 'Please provide a valid Terabox URL.' });
    }

    console.log(`Processing URL: ${url}`);
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        await page.goto(url, { waitUntil: 'networkidle2' });

        await page.waitForSelector('video', { timeout: 25000 });

        const videoSrc = await page.evaluate(() => {
            const video = document.querySelector('video');
            return video ? video.src : null;
        });

        if (videoSrc) {
            res.json({ success: true, videoUrl: videoSrc });
        } else {
            res.status(404).json({ error: 'Video source not found.' });
        }

    } catch (error) {
        console.error('An error occurred:', error.message);
        res.status(500).json({ error: 'Failed to fetch the video link. The site may be blocking requests or page is too slow.' });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});