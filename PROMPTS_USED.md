# Prompts Used During Development

A record of key prompts used while building UX Lens. Agent responses and API keys are excluded.

---

## 1. LLM UX Analysis Prompt (sent to Gemini per review)

```
You are an expert UX auditor. Analyze the following website content and return a detailed UX review.

Website Data:
- Title: {title}
- Meta Description: {metaDescription}
- Has Viewport Meta: {hasViewport}
- Headings: {headings}
- Buttons/CTAs: {buttons}
- Forms: {forms}
- Accessibility: Images without alt={n}, Empty alt={n}, Inputs without label={n}, Links without text={n}
- Main Text (first 2000 chars): {bodyText}

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentence executive summary>",
  "issues": [
    {
      "category": "<clarity|layout|navigation|accessibility|trust>",
      "title": "<short issue title>",
      "why": "<1-2 sentences>",
      "proof": "<exact text/element from the page>",
      "severity": "<low|medium|high>"
    }
  ],
  "beforeAfter": [
    {
      "issueTitle": "...",
      "category": "...",
      "before": "...",
      "after": "...",
      "explanation": "..."
    }
  ]
}

Rules:
- Generate 8-12 issues covering multiple categories
- beforeAfter must contain exactly 3 entries
- Be specific, reference actual content in "proof"
- Score: average site ~50-65, excellent ~80+, poor <40
```

---

## 2. Puppeteer Scraper Design Prompt

```
Write a Puppeteer scraper that:
- Takes a URL and navigates with a 30s timeout
- Extracts: page title, h1-h3 headings, button texts, form labels/inputs, body text (first 3000 chars)
- Counts accessibility issues: images without alt, inputs without labels, links without text
- Captures a JPEG screenshot and returns it as base64
- Handles browser launch with --no-sandbox flags for server environments
- Always closes the browser in a finally block
```

---

## 3. Mongoose Schema Design Prompt

```
Design a Mongoose schema for a UX review document that stores:
- url, title, score (0-100), summary
- issues array: each with category (enum), title, why, proof, severity (enum)
- beforeAfter array: each with issueTitle, category, before, after, explanation
- screenshotBase64, scrapedData (headings, buttons, forms, bodyText)
- timestamps (createdAt, updatedAt)
```

---

## 4. Score Ring SVG Prompt

```
Create a React component that renders an animated SVG circular progress ring.
- Accepts score (0-100) prop
- Uses strokeDasharray and strokeDashoffset to animate the progress
- Color: green for 75+, indigo for 50-74, amber for 30-49, red below 30
- Shows score number in the center
- Adds a CSS transition for smooth animation on mount
```

---

## 5. CSS Design System Prompt

```
Create a premium dark-mode CSS design system for a SaaS web app with:
- Dark background (#0a0b0f), surface cards, and glassmorphism effects
- Accent color: indigo (#6366f1) with glow effects
- Variables for colors, radius, shadows, transitions
- Reusable classes for cards, buttons (primary/outline/danger), inputs
- Category-specific badge colors (clarity=indigo, layout=teal, navigation=amber, accessibility=pink, trust=green)
- A loading spinner animation and fadeUp entrance animation
```

---

## 6. Compare Page Layout Prompt

```
Design a React compare page that:
- Shows two URL inputs side by side in a grid
- Each side independently fetches and displays a UX review
- Shows an overall score comparison bar at the top once both are loaded
- Highlights the winner in green
- Reuses existing IssueCard and ScoreRing components
```
