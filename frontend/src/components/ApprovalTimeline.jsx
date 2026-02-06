export default function ApprovalTimeline({ chain }) {
  return (
    <div className="timeline">
      {chain.map((step) => (
        <div key={step.id} className="timeline-item">
          <div>
            <div>{step.name}</div>
            <div className="field-meta">{step.role}</div>
          </div>
          <div>
            <span className="tag">{step.status}</span>
            <div className="field-meta">{step.timestamp}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
