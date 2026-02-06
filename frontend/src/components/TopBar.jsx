export default function TopBar({ title, subtitle, children }) {
  return (
    <div className="topbar">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle ? <div className="card-subtitle">{subtitle}</div> : null}
      </div>
      <div className="action-row">{children}</div>
    </div>
  )
}
