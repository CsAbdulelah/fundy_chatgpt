import { NavLink } from 'react-router-dom'

const links = [
  { to: '/builder', label: 'Form Builder' },
  { to: '/lp-form', label: 'LP Submission' },
  { to: '/review', label: 'GP Review' },
  { to: '/components', label: 'Components' },
]

export default function SideNav() {
  return (
    <aside className="app-sidebar">
      <div className="brand">
        <div className="brand-badge" />
        <div>
          <div className="brand-title">KYC Flow Studio</div>
          <div className="card-subtitle">Saudi Arabia · Funds</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="card-title">Team Workspace</div>
        <div className="card-subtitle">Assign permissions per reviewer.</div>
        <div className="action-row">
          <button className="btn secondary">Invite Member</button>
        </div>
      </div>
    </aside>
  )
}
