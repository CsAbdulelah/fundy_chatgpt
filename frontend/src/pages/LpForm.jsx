import { Fragment, useEffect, useState } from 'react'
import TopBar from '../components/TopBar.jsx'
import LanguageToggle from '../components/LanguageToggle.jsx'
import SectionCard from '../components/SectionCard.jsx'
import {
  createSubmission,
  getSubmissions,
  getTemplates,
  submitSubmission,
  uploadSubmissionFile,
  updateSubmission,
} from '../api/client.js'
import { devConfig } from '../data/devConfig.js'

function getFieldDataKey(section, field) {
  const sectionKey = section?.key ?? section?.id ?? 'section'
  const fieldKey = field?.key ?? field?.id ?? 'field'
  return `${sectionKey}::${fieldKey}`
}

function buildLocalizedOptions(options, language) {
  if (Array.isArray(options)) {
    return options.map((label, index) => ({
      key: `opt_${index + 1}`,
      label,
      aliases: [label, `opt_${index + 1}`],
    }))
  }

  const en = Array.isArray(options?.en) ? options.en : []
  const ar = Array.isArray(options?.ar) ? options.ar : []
  const size = Math.max(en.length, ar.length)
  return Array.from({ length: size }, (_, index) => {
    const key = `opt_${index + 1}`
    const enLabel = en[index] ?? ''
    const arLabel = ar[index] ?? ''
    return {
      key,
      label: language === 'ar' ? arLabel || enLabel : enLabel || arLabel,
      aliases: [key, enLabel, arLabel].filter(Boolean),
    }
  })
}

function resolveOptionKey(value, optionItems) {
  if (value === null || value === undefined || value === '') return ''
  const textValue = String(value)
  const found = optionItems.find((item) => item.aliases.includes(textValue))
  return found?.key ?? textValue
}

function resolveOptionLabel(value, optionItems) {
  if (value === null || value === undefined || value === '') return '-'
  const key = resolveOptionKey(value, optionItems)
  const found = optionItems.find((item) => item.key === key)
  return found?.label ?? String(value)
}

function buildMatrixRows(matrixRows, language) {
  const en = Array.isArray(matrixRows?.en) ? matrixRows.en : []
  const ar = Array.isArray(matrixRows?.ar) ? matrixRows.ar : []
  const size = Math.max(en.length, ar.length)
  return Array.from({ length: size }, (_, index) => {
    const key = `row_${index + 1}`
    const enLabel = en[index] ?? ''
    const arLabel = ar[index] ?? ''
    return {
      key,
      label: language === 'ar' ? arLabel || enLabel : enLabel || arLabel,
      aliases: [key, enLabel, arLabel].filter(Boolean),
    }
  })
}

function getMatrixCellValue(matrixValue, rowAliases, columnKey) {
  for (const rowKey of rowAliases) {
    const rowData = matrixValue?.[rowKey]
    if (rowData && Object.prototype.hasOwnProperty.call(rowData, columnKey)) {
      return rowData[columnKey]
    }
  }
  return ''
}

