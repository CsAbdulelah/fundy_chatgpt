import { Fragment, useEffect, useState } from 'react'
import TopBar from '../components/TopBar.jsx'
import LanguageToggle from '../components/LanguageToggle.jsx'
import SectionCard from '../components/SectionCard.jsx'
import {
  createSubmission,
  getSubmissions,
  getTemplates,
  submitSubmission,
  updateSubmission,
} from '../api/client.js'
import { devConfig } from '../data/devConfig.js'

export default function LpForm() {
  const [language, setLanguage] = useState('ar')
  const [investorType, setInvestorType] = useState('individual')
  const [schema, setSchema] = useState({ sections: [] })
  const [submission, setSubmission] = useState(null)
  const [statusLabel, setStatusLabel] = useState('Loading...')
  const [formData, setFormData] = useState({})
  const [templateId, setTemplateId] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const templates = await getTemplates(devConfig.teamId, {
          templateType: investorType,
        })
        const chosenTemplate = templates[0]
        if (!chosenTemplate) {
          if (!isMounted) return
          setSchema({ sections: [] })
          setTemplateId(null)
          setSubmission(null)
          setFormData({})
          setStatusLabel(`No ${investorType} template yet.`)
          return
        }
        const submissions = await getSubmissions({
          templateId: chosenTemplate.id,
          investorUserId: devConfig.investorId,
        })
        if (!isMounted) return
        setSchema(chosenTemplate.schema ?? { sections: [] })
        setTemplateId(chosenTemplate.id ?? null)
        if (submissions.length > 0) {
          setSubmission(submissions[0])
          setFormData(submissions[0].data || {})
          setStatusLabel(submissions[0].status)
        } else {
          setStatusLabel('Draft not created')
        }
      } catch (error) {
        if (!isMounted) return
        setSchema({ sections: [] })
        setTemplateId(null)
        setSubmission(null)
        setFormData({})
        setStatusLabel('Could not load template/submission.')
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [investorType])

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const getLocalized = (value) => {
    if (!value || typeof value !== 'object') return value
    if (value[language] && value[language].length) return value[language]
    const fallback = language === 'ar' ? value.en : value.ar
    return fallback && fallback.length ? fallback : value[language] ?? value.en ?? value.ar
  }

  const formatValue = (value) => {
    if (Array.isArray(value)) return value.join(', ')
    if (value && typeof value === 'object') return '✓'
    if (value === null || value === undefined || value === '') return '-'
    return String(value)
  }

  const toggleMulti = (key, option) => {
    setFormData((prev) => {
      const current = Array.isArray(prev[key]) ? prev[key] : []
      const next = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option]
      return { ...prev, [key]: next }
    })
  }

  const toggleMatrix = (key, row, col, value) => {
    setFormData((prev) => {
      const current = prev[key] && typeof prev[key] === 'object' ? prev[key] : {}
      const rowData = current[row] || {}
      const nextRow = { ...rowData, [col]: value }
      return { ...prev, [key]: { ...current, [row]: nextRow } }
    })
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
        subtitle={`Investor ID: ${devConfig.investorId}`}
      >
        <span className="badge">{statusLabel}</span>
        <select
          value={investorType}
          onChange={(event) => setInvestorType(event.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '10px',
            border: '1px solid #e2d6c6',
          }}
        >
          <option value="individual">Individual</option>
          <option value="institutional">Institutional</option>
        </select>
        <LanguageToggle language={language} onChange={setLanguage} />
        {submission ? (
          <button className="btn" onClick={handleSubmit}>
            Submit Updates
          </button>
        ) : (
          <button className="btn" onClick={handleCreateDraft} disabled={!templateId}>
            Create Draft
          </button>
        )}
      </TopBar>

      <div className="grid">
        {sections.length === 0 ? (
          <SectionCard title={language === 'ar' ? 'لا يوجد نموذج' : 'No form available'}>
            <div className="field-meta">
              {language === 'ar'
                ? 'بانتظار قيام GP بنشر نموذج KYC.'
                : 'Waiting for GP to publish a KYC form template.'}
            </div>
          </SectionCard>
        ) : null}
        {sections.map((section) => (
          <SectionCard
            key={section.id ?? section.key}
            title={getLocalized(section.title) ?? section.title}
          >
            {(section.fields || []).map((field) => {
              const fieldKey = field.key ?? field.id
              const label = getLocalized(field.label) ?? field.label
              const options = getLocalized(field.options) ?? []
              const matrixRows = getLocalized(field.matrix?.rows) ?? []
              const rawColumns =
                Array.isArray(field.matrix?.columns)
                  ? field.matrix?.columns ?? []
                  : getLocalized(field.matrix?.columns) ?? []
              const matrixColumns = rawColumns.map((col, index) => {
                if (typeof col === 'string') {
                  return {
                    key: `${index}-${col}`,
                    label: { en: col, ar: col },
                    type: 'text',
                    options: { en: [], ar: [] },
                  }
                }
                const label = col.label ?? {}
                return {
                  key: col.key ?? col.id ?? label.en ?? label.ar ?? `col-${index}`,
                  label,
                  type: col.type ?? 'text',
                  options: col.options ?? { en: [], ar: [] },
                }
              })
              const fieldType =
                field.type ||
                (matrixRows.length || matrixColumns.length ? 'matrix' : '') ||
                (Array.isArray(options) && options.length ? 'select' : 'text')
              const isMatrix = fieldType === 'matrix'
              return (
                <div
                  key={fieldKey}
                  className={`field-row ${isMatrix ? 'matrix-row' : ''}`}
                >
                  <div>
                    <div className={language === 'ar' ? 'arabic' : ''}>
                      {label}
                    </div>
                    <div className="field-meta">
                      Current value: {formatValue(formData[fieldKey])}
                    </div>
                  </div>
                  <div className={isMatrix ? 'matrix-wrapper' : ''}>
                    {fieldType === 'textarea' ? (
                      <textarea
                        rows={3}
                        value={formData[fieldKey] ?? ''}
                        onChange={(event) =>
                          handleChange(fieldKey, event.target.value)
                        }
                        placeholder={language === 'ar' ? 'أدخل التحديث' : 'Enter update'}
                        className="input"
                      />
                    ) : fieldType === 'select' ? (
                      <select
                        className="input"
                        value={formData[fieldKey] ?? ''}
                        onChange={(event) =>
                          handleChange(fieldKey, event.target.value)
                        }
                      >
                        <option value="">
                          {language === 'ar' ? 'اختر' : 'Select'}
                        </option>
                        {options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : fieldType === 'checkbox' ? (
                      <div className="choice-row">
                        {options.map((option) => (
                          <label key={option} className="choice">
                            <input
                              type="checkbox"
                              checked={
                                Array.isArray(formData[fieldKey]) &&
                                formData[fieldKey].includes(option)
                              }
                              onChange={() => toggleMulti(fieldKey, option)}
                            />
                            {option}
                          </label>
                        ))}
                      </div>
                    ) : fieldType === 'matrix' ? (
                      <div
                        className="matrix-grid lp-matrix"
                        style={{
                          gridTemplateColumns: `140px repeat(${
                            matrixColumns.length
                          }, minmax(80px, 1fr))`,
                        }}
                      >
                        <div className="matrix-cell header" />
                        {matrixColumns.map((col) => (
                          <div key={col.key} className="matrix-cell header">
                            {getLocalized(col.label) ?? col.label?.en ?? col.label?.ar}
                          </div>
                        ))}
                        {matrixRows.map((row) => (
                          <Fragment key={row}>
                            <div className="matrix-cell header">{row}</div>
                            {matrixColumns.map((col) => {
                              const cellValue = formData[fieldKey]?.[row]?.[col.key]
                              return (
                                <label key={`${row}-${col.key}`} className="matrix-cell">
                                  {col.type === 'select' ? (
                                    <select
                                      className="input"
                                      value={cellValue ?? ''}
                                      onChange={(event) =>
                                        toggleMatrix(fieldKey, row, col.key, event.target.value)
                                      }
                                    >
                                      <option value="">
                                        {language === 'ar' ? 'اختر' : 'Select'}
                                      </option>
                                      {(getLocalized(col.options) ?? []).map((opt) => (
                                        <option key={opt} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      className="input"
                                      value={cellValue ?? ''}
                                      onChange={(event) =>
                                        toggleMatrix(fieldKey, row, col.key, event.target.value)
                                      }
                                    />
                                  )}
                                </label>
                              )
                            })}
                          </Fragment>
                        ))}
                      </div>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : field.type === 'file' ? 'file' : 'text'}
                        value={field.type === 'file' ? undefined : formData[fieldKey] ?? ''}
                        onChange={(event) =>
                          handleChange(
                            fieldKey,
                            field.type === 'file'
                              ? event.target.files?.[0]?.name ?? ''
                              : event.target.value,
                          )
                        }
                        placeholder={language === 'ar' ? 'أدخل التحديث' : 'Enter update'}
                        className="input"
                      />
                    )}
                  </div>
                  {!isMatrix ? (
                    <div>
                      <div className="field-meta">Awaiting GP review</div>
                    </div>
                  ) : (
                    <div className="field-meta matrix-note">Awaiting GP review</div>
                  )}
                </div>
              )
            })}
          </SectionCard>
        ))}
      </div>
    </div>
  )
}
