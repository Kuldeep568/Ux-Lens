import { useState, useRef } from 'react'
import { submitReview } from '../services/api'
import { downloadComparisonPDF } from '../services/pdfExport'
import ScoreRing from '../components/ScoreRing'
import IssueCard from '../components/IssueCard'
import BeforeAfter from '../components/BeforeAfter'

const CATEGORIES = ['clarity', 'layout', 'navigation', 'accessibility', 'trust']

function scoreColor(s) {
    return s >= 75 ? 'var(--green)' : s >= 50 ? 'var(--accent-light)' : s >= 30 ? 'var(--amber)' : 'var(--red)'
}

function ReviewColumn({ result, url, accentColor }) {
    const [tab, setTab] = useState('all')
    const counts = CATEGORIES.reduce((a, c) => { a[c] = result.issues.filter(i => i.category === c).length; return a }, {})
    const filtered = tab === 'all' ? result.issues : result.issues.filter(i => i.category === tab)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                    Analyzed URL
                </p>
                <p style={{ fontSize: '0.82rem', color: accentColor, fontFamily: 'var(--font-mono)', wordBreak: 'break-all', marginBottom: 16 }}>{url}</p>
                <ScoreRing score={result.score} summary={result.summary} />
            </div>

            {result.screenshotBase64 && (
                <div className="screenshot-wrap">
                    <img src={`data:image/jpeg;base64,${result.screenshotBase64}`} alt="Screenshot" />
                </div>
            )}

            <div>
                <div className="tab-group" style={{ flexWrap: 'wrap' }}>
                    <button className={`tab-btn${tab === 'all' ? ' active' : ''}`} onClick={() => setTab('all')}>All ({result.issues.length})</button>
                    {CATEGORIES.map(cat => counts[cat] > 0 && (
                        <button key={cat} className={`tab-btn${tab === cat ? ' active' : ''}`} onClick={() => setTab(cat)}>
                            {cat[0].toUpperCase() + cat.slice(1)} ({counts[cat]})
                        </button>
                    ))}
                </div>
                <div className="issues-grid">
                    {filtered.map((issue, i) => <IssueCard key={i} issue={issue} index={i} />)}
                </div>
            </div>

            {result.beforeAfter?.length > 0 && (
                <div>
                    <div className="section-title" style={{ marginBottom: 14 }}>✨ Top Improvements</div>
                    <BeforeAfter items={result.beforeAfter} />
                </div>
            )}
        </div>
    )
}

