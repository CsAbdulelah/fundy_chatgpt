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
      <div className="profile-card">
        <div className="profile-row">
          <div className="profile-avatar">SA</div>
          <div>
            <div className="profile-name">Sarah Smither</div>
            <div className="profile-email">sarahsmith@mail.com</div>
          </div>
        </div>
        <button className="btn primary full">+ Create Form</button>
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
        <div className="card-title">Help Center</div>
        <div className="card-subtitle">Need anything? We are here.</div>
      </div>
    </aside>
  )
}
