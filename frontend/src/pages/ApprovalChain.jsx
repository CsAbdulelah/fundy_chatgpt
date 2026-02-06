import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar.jsx'
import ApprovalTimeline from '../components/ApprovalTimeline.jsx'
import { mockApprovalChain } from '../data/mock.js'
import { createApprovalChain, getTemplates } from '../api/client.js'
import { devConfig } from '../data/devConfig.js'

export default function ApprovalChain() {
  const [statusLabel, setStatusLabel] = useState('Using mock data')
  const [templateId, setTemplateId] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const templates = await getTemplates(devConfig.teamId)
        if (!isMounted) return
        setTemplateId(templates[0]?.id ?? null)
        setStatusLabel('Ready to save')
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

  const handleSave = async () => {
    if (!templateId) return
    try {
      await createApprovalChain({
        team_id: devConfig.teamId,
        template_id: templateId,
        name: 'Default Ordered Chain',
        steps: [
          { approver_user_id: devConfig.actorId },
        ],
      })
      setStatusLabel('Saved')
    } catch (error) {
      setStatusLabel('Save failed')
    }
  }

  return (
    <div>
      <TopBar
        title="Ordered Approvals"
        subtitle="Define the sequence of GP reviewers for each submission."
      >
        <button className="btn secondary">Add Approver</button>
        <button className="btn" onClick={handleSave}>
          Save Chain
        </button>
      </TopBar>

      <div className="card">
        <h3 className="card-title">Saudi KYC Master</h3>
        <p className="card-subtitle">{statusLabel}</p>
        <ApprovalTimeline chain={mockApprovalChain} />
      </div>
    </div>
  )
}
