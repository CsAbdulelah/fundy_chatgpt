export default function FieldRow({ label, type, required, note }) {
  return (
    <div className="field-row">
      <div>
        <div>{label}</div>
        <div className="field-meta">{type}</div>
      </div>
      <div className="field-meta">{required ? 'Required' : 'Optional'}</div>
      <div className="field-meta">{note}</div>
    </div>
  )
}
