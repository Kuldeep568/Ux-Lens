export default function ScoreRing({ score, summary }) {
    const radius = 52
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference

    const color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--accent-light)' : score >= 30 ? 'var(--amber)' : 'var(--red)'
    const label = score >= 75 ? 'Great UX' : score >= 50 ? 'Average UX' : score >= 30 ? 'Needs Work' : 'Poor UX'

    return (
        <div className="score-ring-wrap">
            <div style={{ position: 'relative', width: 124, height: 124, flexShrink: 0 }}>
                <svg width="124" height="124" className="score-ring">
                    <circle cx="62" cy="62" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
                    <circle
                        cx="62" cy="62" r={radius} fill="none"
                        stroke={color} strokeWidth="9" strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)', filter: `drop-shadow(0 0 6px ${color})` }}
                    />
                </svg>
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                    <span className="score-ring-val" style={{ color }}>{score}</span>
                    <span className="score-ring-label">/ 100</span>
                </div>
            </div>
            <div className="score-info">
                <h2 style={{ color }}>{label}</h2>
                {summary && <p>{summary}</p>}
            </div>
        </div>
    )
}
