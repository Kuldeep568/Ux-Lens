import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getReviews, getReview, deleteReview } from '../services/api'
import { downloadReviewPDF } from '../services/pdfExport'

function scoreColor(s) {
    return s >= 75 ? 'var(--green)' : s >= 50 ? 'var(--accent-light)' : s >= 30 ? 'var(--amber)' : 'var(--red)'
}

export default function HistoryPage() {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchReviews = () => {
        setLoading(true)
        getReviews()
            .then(res => setReviews(res.data.data))
            .catch(err => console.error('[UXLens] History fetch failed:', err.message))
            .finally(() => setLoading(false))
    }

    useEffect(() => { fetchReviews() }, [])

    const handleDelete = async (e, id) => {
        e.preventDefault(); e.stopPropagation()
        if (!window.confirm('Delete this review?')) return
        try {
            await deleteReview(id)
            setReviews(prev => prev.filter(r => r._id !== id))
        } catch (err) { console.error('[UXLens] Delete failed:', err.message) }
    }

    const handlePDF = async (e, id) => {
        e.preventDefault(); e.stopPropagation()
        try {
            const res = await getReview(id)
            downloadReviewPDF(res.data.data)
        } catch (err) { console.error('[UXLens] PDF failed:', err.message) }
    }


    return (
        <main className="page">
            <div className="container">
                <div className="page-header fade-up">
                    <h1>Review History</h1>
                    <p>Your last 5 saved UX audits</p>
                </div>

                {loading && (
                    <div className="loading-wrap">
                        <div className="spinner" />
                        <p className="loading-text">Loading history…</p>
                    </div>
                )}

                {!loading && reviews.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <h3>No reviews yet</h3>
                        <p>Analyze a website to see it appear here.</p>
                        <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>← Analyze a URL</Link>
                    </div>
                )}

                <div className="history-list">
                    {reviews.map((r, i) => (
                        <Link to={`/review/${r._id}`} key={r._id}
                            className="history-card fade-up" style={{ animationDelay: `${i * 0.055}s` }}>
                            <div className="history-score" style={{ color: scoreColor(r.score) }}>{r.score}</div>
                            <div className="history-info">
                                <div className="history-url">{r.url}</div>
                                <div className="history-title">{r.title}</div>
                                <div className="history-meta">{r.issues?.length || 0} issues · {new Date(r.createdAt).toLocaleString()}</div>
                            </div>
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={e => handlePDF(e, r._id)} title="Download PDF">📥</button>
                            <button className="btn btn-danger btn-sm btn-icon" onClick={e => handleDelete(e, r._id)} title="Delete">🗑</button>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    )
}
