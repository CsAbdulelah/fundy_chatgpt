import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar.jsx'
import LanguageToggle from '../components/LanguageToggle.jsx'
import SectionCard from '../components/SectionCard.jsx'
import {
  approveSubmission,
  downloadSubmissionPdfWithLanguage,
  getSubmissions,
  getTemplates,
  rejectSubmission,
} from '../api/client.js'
import { devConfig } from '../data/devConfig.js'

export default function GpReview() {
  const [language, setLanguage] = useState('en')
  const [templateType, setTemplateType] = useState('individual')
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [schema, setSchema] = useState({ sections: [] })
  const [submission, setSubmission] = useState(null)
  const [commentMap, setCommentMap] = useState({})
  const [statusLabel, setStatusLabel] = useState('Loading...')
  const [pdfLanguage, setPdfLanguage] = useState('en')
  const [isPreviewing, setIsPreviewing] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const loadedTemplates = await getTemplates(devConfig.teamId, {
          templateType,
        })
        if (!isMounted) return
        setTemplates(loadedTemplates)
        const chosenTemplate =
          loadedTemplates.find((item) => String(item.id) === selectedTemplateId) ??
          loadedTemplates[0]
        if (!chosenTemplate) {
          setSchema({ sections: [] })
          setSubmission(null)
          setSelectedTemplateId('')
          setStatusLabel(`No ${templateType} template yet`)
          return
        }
        setSelectedTemplateId(String(chosenTemplate.id))
        const submissions = await getSubmissions({
          templateId: chosenTemplate.id,
        })
        setSchema(chosenTemplate.schema ?? { sections: [] })
        if (submissions.length > 0) {
          setSubmission(submissions[0])
          setStatusLabel(submissions[0].status)
        } else {
          setStatusLabel('No submissions yet')
        }
      } catch (error) {
        if (!isMounted) return
        setTemplates([])
        setSelectedTemplateId('')
        setSchema({ sections: [] })
        setSubmission(null)
        setStatusLabel('Could not load submissions')
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [templateType, selectedTemplateId])

  const handleCommentChange = (key, value) => {
    setCommentMap((prev) => ({ ...prev, [key]: value }))
  }

  const handleReject = async () => {
    if (!submission) return
    const comments = Object.entries(commentMap)
      .filter(([, value]) => value && value.trim().length > 0)
      .map(([fieldKey, comment]) => ({
        field_key: fieldKey,
        comment,
      }))
    if (comments.length === 0) return
    const updated = await rejectSubmission(submission.id, {
      reviewer_user_id: devConfig.actorId,
      comments,
    })
    setSubmission(updated)
    setStatusLabel(updated.status)
  }

  const handleApprove = async () => {
    if (!submission) return
    const updated = await approveSubmission(submission.id)
    setSubmission(updated)
    setStatusLabel(updated.status)
  }

  const handlePreview = async () => {
    if (!submission) return
    setIsPreviewing(true)
    try {
      const blob = await downloadSubmissionPdfWithLanguage(
        submission.id,
        pdfLanguage,
      )
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } finally {
      setIsPreviewing(false)
    }
  }

  const sections = schema.sections || []
  const investorLabel =
    submission?.investor_name ??
    (submission?.investor_user_id
      ? `Investor ${submission.investor_user_id}`
      : 'No investor')

  return (
    <div>
      <TopBar
        title="GP Review"
        subtitle={`Submission ${submission?.id ?? '-'} · ${investorLabel}`}
      >
        <select
          value={templateType}
          onChange={(event) => setTemplateType(event.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '10px',
            border: '1px solid #e2d6c6',
          }}
        >
          <option value="individual">Individual</option>
          <option value="institutional">Institutional</option>
        </select>
        <select
          value={selectedTemplateId}
          onChange={(event) => setSelectedTemplateId(event.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '10px',
            border: '1px solid #e2d6c6',
          }}
          disabled={templates.length === 0}
        >
          {templates.length === 0 ? (
            <option value="">No templates</option>
          ) : (
            templates.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))
          )}
        </select>
        <LanguageToggle language={language} onChange={setLanguage} />
        <select
          value={pdfLanguage}
          onChange={(event) => setPdfLanguage(event.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '10px',
            border: '1px solid #e2d6c6',
          }}
        >
          <option value="en">PDF EN</option>
          <option value="ar">PDF AR</option>
        </select>
        <button className="btn secondary" onClick={handlePreview}>
          {isPreviewing ? 'Preparing PDF...' : 'Preview PDF'}
        </button>
        <button className="btn secondary" onClick={handleReject}>
          Reject with Comments
        </button>
        <button className="btn" onClick={handleApprove}>
          Approve & Send Forward
        </button>
      </TopBar>

      <div className="grid">
        {sections.length === 0 ? (
          <SectionCard title={language === 'ar' ? 'لا يوجد نموذج' : 'No form available'}>
            <div className="field-meta">
              {language === 'ar'
                ? 'بانتظار نموذج أو إرسال جديد للمراجعة.'
                : 'Waiting for a published template or submitted KYC to review.'}
            </div>
          </SectionCard>
        ) : null}
        {sections.map((section) => (
          <SectionCard key={section.id ?? section.key} title={section.title?.[language] ?? section.title}>
            {(section.fields || []).map((field) => {
              const fieldKey = field.key ?? field.id
              const value = submission?.data?.[fieldKey] ?? '-'
              return (
                <div key={fieldKey} className="field-row">
                  <div>
                    <div>{field.label?.[language] ?? field.label}</div>
                    <div className="field-meta">Submitted value: {value}</div>
                  </div>
                  <div>
                    <textarea
                      rows={2}
                      placeholder="Write review comment"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid #e2d6c6',
                      }}
                      value={commentMap[fieldKey] ?? ''}
                      onChange={(event) => handleCommentChange(fieldKey, event.target.value)}
                    />
                  </div>
                  <div>
                    <span className="tag">Field Review</span>
                  </div>
                </div>
              )
            })}
          </SectionCard>
        ))}
      </div>
    </div>
  )
}
