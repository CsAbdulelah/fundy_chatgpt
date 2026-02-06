import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar.jsx'
import LanguageToggle from '../components/LanguageToggle.jsx'
import SectionCard from '../components/SectionCard.jsx'
import { mockSubmission } from '../data/mock.js'
import {
  createSubmission,
  getDefaultSchema,
  getSubmissions,
  getTemplates,
  submitSubmission,
  updateSubmission,
} from '../api/client.js'
import { devConfig } from '../data/devConfig.js'

export default function LpForm() {
  const [language, setLanguage] = useState('ar')
  const [schema, setSchema] = useState({ sections: mockSubmission.sections })
  const [submission, setSubmission] = useState(null)
  const [statusLabel, setStatusLabel] = useState('Using mock data')
  const [formData, setFormData] = useState({})
  const [templateId, setTemplateId] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const templates = await getTemplates(devConfig.teamId)
        const defaultSchema = await getDefaultSchema()
        const chosenTemplate = templates[0]
        const submissions = await getSubmissions({
          investorUserId: devConfig.investorId,
        })
        if (!isMounted) return
        setSchema(defaultSchema)
        setTemplateId(chosenTemplate?.id ?? null)
        if (submissions.length > 0) {
          setSubmission(submissions[0])
          setFormData(submissions[0].data || {})
          setStatusLabel(submissions[0].status)
        } else {
          setStatusLabel('Draft not created')
        }
      } catch (error) {
        if (!isMounted) return
        setSchema({ sections: mockSubmission.sections })
        setStatusLabel('Using mock data')
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [])

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleCreateDraft = async () => {
    if (!templateId) return
    const draft = await createSubmission({
      template_id: templateId,
      investor_user_id: devConfig.investorId,
      data: formData,
    })
    setSubmission(draft)
    setStatusLabel(draft.status)
  }

  const handleSubmit = async () => {
    if (!submission) return
    await updateSubmission(submission.id, { data: formData })
    const updated = await submitSubmission(submission.id, {})
    setSubmission(updated)
    setStatusLabel(updated.status)
  }

  const sections = schema.sections || []

  return (
    <div>
      <TopBar
        title="LP KYC Submission"
        subtitle={`Investor: ${mockSubmission.investorName}`}
      >
        <span className="badge">{statusLabel}</span>
        <LanguageToggle language={language} onChange={setLanguage} />
        {submission ? (
          <button className="btn" onClick={handleSubmit}>
            Submit Updates
          </button>
        ) : (
          <button className="btn" onClick={handleCreateDraft}>
            Create Draft
          </button>
        )}
      </TopBar>

      <div className="grid">
        {sections.map((section) => (
          <SectionCard key={section.id ?? section.key} title={section.title?.[language] ?? section.title}>
            {(section.fields || []).map((field) => {
              const fieldKey = field.key ?? field.id
              return (
                <div key={fieldKey} className="field-row">
                  <div>
                    <div className={language === 'ar' ? 'arabic' : ''}>
                      {field.label?.[language] ?? field.label}
                    </div>
                    <div className="field-meta">
                      Current value: {formData[fieldKey] ?? '-'}
                    </div>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formData[fieldKey] ?? ''}
                      onChange={(event) => handleChange(fieldKey, event.target.value)}
                      placeholder={language === 'ar' ? 'أدخل التحديث' : 'Enter update'}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid #e2d6c6',
                      }}
                    />
                  </div>
                  <div>
                    <div className="field-meta">Awaiting GP review</div>
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
