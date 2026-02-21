const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['clarity', 'layout', 'navigation', 'accessibility', 'trust'],
    required: true,
  },
  title: { type: String, required: true },
  why: { type: String, required: true },
  proof: { type: String, default: '' }, // exact text/element referenced
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
});

const beforeAfterSchema = new mongoose.Schema({
  issueTitle: { type: String, required: true },
  category: { type: String, required: true },
  before: { type: String, required: true },
  after: { type: String, required: true },
  explanation: { type: String, default: '' },
});

const reviewSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    title: { type: String, default: 'Untitled Page' },
    score: { type: Number, min: 0, max: 100, default: 50 },
    summary: { type: String, default: '' },
    issues: [issueSchema],
    beforeAfter: [beforeAfterSchema],
    screenshotBase64: { type: String, default: '' },
    scrapedData: {
      headings: [String],
      buttons: [String],
      forms: [String],
      bodyText: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
