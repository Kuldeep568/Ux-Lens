import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitReview } from '../services/api'

const STEPS = [
    { num: '01', title: 'Paste a URL', desc: 'Any public site starting with https://' },
    { num: '02', title: 'AI Scrapes & Audits', desc: 'Puppeteer + Gemini AI analyze the page' },
    { num: '03', title: 'Get Your Report', desc: '8–12 issues scored, grouped, with fixes' },
    { num: '04', title: 'Review History', desc: 'Last 5 audits saved automatically' },
]

export default function Home() {
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const inputRef = useRef(null)
    const navigate = useNavigate()

    const triggerShake = () => {
        inputRef.current?.classList.add('shake')
        setTimeout(() => inputRef.current?.classList.remove('shake'), 400)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const trimmed = url.trim()

        if (!trimmed) { triggerShake(); return }
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
            console.error('[UXLens] Invalid URL — must start with http:// or https://', trimmed)
            triggerShake(); return
        }

        setLoading(true)
        try {
            const res = await submitReview(trimmed)
            navigate(`/review/${res.data.data._id}`)
        } catch (err) {
            console.error('[UXLens] Analysis failed:', err.response?.data?.message || err.message)
            triggerShake()
            setLoading(false)
        }
    }

    return (
        <main className="page">
            <div className="container">
                {/* Hero */}
                <section className="hero">
                    <div className="hero-eyebrow fade-up">
                        <span className="dot" />
                        AI-Powered UX Audits
                    </div>

                    <h1 className="fade-up delay-1">
                        Review any website's UX<br />
                        in <span className="grad-text">seconds</span>
                    </h1>

                    <p className="hero-sub fade-up delay-2">
                        Paste a URL and receive a fully scored usability report — issues categorized, prioritized, and paired with before/after improvements.
                    </p>

                    {/* URL Input */}
                    <form onSubmit={handleSubmit} className="fade-up delay-3" style={{ maxWidth: 680, margin: '0 auto' }}>
                        <div className="hero-input-wrap">
                            <span style={{ fontSize: '1rem', opacity: 0.4, flexShrink: 0 }}>🔗</span>
                            <input
                                ref={inputRef}
                                className="hero-input"
                                type="text"
                                placeholder="https://yoursite.com"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                disabled={loading}
                                id="url-input"
                                autoComplete="off"
                                spellCheck="false"
                            />
                            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} id="analyze-btn">
                                {loading ? (
                                    <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, margin: 0 }} /> Analyzing…</>
                                ) : (
                                    '⚡ Analyze'
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Loading indicator below */}
                    {loading && (
                        <div className="loading-wrap" style={{ padding: '40px 0 0' }}>
                            <p className="loading-text">Scraping page & running AI audit…</p>
                            <p className="loading-sub">Takes up to 60 seconds for heavier sites</p>
                        </div>
                    )}
                </section>

                {/* Steps */}
                {!loading && (
                    <section className="fade-up delay-4">
                        <p style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                            How it works
                        </p>
                        <div className="steps">
                            {STEPS.map((s, i) => (
                                <div className="step-card" key={s.num} style={{ animationDelay: `${i * 0.07}s` }}>
                                    <div className="step-num">{s.num}</div>
                                    <h3>{s.title}</h3>
                                    <p>{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </main>
    )
}
