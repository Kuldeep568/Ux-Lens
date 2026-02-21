export default function IssueCard({ issue, index }) {
    return (
        <div className="issue-card fade-up" style={{ animationDelay: `${index * 0.04}s` }}>
            <div className="issue-header">
                <span className={`badge badge-${issue.category}`}>{issue.category}</span>
                <span className={`sev sev-${issue.severity}`}>{issue.severity}</span>
                <span className="issue-title">{issue.title}</span>
            </div>
            <p className="issue-why">{issue.why}</p>
            {issue.proof && (
                <>
                    <div className="proof-label">🔍 Proof / Reference</div>
                    <div className="proof-box">{issue.proof}</div>
                </>
            )}
        </div>
    )
}
