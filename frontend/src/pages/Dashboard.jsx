import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar.jsx'
import { getSubmissions, getTemplates } from '../api/client.js'
import { devConfig } from '../data/devConfig.js'

export default function Dashboard() {
  const [templateCount, setTemplateCount] = useState(0)
  const [submissionCount, setSubmissionCount] = useState(0)
  const [statusLabel, setStatusLabel] = useState('Live workspace')

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const templates = await getTemplates(devConfig.teamId)
        const count = templates.length
        let submissions = []
        if (templates[0]) {
          submissions = await getSubmissions({ templateId: templates[0].id })
        }
        if (!isMounted) return
        setTemplateCount(count)
        setSubmissionCount(submissions.length)
        setStatusLabel('Live workspace')
      } catch (error) {
        if (!isMounted) return
        setStatusLabel('Using mock data')
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div>
      <TopBar
        title="KYC Command Center"
        subtitle="Build Saudi-compliant onboarding flows with bilingual investor experiences."
      >
        <span className="badge">{statusLabel}</span>
        <button className="btn">Create New Template</button>
      </TopBar>

      <div className="grid grid-2">
        <div className="card">
          <h3 className="card-title">Active Templates</h3>
          <p className="card-subtitle">{templateCount} forms in circulation</p>
          <div className="action-row">
            <button className="btn secondary">View Builder</button>
            <button className="btn ghost">Duplicate</button>
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Submissions in Review</h3>
          <p className="card-subtitle">
            {submissionCount} LPs waiting for GP approval
          </p>
          <div className="action-row">
            <button className="btn secondary">Open Review Queue</button>
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Approval Chains</h3>
          <p className="card-subtitle">Ordered multi-approver workflows</p>
          <div className="action-row">
            <button className="btn secondary">Manage Approvers</button>
          </div>
        </div>
        <div className="card">
          <h3 className="card-title">Investor Accounts</h3>
          <p className="card-subtitle">Arabic + English investor profiles</p>
          <div className="action-row">
            <button className="btn secondary">Open LP Profiles</button>
          </div>
        </div>
      </div>
    </div>
  )
}
