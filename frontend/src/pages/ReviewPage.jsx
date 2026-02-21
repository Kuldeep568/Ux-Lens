import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getReview, deleteReview } from '../services/api'
import { downloadReviewPDF } from '../services/pdfExport'
import ScoreRing from '../components/ScoreRing'
import IssueCard from '../components/IssueCard'
import BeforeAfter from '../components/BeforeAfter'

const CATEGORIES = ['clarity', 'layout', 'navigation', 'accessibility', 'trust']

export default function ReviewPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [review, setReview] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('all')
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        getReview(id)
            .then(res => setReview(res.data.data))
            .catch(err => console.error('[UXLens] Failed to load review:', err.message))
            .finally(() => setLoading(false))
    }, [id])

    const handleDelete = async () => {
        if (!window.confirm('Delete this review?')) return
        setDeleting(true)
        try { await deleteReview(id); navigate('/history') }
        catch (err) { console.error('[UXLens] Delete failed:', err.message); setDeleting(false) }
    }


    const handleDownloadPDF = () => downloadReviewPDF(review)


    if (loading) return (
        <div className="loading-wrap">
            <div className="spinner" />
            <p className="loading-text">Loading review…</p>
        </div>
    )

    if (!review) return (
        <div className="page"><div className="container">
            <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>Review not found</h3>
                <p>It may have been deleted or the ID is incorrect.</p>
                <Link to="/" className="btn btn-ghost" style={{ marginTop: 20 }}>← Back to Home</Link>
            </div>
        </div></div>
    )

    const issueCounts = CATEGORIES.reduce((a, c) => { a[c] = review.issues.filter(i => i.category === c).length; return a }, {})
    const filtered = activeTab === 'all' ? review.issues : review.issues.filter(i => i.category === activeTab)

    return (
        <main className="page">
            <div className="container">
                {/* Action bar */}
                <div className="action-bar fade-up">
                    <Link to="/" className="btn btn-ghost btn-sm">← New Analysis</Link>
                    <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={handleDownloadPDF}>📥 Download PDF</button>
                        <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
                            {deleting ? '…' : '🗑 Delete'}
                        </button>
                    </div>
                </div>

                {/* Header card */}
                <div className="card fade-up delay-1" style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 20 }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                            Analyzed URL
                        </p>
                        <a href={review.url} target="_blank" rel="noopener noreferrer"
                            style={{ color: 'var(--accent-light)', fontSize: '0.9rem', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
                            {review.url}
                        </a>
                        <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{review.title}</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>•</span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(review.createdAt).toLocaleString()}</span>
                        </div>
                    </div>
                    <ScoreRing score={review.score} summary={review.summary} />
                </div>

                {/* Screenshot */}
                {review.screenshotBase64 && (
                    <div className="fade-up delay-2" style={{ marginBottom: 16 }}>
                        <div className="section-title" style={{ marginBottom: 12 }}>📸 Page Screenshot</div>
                        <div className="screenshot-wrap">
                            <img src={`data:image/jpeg;base64,${review.screenshotBase64}`} alt="Website screenshot" />
                        </div>
                    </div>
                )}

                <div className="divider" />

                {/* Issues */}
                <div className="fade-up delay-2">
                    <div className="section-header">
                        <div className="section-title">
                            🔍 UX Issues <span className="count-pill">{review.issues.length}</span>
                        </div>
                    </div>
                    <div className="tab-group">
                        <button className={`tab-btn${activeTab === 'all' ? ' active' : ''}`} onClick={() => setActiveTab('all')}>
                            All ({review.issues.length})
                        </button>
                        {CATEGORIES.map(cat => issueCounts[cat] > 0 && (
                            <button key={cat} className={`tab-btn${activeTab === cat ? ' active' : ''}`} onClick={() => setActiveTab(cat)}>
                                {cat[0].toUpperCase() + cat.slice(1)} ({issueCounts[cat]})
                            </button>
                        ))}
                    </div>
                    <div className="issues-grid">
                        {filtered.map((issue, i) => <IssueCard key={i} issue={issue} index={i} />)}
                    </div>
                </div>

                {review.beforeAfter?.length > 0 && (
                    <>
                        <div className="divider" />
                        <div className="fade-up">
                            <div className="section-title" style={{ marginBottom: 20 }}>
                                ✨ Top 3 Improvements — Before & After
                            </div>
                            <BeforeAfter items={review.beforeAfter} />
                        </div>
                    </>
                )}
            </div>
        </main>
    )
}
