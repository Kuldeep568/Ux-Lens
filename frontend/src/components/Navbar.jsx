import { NavLink } from 'react-router-dom'

export default function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <NavLink to="/" className="navbar-logo">
                    <div className="logo-icon">🔍</div>
                    <span className="wordmark">UX<span>Lens</span></span>
                </NavLink>
                <div className="navbar-links">
                    {[
                        { to: '/', label: 'Analyze', end: true },
                        { to: '/compare', label: 'Compare' },
                        { to: '/history', label: 'History' },
                        { to: '/status', label: 'Status' },
                    ].map(({ to, label, end }) => (
                        <NavLink key={to} to={to} end={end}
                            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                            {label}
                        </NavLink>
                    ))}
                </div>
            </div>
        </nav>
    )
}
