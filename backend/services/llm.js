const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Models to try in order (fallback chain for quota issues)
const MODELS = ['gemini-3-flash-preview', 'gemini-2.5-flash-lite', 'gemini-2.5-flash'];

// Sleep helper
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Generate with retry + model fallback on 429
async function generateWithRetry(prompt, maxRetries = 3) {
  for (const modelName of MODELS) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        console.log(`✅ LLM success with model: ${modelName}`);
        return result;
      } catch (err) {
        const is429 = err.message?.includes('429') || err.message?.includes('Too Many Requests') || err.message?.includes('RESOURCE_EXHAUSTED');
        const isDailyLimit = err.message?.includes('limit: 0') || err.message?.includes('free_tier_requests');

        if (isDailyLimit) {
          // Daily quota exhausted for this model — try next model
          console.warn(`⚠ Daily quota exhausted for ${modelName}, trying next model...`);
          break; // break inner retry loop, try next model
        }

        if (is429 && attempt < maxRetries) {
          const waitMs = attempt * 15000; // 15s, 30s
          console.warn(`⚠ Rate limited on ${modelName}, retrying in ${waitMs / 1000}s... (attempt ${attempt}/${maxRetries})`);
          await sleep(waitMs);
          continue;
        }

        // Non-429 error or last attempt — throw
        throw err;
      }
    }
  }
  throw new Error('All LLM models exhausted their quota. Please check your Gemini API key at https://aistudio.google.com or wait for the daily limit to reset.');
}

async function analyzeUX(scrapedData) {
  const prompt = `You are an expert UX auditor. Analyze the following website content and return a detailed UX review.

Website Data:
- Title: ${scrapedData.title}
- Meta Description: ${scrapedData.metaDescription || 'MISSING'}
- Has Viewport Meta: ${scrapedData.hasViewport}
- Headings: ${scrapedData.headings.join(' | ')}
- Buttons/CTAs: ${scrapedData.buttons.join(' | ')}
- Forms: ${scrapedData.forms.join(' | ')}
- Accessibility: Images without alt=${scrapedData.a11y.imagesWithoutAlt}, Empty alt=${scrapedData.a11y.imagesWithEmptyAlt}, Inputs without label=${scrapedData.a11y.formsWithoutLabels}, Links without text=${scrapedData.a11y.linksWithNoText}
- Main Text (first 2000 chars): ${scrapedData.bodyText.slice(0, 2000)}

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "score": <number 0-100, overall UX score>,
  "summary": "<2-3 sentence executive summary of UX quality>",
  "issues": [
    {
      "category": "<one of: clarity|layout|navigation|accessibility|trust>",
      "title": "<short issue title>",
      "why": "<1-2 sentences explaining why this is a UX problem>",
      "proof": "<exact text, element, or statistic from the page that demonstrates the issue>",
      "severity": "<low|medium|high>"
    }
  ],
  "beforeAfter": [
    {
      "issueTitle": "<title of the issue being addressed>",
      "category": "<category>",
      "before": "<current problematic text/element/pattern>",
      "after": "<improved version with explanation>",
      "explanation": "<why this change improves UX>"
    }
  ]
}

Rules:
- Generate 8-12 issues covering multiple categories
- beforeAfter must contain exactly 3 entries for the top 3 most impactful issues
- Be specific, reference actual content from the page in "proof"
- Score should reflect real UX quality (average site ~50-65, excellent ~80+, poor <40)
- Issues must be actionable and specific, not generic`;

  const result = await generateWithRetry(prompt);
  const text = result.response.text();

  // Clean and parse JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('LLM did not return valid JSON');

  const parsed = JSON.parse(jsonMatch[0]);

  if (!parsed.issues || !Array.isArray(parsed.issues)) throw new Error('Invalid LLM response structure');
  if (!parsed.beforeAfter || !Array.isArray(parsed.beforeAfter)) parsed.beforeAfter = [];

  parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));

  return parsed;
}

async function checkLLMConnection() {
  try {
    const result = await generateWithRetry('Reply with only the word: OK', 1);
    const text = result.response.text();
    return text.includes('OK');
  } catch {
    return false;
  }
}

module.exports = { analyzeUX, checkLLMConnection };
