const express = require('express');
const mongoose = require('mongoose');
const { checkLLMConnection } = require('../services/llm');

const router = express.Router();

// GET /api/status
router.get('/', async (req, res) => {
    const status = {
        server: { status: 'ok', message: 'Express server is running' },
        database: { status: 'unknown', message: '' },
        llm: { status: 'unknown', message: '' },
        timestamp: new Date().toISOString(),
    };

    // Check MongoDB
    const dbState = mongoose.connection.readyState;
    const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    status.database.status = dbState === 1 ? 'ok' : 'error';
    status.database.message = `MongoDB is ${dbStates[dbState] || 'unknown'}`;

    // Check LLM
    try {
        const llmOk = await checkLLMConnection();
        status.llm.status = llmOk ? 'ok' : 'error';
        status.llm.message = llmOk ? 'Gemini 1.5 Flash is reachable' : 'LLM responded unexpectedly';
    } catch (err) {
        status.llm.status = 'error';
        status.llm.message = `LLM unreachable: ${err.message}`;
    }

    const allOk = Object.values(status).every((s) => typeof s !== 'object' || s.status === 'ok');
    res.status(allOk ? 200 : 207).json({ success: true, data: status });
});

module.exports = router;
