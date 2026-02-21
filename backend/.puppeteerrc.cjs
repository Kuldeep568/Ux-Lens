/**
 * Puppeteer config — ensures Chrome is found in the right location
 * on both local machines and Render's container environment.
 */
const { join } = require('path')

module.exports = {
    // Use the cache dir set by PUPPETEER_CACHE_DIR env var, or fall back to default
    cacheDirectory: process.env.PUPPETEER_CACHE_DIR || join(__dirname, '.cache', 'puppeteer'),
}
