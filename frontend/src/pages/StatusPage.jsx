import { useState, useEffect } from 'react'
import { getStatus } from '../services/api'

function StatusCard({ label, icon, status, message }) {
    const dotClass = `status-dot status-dot-${status}`
    const valText = status === 'ok' ? 'Operational' : status === 'error' ? 'Error' : 'Checking…'
    const valColor = status === 'ok' ? 'var(--green)' : status === 'error' ? 'var(--red)' : 'var(--amber)'
    const borderColor = status === 'ok'
        ? 'rgba(34,197,94,0.18)' : status === 'error'
            ? 'rgba(239,68,68,0.18)' : 'rgba(245,158,11,0.15)'

    return (
        <div className="status-card" style={{ borderColor }}>
            <span className={dotClass} />
            <div>
                <div style={{ fontSize: '1.4rem', marginBottom: 8 }}>{icon}</div>
                <div className="status-label">{label}</div>
                <div className="status-val" style={{ color: valColor }}>{valText}</div>
                <div className="status-msg">{message}</div>
            </div>
        </div>
    )
}

export default function StatusPage() {
    const [status, setStatus] = useState(null)
    const [loading, setLoading] = useState(true)
    const [lastChecked, setLastChecked] = useState(null)

    const fetchStatus = () => {
        setLoading(true)
        getStatus()
            .then(res => { setStatus(res.data.data); setLastChecked(new Date()) })
            .catch(err => console.error('[UXLens] Status check failed:', err.message))
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchStatus() }, [])

    const services = status ? [
        { label: 'Express Server', icon: '🖥️', status: status.server.status, message: status.server.message },
        { label: 'MongoDB Database', icon: '🗄️', status: status.database.status, message: status.database.message },
        { label: 'Gemini AI (LLM)', icon: '🤖', status: status.llm.status, message: status.llm.message },
    ] : []

    return (
        <main className="page">
            <div className="container">
                <div className="page-header fade-up">
                    <h1>System Status</h1>
                    <p>Live health check for all backend services</p>
                </div>

                {loading && <div className="loading-wrap"><div className="spinner" /><p className="loading-text">Checking services…</p></div>}

                {!loading && !status && (
                    <div className="empty-state">
                        <div className="empty-icon">🔌</div>
                        <h3>Backend unreachable</h3>
                        <p>Make sure the server is running on port 5000.</p>
                    </div>
                )}

                {!loading && status && (
                    <>
                        <div className="status-grid fade-up" style={{ marginBottom: 28 }}>
                            {services.map(s => <StatusCard key={s.label} {...s} />)}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
                            {lastChecked && (
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    Last checked: {lastChecked.toLocaleTimeString()}
                                </span>
                            )}
                            <button className="btn btn-ghost btn-sm" onClick={fetchStatus}>🔄 Refresh</button>
                        </div>

                        {/* Tech Stack */}
                        <div className="card fade-up delay-2">
                            <div className="section-title" style={{ marginBottom: 16 }}>🔧 Tech Stack</div>
                            <div className="tech-grid">
                                {[
                                    ['Backend', 'Node.js + Express'],
                                    ['Database', 'MongoDB + Mongoose'],
                                    ['AI Model', 'Gemini (Multi-model)'],
                                    ['Scraper', 'Puppeteer'],
                                    ['Frontend', 'React + Vite'],
                                    ['API Style', 'REST / JSON'],
                                ].map(([k, v]) => (
                                    <div className="tech-item" key={k}>
                                        <div className="tech-item-label">{k}</div>
                                        <div className="tech-item-val">{v}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    )
}