export default function ComparePage() {
    const [urlA, setUrlA] = useState('')
    const [urlB, setUrlB] = useState('')
    const [loading, setLoading] = useState(false)
    const [resultA, setResultA] = useState(null)
    const [resultB, setResultB] = useState(null)
    const [compared, setCompared] = useState(false)
    const inputARef = useRef(null)
    const inputBRef = useRef(null)

    const shake = (ref) => {
        ref.current?.classList.add('shake')
        setTimeout(() => ref.current?.classList.remove('shake'), 400)
    }

    const handleCompare = async (e) => {
        e.preventDefault()
        setResultA(null); setResultB(null); setCompared(false)

        const a = urlA.trim(), b = urlB.trim()
        if (!a || !a.startsWith('http')) { shake(inputARef); console.error('[UXLens] Invalid Site A URL'); return }
        if (!b || !b.startsWith('http')) { shake(inputBRef); console.error('[UXLens] Invalid Site B URL'); return }
        if (a === b) { shake(inputBRef); console.error('[UXLens] Both URLs are the same'); return }

        setLoading(true)
        try {
            const [resA, resB] = await Promise.all([submitReview(a), submitReview(b)])
            setResultA(resA.data.data)
            setResultB(resB.data.data)
            setCompared(true)
        } catch (err) {
            console.error('[UXLens] Compare failed:', err.response?.data?.message || err.message)
        } finally {
            setLoading(false)
        }
    }

    const winner = compared
        ? resultA.score > resultB.score ? 'A'
            : resultB.score > resultA.score ? 'B' : 'tie'
        : null

    return (
        <main className="page">
            <div className="container">
                <div className="page-header fade-up">
                    <h1>Compare Two URLs</h1>
                    <p>Enter both URLs — we'll analyze them simultaneously and show a full side-by-side breakdown.</p>
                </div>

                {/* Input form */}
                <form onSubmit={handleCompare}>
                    <div className="card fade-up" style={{ marginBottom: 20 }}>
                        <div className="compare-grid" style={{ marginBottom: 16 }}>
                            <div className="field">
                                <label className="field-label" style={{ color: 'var(--accent-light)' }}>Site A</label>
                                <input ref={inputARef} className="input" type="text" placeholder="https://site-a.com"
                                    value={urlA} onChange={e => setUrlA(e.target.value)} disabled={loading} id="url-a" />
                            </div>
                            <div className="field">
                                <label className="field-label" style={{ color: 'var(--teal)' }}>Site B</label>
                                <input ref={inputBRef} className="input" type="text" placeholder="https://site-b.com"
                                    value={urlB} onChange={e => setUrlB(e.target.value)} disabled={loading} id="url-b" />
                            </div>
                        </div>
                        <button className="btn btn-primary" type="submit" disabled={loading}
                            id="compare-btn" style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
                            {loading
                                ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, margin: 0 }} /> Analyzing both sites simultaneously…</>
                                : '⚡ Compare Now'}
                        </button>
                    </div>
                </form>

                {loading && (
                    <div className="loading-wrap">
                        <div className="spinner" />
                        <p className="loading-text">Running both audits in parallel…</p>
                        <p className="loading-sub">Scraping + AI analysis for each site, up to 90s</p>
                    </div>
                )}

                {/* Score banner */}
                {compared && resultA && resultB && (
                    <div className="card fade-up" style={{ textAlign: 'center', marginBottom: 24 }}>
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20, fontWeight: 600 }}>
                            UX Score Comparison
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, flexWrap: 'wrap', marginBottom: 16 }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Site A</div>
                                <div style={{ fontSize: '4rem', fontWeight: 900, color: winner === 'A' ? 'var(--green)' : scoreColor(resultA.score), lineHeight: 1, letterSpacing: '-2px' }}>
                                    {resultA.score}
                                </div>
                                {winner === 'A' && <div style={{ fontSize: '0.72rem', color: 'var(--green)', fontWeight: 700, marginTop: 6 }}>🏆 Winner</div>}
                            </div>
                            <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)', fontWeight: 800 }}>vs</div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Site B</div>
                                <div style={{ fontSize: '4rem', fontWeight: 900, color: winner === 'B' ? 'var(--green)' : scoreColor(resultB.score), lineHeight: 1, letterSpacing: '-2px' }}>
                                    {resultB.score}
                                </div>
                                {winner === 'B' && <div style={{ fontSize: '0.72rem', color: 'var(--green)', fontWeight: 700, marginTop: 6 }}>🏆 Winner</div>}
                            </div>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                            {winner === 'tie'
                                ? "🤝 It's a tie!"
                                : `${winner === 'A' ? new URL(urlA).hostname : new URL(urlB).hostname} wins by ${Math.abs(resultA.score - resultB.score)} pts`}
                        </p>

                        {/* Quick stats */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                            {[
                                ['Issues', resultA.issues.length, resultB.issues.length],
                                ['High Severity', resultA.issues.filter(i => i.severity === 'high').length, resultB.issues.filter(i => i.severity === 'high').length],
                            ].map(([label, a, b]) => (
                                <div key={label} style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontWeight: 600 }}>{label}</div>
                                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: a <= b ? 'var(--green)' : 'var(--red)' }}>{a}</span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>vs</span>
                                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: b <= a ? 'var(--green)' : 'var(--red)' }}>{b}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => downloadComparisonPDF(resultA, resultB, urlA, urlB)}
                                style={{ margin: '0 auto', display: 'flex' }}
                            >
                                📥 Download Comparison PDF
                            </button>
                        </div>
                    </div>
                )}


                {/* Side by side */}
                {compared && resultA && resultB && (
                    <div className="compare-grid fade-up">
                        <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                                Site A — {new URL(urlA).hostname}
                            </div>
                            <ReviewColumn result={resultA} url={urlA} accentColor="var(--accent-light)" />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                                Site B — {new URL(urlB).hostname}
                            </div>
                            <ReviewColumn result={resultB} url={urlB} accentColor="var(--teal)" />
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
