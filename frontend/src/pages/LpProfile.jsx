import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar.jsx'
import { mockLpProfile } from '../data/mock.js'
import { downloadSubmissionPdf, getSubmissions } from '../api/client.js'
import { devConfig } from '../data/devConfig.js'

export default function LpProfile() {
  const [forms, setForms] = useState(mockLpProfile.forms)
  const [statusLabel, setStatusLabel] = useState('Using mock data')
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const submissions = await getSubmissions({
          investorUserId: devConfig.investorId,
        })
        if (!isMounted) return
        const mapped = submissions.map((submission) => ({
          id: submission.id,
          title: `Submission ${submission.id}`,
          status: submission.status,
          updatedAt: new Date(submission.updated_at).toLocaleDateString(),
          pdfReady: Boolean(submission.locked_at),
        }))
        setForms(mapped.length ? mapped : mockLpProfile.forms)
        setStatusLabel('Live data')
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

  const handleDownload = async (submissionId) => {
    try {
      setDownloadingId(submissionId)
      const blob = await downloadSubmissionPdf(submissionId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `submission-${submissionId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div>
      <TopBar
        title="LP Profile"
        subtitle={`${mockLpProfile.name} · ${mockLpProfile.email}`}
      >
        <button className="btn secondary">Edit Profile</button>
        <button className="btn">Download Latest PDF</button>
      </TopBar>

      <div className="grid">
        {forms.map((form) => (
          <div className="card" key={form.id}>
            <h3 className="card-title">{form.title}</h3>
            <p className="card-subtitle">
              {form.status} · Updated {form.updatedAt}
            </p>
            <div className="action-row">
              <button className="btn secondary">Open Form</button>
              <button
                className="btn ghost"
                disabled={!form.pdfReady || downloadingId === form.id}
                onClick={() => handleDownload(form.id)}
              >
                {form.pdfReady
                  ? downloadingId === form.id
                    ? 'Downloading...'
                    : 'Export PDF'
                  : 'PDF Pending'}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-subtitle">{statusLabel}</div>
      </div>
    </div>
  )
}
