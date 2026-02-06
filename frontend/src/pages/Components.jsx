import { useState } from 'react'

export default function Components() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)

  return (
    <div>
      <div className="topbar">
        <div>
          <h1 className="page-title">Components</h1>
          <div className="card-subtitle">Reusable UI building blocks</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">Buttons</h3>
          <div className="action-row" style={{ marginTop: '12px' }}>
            <button className="btn primary">Primary</button>
            <button className="btn secondary">Secondary</button>
            <button className="btn ghost">Ghost</button>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Badges / Status</h3>
          <div className="action-row" style={{ marginTop: '12px' }}>
            <span className="tag">In Review</span>
            <span className="tag tag-muted">Draft</span>
            <span className="tag tag-success">Approved</span>
            <span className="tag tag-warning">Needs Changes</span>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Search Bar</h3>
          <div className="search-bar" style={{ marginTop: '12px' }}>
            <span className="search-icon">⌕</span>
            <input type="text" placeholder="Search…" className="input" />
            <button className="btn ghost">Filters</button>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Tabs / Segmented</h3>
          <div className="segmented">
            <button className="active">Overview</button>
            <button>Timeline</button>
            <button>Documents</button>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Inputs</h3>
          <div className="form-grid">
            <label>
              <span className="field-meta">Text</span>
              <input type="text" placeholder="Enter text" className="input" />
            </label>
            <label>
              <span className="field-meta">Textarea</span>
              <textarea rows={3} placeholder="Enter notes" className="input" />
            </label>
            <label>
              <span className="field-meta">Select</span>
              <select className="input">
                <option>Choose option</option>
                <option>Option A</option>
                <option>Option B</option>
              </select>
            </label>
            <label>
              <span className="field-meta">Date</span>
              <input type="date" className="input" />
            </label>
            <label>
              <span className="field-meta">File upload</span>
              <div className="upload-box">Drop files or browse</div>
            </label>
            <label>
              <span className="field-meta">Checkbox / Radio</span>
              <div className="choice-row">
                <label className="choice"><input type="checkbox" /> Accept terms</label>
                <label className="choice"><input type="radio" name="r" /> Option A</label>
                <label className="choice"><input type="radio" name="r" /> Option B</label>
              </div>
            </label>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Tables</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Investor</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Noura Al Harbi</td>
                <td><span className="tag tag-warning">In Review</span></td>
                <td>Feb 6</td>
              </tr>
              <tr>
                <td>Ahmed Al Qassim</td>
                <td><span className="tag tag-success">Approved</span></td>
                <td>Feb 5</td>
              </tr>
              <tr>
                <td>Huda Al Rashid</td>
                <td><span className="tag tag-muted">Draft</span></td>
                <td>Feb 4</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 className="card-title">Timeline</h3>
          <div className="timeline-list">
            <div className="timeline-item-row">
              <div className="dot" />
              <div>
                <div className="timeline-title">Submission created</div>
                <div className="field-meta">Today · 10:15</div>
              </div>
            </div>
            <div className="timeline-item-row">
              <div className="dot" />
              <div>
                <div className="timeline-title">GP requested changes</div>
                <div className="field-meta">Today · 11:40</div>
              </div>
            </div>
            <div className="timeline-item-row">
              <div className="dot" />
              <div>
                <div className="timeline-title">LP resubmitted</div>
                <div className="field-meta">Today · 12:05</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Cards</h3>
          <div className="grid grid-2">
            <div className="stat-card">
              <div className="stat-label">Active LPs</div>
              <div className="stat-value">28</div>
              <div className="stat-meta">+4 this week</div>
            </div>
            <div className="profile-mini">
              <div className="avatar">KP</div>
              <div>
                <div className="profile-name">Khalid P.</div>
                <div className="field-meta">Compliance Lead</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Stepper / Progress</h3>
          <div className="stepper">
            {['Draft', 'Review', 'Approval', 'Complete'].map((step, index) => (
              <div key={step} className={`step ${index < 2 ? 'done' : ''}`}>
                <span>{index + 1}</span>
                <div>{step}</div>
              </div>
            ))}
          </div>
          <div className="progress">
            <div className="progress-bar" style={{ width: '55%' }} />
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Pagination</h3>
          <div className="pagination">
            <button className="btn ghost">Prev</button>
            <span className="page">1</span>
            <span className="page active">2</span>
            <span className="page">3</span>
            <button className="btn ghost">Next</button>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Dropdown / Menu</h3>
          <div className="dropdown">
            <button className="btn secondary">Actions ▾</button>
            <div className="dropdown-menu">
              <button>Duplicate</button>
              <button>Archive</button>
              <button className="danger">Delete</button>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Avatar Group</h3>
          <div className="avatar-group">
            {['AA', 'NS', 'OM', 'HR'].map((label) => (
              <div key={label} className="avatar small">
                {label}
              </div>
            ))}
            <div className="avatar small muted">+2</div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Empty State</h3>
          <div className="empty-state">
            <div className="empty-icon">◎</div>
            <div className="empty-title">No submissions yet</div>
            <div className="field-meta">Invite LPs to start onboarding.</div>
            <button className="btn primary">Invite LP</button>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Toast / Notification</h3>
          <div className="action-row">
            <button
              className="btn"
              onClick={() => {
                setToastVisible(true)
                setTimeout(() => setToastVisible(false), 2000)
              }}
            >
              Show Toast
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Modal</h3>
          <p className="card-subtitle">Example modal with blurred backdrop.</p>
          <div className="action-row" style={{ marginTop: '12px' }}>
            <button className="btn" onClick={() => setIsModalOpen(true)}>
              Open Modal
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Kanban</h3>
          <div className="kanban">
            {['To-do', 'In Progress', 'In Review', 'Completed'].map((title) => (
              <div key={title} className="kanban-column">
                <div className="kanban-header">
                  <span>{title}</span>
                  <span className="tag">4</span>
                </div>
                <div className="kanban-card">
                  <div className="kanban-title">LP Onboarding</div>
                  <div className="kanban-meta">Update documents</div>
                </div>
                <div className="kanban-card">
                  <div className="kanban-title">KYC Review</div>
                  <div className="kanban-meta">Await approval</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {toastVisible ? (
        <div className="toast">Template saved successfully.</div>
      ) : null}

      {isModalOpen ? (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>New Task</h3>
              <button className="btn ghost" onClick={() => setIsModalOpen(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
            <div className="field-meta">Title</div>
            <input type="text" placeholder="Add title" className="input" />
          </div>
            <div className="modal-footer">
              <button className="btn secondary">Cancel</button>
              <button className="btn primary">Create</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
