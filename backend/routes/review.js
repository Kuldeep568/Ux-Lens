const express = require('express');
const mongoose = require('mongoose');
const { scrapePage } = require('../services/scraper');
const { analyzeUX } = require('../services/llm');
const Review = require('../models/Review');

const router = express.Router();

// POST /api/review - Submit a URL for UX review
router.post('/', async (req, res, next) => {
    try {
        const { url } = req.body;

        // Validation
        if (!url || typeof url !== 'string' || url.trim() === '') {
            return res.status(400).json({ success: false, message: 'URL is required.' });
        }

        let parsedUrl;
        try {
            parsedUrl = new URL(url.trim());
        } catch {
            return res.status(400).json({ success: false, message: 'Invalid URL. Please include http:// or https://.' });
        }

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return res.status(400).json({ success: false, message: 'Only http and https URLs are supported.' });
        }

        // 1. Scrape the page
        let scrapedData;
        try {
            scrapedData = await scrapePage(url.trim());
        } catch (scrapeErr) {
            console.error('Scrape error:', scrapeErr.message);
            return res.status(502).json({
                success: false,
                message: `Could not load the page: ${scrapeErr.message}. The site may block bots or be unreachable.`,
            });
        }

        // 2. Analyze with LLM
        let analysis;
        try {
            analysis = await analyzeUX(scrapedData);
        } catch (llmErr) {
            console.error('LLM error:', llmErr.message);
            return res.status(504).json({
                success: false,
                message: `AI analysis failed: ${llmErr.message}. Check your API key or try again.`,
            });
        }

        // 3. Save to DB
        const review = new Review({
            url: url.trim(),
            title: scrapedData.title,
            score: analysis.score,
            summary: analysis.summary,
            issues: analysis.issues,
            beforeAfter: analysis.beforeAfter,
            screenshotBase64: scrapedData.screenshotBase64,
            scrapedData: {
                headings: scrapedData.headings,
                buttons: scrapedData.buttons,
                forms: scrapedData.forms,
                bodyText: scrapedData.bodyText.slice(0, 1000),
            },
        });

        await review.save();

        // Keep only last 5 reviews in DB
        const count = await Review.countDocuments();
        if (count > 5) {
            const oldest = await Review.find().sort({ createdAt: 1 }).limit(count - 5);
            const oldestIds = oldest.map((r) => r._id);
            await Review.deleteMany({ _id: { $in: oldestIds } });
        }

        res.status(201).json({ success: true, data: review });
    } catch (err) {
        next(err);
    }
});

// GET /api/reviews - Get last 5 reviews
router.get('/', async (req, res, next) => {
    try {
        const reviews = await Review.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('-screenshotBase64 -scrapedData.bodyText');
        res.json({ success: true, data: reviews });
    } catch (err) {
        next(err);
    }
});

// GET /api/reviews/:id - Get single review with full data
router.get('/:id', async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid review ID.' });
        }
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
        res.json({ success: true, data: review });
    } catch (err) {
        next(err);
    }
});

// DELETE /api/reviews/:id - Delete a review
router.delete('/:id', async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid review ID.' });
        }
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });
        res.json({ success: true, message: 'Review deleted.' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
