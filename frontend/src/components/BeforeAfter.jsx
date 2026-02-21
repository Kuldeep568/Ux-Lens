export default function BeforeAfter({ items }) {
    if (!items?.length) return null
    return (
        <div className="issues-grid">
            {items.map((item, i) => (
                <div className="card fade-up" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                    <div className="issue-header" style={{ marginBottom: 14 }}>
                        <span className={`badge badge-${item.category}`}>{item.category}</span>
                        <span className="issue-title">#{i + 1} — {item.issueTitle}</span>
                    </div>
                    <div className="ba-grid">
                        <div className="ba-box before">
                            <div className="ba-box-label">⚠ Before</div>
                            <div className="ba-text">{item.before}</div>
                        </div>
                        <div className="ba-box after">
                            <div className="ba-box-label">✓ After</div>
                            <div className="ba-text">{item.after}</div>
                        </div>
                    </div>
                    {item.explanation && <p className="ba-explanation">💡 {item.explanation}</p>}
                </div>
            ))}
        </div>
    )
}