export default function LpForm() {
  const [language, setLanguage] = useState('ar')
  const [investorType, setInvestorType] = useState('individual')
  const [schema, setSchema] = useState({ sections: [] })
  const [submission, setSubmission] = useState(null)
  const [statusLabel, setStatusLabel] = useState('Loading...')
  const [formData, setFormData] = useState({})
  const [templateId, setTemplateId] = useState(null)
  const [activeSectionId, setActiveSectionId] = useState(null)
  const lockedStatuses = new Set(['submitted', 'approved', 'in_approval_chain', 'final_approved'])
  const terminalStatuses = new Set(['approved', 'final_approved'])
  const submissionStatus = submission?.status ?? statusLabel
  const isReadOnly = submission ? lockedStatuses.has(submissionStatus) : false
  const canStartNewSubmission = Boolean(templateId) && terminalStatuses.has(submission?.status)

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
          const ordered = [...submissions].sort((a, b) => b.id - a.id)
          const editable =
            ordered.find((item) => item.status === 'draft' || item.status === 'changes_requested') ??
            ordered[0]
          setSubmission(editable)
          setFormData(editable.data || {})
          setStatusLabel(editable.status)
        } else {
          setSubmission(null)
          setFormData({})
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
    if (isReadOnly) return
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
    if (value && typeof value === 'object') return value.name ?? '✓'
    if (value === null || value === undefined || value === '') return '-'
    return String(value)
  }

  const toggleMulti = (key, option) => {
    if (isReadOnly) return
    setFormData((prev) => {
      const current = Array.isArray(prev[key]) ? prev[key] : []
      const next = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option]
      return { ...prev, [key]: next }
    })
  }

  const toggleMatrix = (key, row, col, value) => {
    if (isReadOnly) return
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
      data: {},
    })
    setSubmission(draft)
    setFormData(draft.data || {})
    setStatusLabel(draft.status)
  }

  const ensureDraftSubmission = async () => {
    if (submission) return submission
    if (!templateId) return null
    const draft = await createSubmission({
      template_id: templateId,
      investor_user_id: devConfig.investorId,
      data: {},
    })
    setSubmission(draft)
    setFormData(draft.data || {})
    setStatusLabel(draft.status)
    return draft
  }

  const handleFileChange = async (fieldKey, file) => {
    if (!file || isReadOnly) return
    try {
      const current = await ensureDraftSubmission()
      if (!current) return
      setStatusLabel('Uploading file...')
      const uploaded = await uploadSubmissionFile(current.id, file)
      handleChange(fieldKey, uploaded)
      setStatusLabel(current.status ?? 'draft')
    } catch (error) {
      setStatusLabel(`Upload failed: ${error.message}`)
    }
  }

  const handleSubmit = async () => {
    if (!submission) return
    await updateSubmission(submission.id, { data: formData })
    const updated = await submitSubmission(submission.id, {})
    setSubmission(updated)
    setStatusLabel(updated.status)
  }

  const sections = schema.sections || []
  const activeSectionIndex = sections.findIndex(
    (section) => (section.id ?? section.key) === activeSectionId,
  )
  const resolvedActiveSectionIndex =
    activeSectionIndex >= 0 ? activeSectionIndex : sections.length > 0 ? 0 : -1
  const activeSection =
    resolvedActiveSectionIndex >= 0 ? sections[resolvedActiveSectionIndex] : null

  useEffect(() => {
    if (sections.length === 0) {
      setActiveSectionId(null)
      return
    }
    const exists = sections.some((section) => (section.id ?? section.key) === activeSectionId)
    if (!exists) {
      setActiveSectionId(sections[0].id ?? sections[0].key)
    }
  }, [activeSectionId, sections])

  const isFilledValue = (value) => {
    if (Array.isArray(value)) return value.length > 0
    if (value && typeof value === 'object') return Object.keys(value).length > 0
    return !(value === null || value === undefined || value === '')
  }

  const getSectionProgress = (section) => {
    const fields = section.fields || []
    if (fields.length === 0) return { done: 0, total: 0 }
    const done = fields.filter((field) => {
      const scopedKey = getFieldDataKey(section, field)
      const legacyKey = field.key ?? field.id
      return isFilledValue(formData[scopedKey] ?? formData[legacyKey])
    }).length
    return { done, total: fields.length }
  }

  const getCommentsForField = (fieldKey, legacyKey) =>
    (submission?.comments ?? []).filter(
      (comment) => comment.field_key === fieldKey || comment.field_key === legacyKey,
    )

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
          canStartNewSubmission ? (
            <button className="btn" onClick={handleCreateDraft}>
              Start New Submission
            </button>
          ) : isReadOnly ? (
            <button className="btn" disabled>
              Under Review
            </button>
          ) : (
          <button className="btn" onClick={handleSubmit}>
            Submit Updates
          </button>
          )
        ) : (
          <button className="btn" onClick={handleCreateDraft} disabled={!templateId}>
            Create Draft
          </button>
        )}
      </TopBar>

      <div className="builder-workspace">
        <aside className="builder-sidebar">
          <div className="field-meta" style={{ marginBottom: '8px' }}>
            {language === 'ar' ? 'الأقسام' : 'Sections'} ({sections.length})
          </div>
          <div className="section-nav-list">
            {sections.map((section) => {
              const token = section.id ?? section.key
              const isActive = token === (activeSection?.id ?? activeSection?.key)
              const progress = getSectionProgress(section)
              return (
                <button
                  type="button"
                  key={token}
                  className={`section-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveSectionId(token)}
                >
                  <span className="section-nav-title">
                    {getLocalized(section.title) ?? section.title}
                  </span>
                  <span className="section-nav-meta">
                    {progress.done}/{progress.total} {language === 'ar' ? 'مكتمل' : 'filled'}
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        <div className="builder-main">
          {isReadOnly ? (
            <SectionCard title={language === 'ar' ? 'قيد المراجعة' : 'Under Review'}>
              <div className="field-meta">
                {language === 'ar'
                  ? 'تم إرسال النموذج وهو الآن قيد مراجعة GP. لا يمكنك تعديل البيانات حتى يتم طلب تعديلات.'
                  : 'Your submission is under GP review. Editing is locked until changes are requested.'}
              </div>
            </SectionCard>
          ) : null}
          {sections.length === 0 ? (
            <SectionCard title={language === 'ar' ? 'لا يوجد نموذج' : 'No form available'}>
              <div className="field-meta">
                {language === 'ar'
                  ? 'بانتظار قيام GP بنشر نموذج KYC.'
                  : 'Waiting for GP to publish a KYC form template.'}
              </div>
            </SectionCard>
          ) : null}
          {activeSection ? (
            <SectionCard title={getLocalized(activeSection.title) ?? activeSection.title}>
              {(activeSection.fields || []).map((field) => {
              const fieldKey = getFieldDataKey(activeSection, field)
              const legacyFieldKey = field.key ?? field.id
              const label = getLocalized(field.label) ?? field.label
              const optionItems = buildLocalizedOptions(field.options, language)
              const matrixRows = buildMatrixRows(field.matrix?.rows, language)
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
                (optionItems.length ? 'select' : 'text')
              const isMatrix = fieldType === 'matrix'
              const fieldComments = getCommentsForField(fieldKey, legacyFieldKey)
              const fieldValue = formData[fieldKey] ?? formData[legacyFieldKey]
              const normalizedSelectValue =
                fieldType === 'select'
                  ? resolveOptionKey(fieldValue, optionItems)
                  : fieldValue
              const normalizedMultiValue =
                fieldType === 'checkbox'
                  ? (Array.isArray(fieldValue) ? fieldValue : []).map((value) =>
                      resolveOptionKey(value, optionItems),
                    )
                  : []
              const currentValueLabel =
                fieldType === 'select'
                  ? resolveOptionLabel(fieldValue, optionItems)
                  : fieldType === 'checkbox'
                    ? normalizedMultiValue
                        .map((value) => resolveOptionLabel(value, optionItems))
                        .join(', ') || '-'
                    : formatValue(fieldValue)
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
                      Current value: {currentValueLabel}
                    </div>
                    {fieldComments.length > 0 ? (
                      <div className="field-meta">
                        GP comment: {fieldComments.map((item) => item.comment).join(' | ')}
                      </div>
                    ) : null}
                  </div>
                  <div className={isMatrix ? 'matrix-wrapper' : ''}>
                    {fieldType === 'textarea' ? (
                      <textarea
                        rows={3}
                        value={fieldValue ?? ''}
                        onChange={(event) =>
                          handleChange(fieldKey, event.target.value)
                        }
                        disabled={isReadOnly}
                        placeholder={language === 'ar' ? 'أدخل التحديث' : 'Enter update'}
                        className="input"
                      />
                    ) : fieldType === 'select' ? (
                      <select
                        className="input"
                        value={normalizedSelectValue ?? ''}
                        onChange={(event) =>
                          handleChange(fieldKey, event.target.value)
                        }
                        disabled={isReadOnly}
                      >
                        <option value="">
                          {language === 'ar' ? 'اختر' : 'Select'}
                        </option>
                        {optionItems.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : fieldType === 'checkbox' ? (
                      <div className="choice-row">
                        {optionItems.map((option) => (
                          <label key={option.key} className="choice">
                            <input
                              type="checkbox"
                              disabled={isReadOnly}
                              checked={
                                Array.isArray(normalizedMultiValue) &&
                                normalizedMultiValue.includes(option.key)
                              }
                              onChange={() => toggleMulti(fieldKey, option.key)}
                            />
                            {option.label}
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
                          <Fragment key={row.key}>
                            <div className="matrix-cell header">{row.label}</div>
                            {matrixColumns.map((col) => {
                              const columnOptions = buildLocalizedOptions(col.options, language)
                              const rawCellValue = getMatrixCellValue(
                                fieldValue,
                                row.aliases,
                                col.key,
                              )
                              const cellValue =
                                col.type === 'select'
                                  ? resolveOptionKey(rawCellValue, columnOptions)
                                  : rawCellValue
                              return (
                                <label key={`${row.key}-${col.key}`} className="matrix-cell">
                                  {col.type === 'select' ? (
                                    <select
                                      className="input"
                                      value={cellValue ?? ''}
                                      disabled={isReadOnly}
                                      onChange={(event) =>
                                        toggleMatrix(fieldKey, row.key, col.key, event.target.value)
                                      }
                                    >
                                      <option value="">
                                        {language === 'ar' ? 'اختر' : 'Select'}
                                      </option>
                                      {columnOptions.map((opt) => (
                                        <option key={opt.key} value={opt.key}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      className="input"
                                      value={cellValue ?? ''}
                                      disabled={isReadOnly}
                                      onChange={(event) =>
                                        toggleMatrix(fieldKey, row.key, col.key, event.target.value)
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
                        value={field.type === 'file' ? undefined : fieldValue ?? ''}
                        onChange={(event) =>
                          field.type === 'file'
                            ? handleFileChange(fieldKey, event.target.files?.[0])
                            : handleChange(fieldKey, event.target.value)
                        }
                        disabled={isReadOnly}
                        placeholder={language === 'ar' ? 'أدخل التحديث' : 'Enter update'}
                        className="input"
                      />
                    )}
                    {field.type === 'file' && fieldValue?.url ? (
                      <div className="field-meta" style={{ marginTop: '6px' }}>
                        <a href={fieldValue.url} target="_blank" rel="noreferrer">
                          {language === 'ar' ? 'معاينة الملف' : 'Preview file'}
                        </a>
                      </div>
                    ) : null}
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
          ) : null}
        </div>
      </div>
    </div>
  )
}
