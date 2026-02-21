# UX Lens — AI Website UX Reviewer

A full-stack MERN application that scrapes any URL and generates a detailed, AI-powered UX audit report in seconds.

---

## 🚀 How to Run

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`) **or** a MongoDB Atlas connection string
- A Google Gemini API key → [Get one here](https://aistudio.google.com/app/apikey)

### 1. Backend

```bash
cd backend
# Fill in your keys in .env
# MONGO_URI=mongodb://localhost:27017/ux-reviewer
# GEMINI_API_KEY=your_key_here

npm start
# Server runs on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## ✅ What's Done

| Feature | Status |
|---------|--------|
| Paste URL → scrape with Puppeteer | ✅ |
| AI UX review (8–12 issues, 5 categories) | ✅ |
| Score 0–100 with animated ring | ✅ |
| Issue category tabs (clarity, layout, navigation, accessibility, trust) | ✅ |
| Before/After suggestions for top 3 issues | ✅ |
| Page screenshot captured and displayed | ✅ |
| Save last 5 reviews in MongoDB | ✅ |
| Review history page | ✅ |
| Delete reviews | ✅ |
| Export review as JSON | ✅ |
| Compare two URLs side-by-side | ✅ |
| Status page (server / DB / LLM health) | ✅ |
| Empty/invalid URL validation | ✅ |
| Premium dark-mode UI | ✅ |

## ❌ What's Not Done / Known Limitations

- PDF export (JSON export is available)  
- Login/auth — no user accounts, reviews are global  
- Sites with aggressive bot detection (Cloudflare) may fail to scrape  
- Screenshots of SPAs may miss dynamically-loaded content  
- No rate limiting on the API  

---

## 🔧 Environment Variables (backend/.env)

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/ux-reviewer
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 📁 Project Structure

```
website-review/
├── backend/
│   ├── models/Review.js
│   ├── routes/review.js
│   ├── routes/status.js
│   ├── services/scraper.js   (Puppeteer)
│   ├── services/llm.js       (Gemini API)
│   ├── middleware/errorHandler.js
│   ├── server.js
│   └── .env
└── frontend/
    └── src/
        ├── pages/            (Home, ReviewPage, HistoryPage, StatusPage, ComparePage)
        ├── components/       (Navbar, ScoreRing, IssueCard, BeforeAfter)
        └── services/api.js
```
