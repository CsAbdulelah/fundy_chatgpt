export default function SectionCard({ title, children, action }) {
  return (
    <div className="section-card">
      <div className="section-header">
        <h3 className="section-title">{title}</h3>
        {action}
      </div>
      <div>{children}</div>
    </div>
  )
}
