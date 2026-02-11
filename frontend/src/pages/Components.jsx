import { useState } from 'react'

export default function Components() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div>
      <div className="topbar">
        <div>
          <h1 className="page-title">Components</h1>
          <div className="card-subtitle">Reusable UI for this design system</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">Buttons</h3>
          <div className="action-row" style={{ marginTop: '12px' }}>
            <button className="btn">Primary</button>
            <button className="btn secondary">Secondary</button>
            <button className="btn ghost">Ghost</button>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Tags</h3>
          <div className="action-row" style={{ marginTop: '12px' }}>
            <span className="tag">In Review</span>
            <span className="tag">Draft</span>
            <span className="tag">Approved</span>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Input</h3>
          <input className="input" type="text" placeholder="Type here" />
        </div>

        <div className="card">
          <h3 className="card-title">Kanban</h3>
          <div className="kanban">
            {['To-do', 'In Progress', 'In Review'].map((title) => (
              <div key={title} className="kanban-column">
                <div className="kanban-header">
                  <span>{title}</span>
                  <span className="tag">2</span>
                </div>
                <div className="kanban-card">
                  <div className="kanban-title">LP Onboarding</div>
                  <div className="kanban-meta">Update documents</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Modal</h3>
          <div className="action-row" style={{ marginTop: '12px' }}>
            <button className="btn" onClick={() => setIsModalOpen(true)}>
              Open Modal
            </button>
          </div>
        </div>
      </div>

      {isModalOpen ? (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Item</h3>
              <button className="btn ghost" onClick={() => setIsModalOpen(false)}>
                X
              </button>
            </div>
            <div className="modal-body">
              <div className="field-meta">Title</div>
              <input className="input" type="text" placeholder="Add title" />
            </div>
            <div className="modal-footer">
              <button className="btn secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button className="btn">Create</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
