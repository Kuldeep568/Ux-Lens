# AI Notes

## LLM Used

**Model:** Google Gemini 2.0 Flash  
**Provider:** Google AI Studio (via `@google/generative-ai` SDK v0.24)  
**Why:** Gemini 2.0 Flash offers a generous free tier, fast response times (~5–10s), and a large context window — ideal for sending long scraped page content. It returns clean JSON reliably when instructed.

---

## What I Used AI For

- **Prompt engineering** — designed the structured JSON prompt telling Gemini to return 8–12 issues with specific fields (`category`, `title`, `why`, `proof`, `severity`) and `beforeAfter` suggestions
- **LLM Service boilerplate** — used AI to generate the initial `llm.js` with proper error handling, JSON extraction, and structure validation
- **Mongoose schema** — AI helped draft the nested `issueSchema` and `beforeAfterSchema`
- **CSS design tokens** — AI suggested the dark-mode color palette and glassmorphism variable names
- **ScoreRing SVG math** — used AI assistance to work out the `strokeDashoffset` formula for the animated ring

---

## What I Checked / Built Myself

- Verified the Puppeteer scraping logic extracts the right DOM elements (`h1-h3`, `button`, `form`, `input`)
- Manually tested JSON parsing from Gemini — added regex fallback to extract `{...}` from response
- Tested the "keep only last 5 reviews" logic in the POST route manually
- Reviewed and validated all Express routes for correct HTTP status codes
- Checked CORS settings work with Vite proxy
- Validated error paths (invalid URL, LLM timeout, scrape failure) return user-friendly messages
- Designed the tab-group category filter and the compare page layout myself

---

## Notes on AI Reliability

- Gemini occasionally adds markdown (` ```json `) around the JSON — handled with a regex extractor
- For very simple pages, Gemini may return fewer than 8 issues — prompt includes "Rules" section to enforce count
