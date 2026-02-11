import { Fragment, useEffect, useMemo, useState } from 'react'
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

function getLocalized(value, language) {
  if (!value || typeof value !== 'object') return value
  return value[language] || value.en || value.ar || ''
}

function formatValue(value) {
  if (Array.isArray(value)) return value.join(', ')
  if (value && typeof value === 'object') return JSON.stringify(value)
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

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

function getFilePreviewType(mime = '', name = '') {
  const lowerName = String(name).toLowerCase()
  const lowerMime = String(mime).toLowerCase()
  if (lowerMime.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(lowerName)) {
    return 'image'
  }
  if (lowerMime.includes('pdf') || lowerName.endsWith('.pdf')) {
    return 'pdf'
  }
  return 'file'
}

export default function GpReview() {
  const [language, setLanguage] = useState('en')
  const [templates, setTemplates] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('')
  const [fieldCommentMap, setFieldCommentMap] = useState({})
  const [statusLabel, setStatusLabel] = useState('Loading...')
  const [pdfLanguage, setPdfLanguage] = useState('en')
  const [isPreviewing, setIsPreviewing] = useState(false)

  const selectedSubmission = submissions.find(
    (item) => String(item.id) === String(selectedSubmissionId),
  )
  const templateById = useMemo(
    () =>
      templates.reduce((acc, item) => {
        acc[String(item.id)] = item
        return acc
      }, {}),
    [templates],
  )
  const schema = templateById[String(selectedSubmission?.template_id)]?.schema ?? { sections: [] }

  useEffect(() => {
    let isMounted = true

    async function loadReviewQueue() {
      try {
        const loaded = await getTemplates(devConfig.teamId)
        if (!isMounted) return
        setTemplates(loaded)
        if (loaded.length === 0) {
          setSubmissions([])
          setSelectedSubmissionId('')
          setStatusLabel('No templates yet')
          return
        }

        const perTemplate = await Promise.all(
          loaded.map(async (template) => {
            const rows = await getSubmissions({ templateId: template.id })
            return rows
          }),
        )

        if (!isMounted) return
        const merged = perTemplate.flat().sort((a, b) => b.id - a.id)
        setSubmissions(merged)
        const nextSubmissionId =
          merged.find((item) => String(item.id) === selectedSubmissionId)?.id ??
          merged[0]?.id ??
          ''
        setSelectedSubmissionId(nextSubmissionId ? String(nextSubmissionId) : '')
        setStatusLabel(nextSubmissionId ? 'Review in progress' : 'No submissions yet')
      } catch (error) {
        if (!isMounted) return
        setTemplates([])
        setSubmissions([])
        setSelectedSubmissionId('')
        setStatusLabel('Could not load review queue')
      }
    }

    loadReviewQueue()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    setFieldCommentMap({})
  }, [selectedSubmissionId])

  const groupedComments = useMemo(() => {
    const comments = selectedSubmission?.comments ?? []
    const byField = {}

    comments.forEach((comment) => {
      if (comment.field_key) {
        byField[comment.field_key] = byField[comment.field_key] || []
        byField[comment.field_key].push(comment.comment)
      }
    })

    return { byField }
  }, [selectedSubmission])

  const handleReject = async () => {
    if (!selectedSubmission) return
    const comments = Object.entries(fieldCommentMap)
      .filter(([, value]) => value && value.trim())
      .map(([fieldKey, comment]) => ({
        field_key: fieldKey,
        comment,
      }))
    if (comments.length === 0) return

    const updated = await rejectSubmission(selectedSubmission.id, {
      reviewer_user_id: devConfig.actorId,
      comments,
    })
    setSubmissions((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    )
    setSelectedSubmissionId(String(updated.id))
    setStatusLabel('Changes requested sent to LP')
  }

  const handleApprove = async () => {
    if (!selectedSubmission) return
    const updated = await approveSubmission(selectedSubmission.id)
    setSubmissions((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    )
    setStatusLabel('Submission approved')
  }

  const handlePreview = async () => {
    if (!selectedSubmission) return
    setIsPreviewing(true)
    try {
      const blob = await downloadSubmissionPdfWithLanguage(
        selectedSubmission.id,
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

  return (
    <div>
      <TopBar
        title="GP Review"
        subtitle={
          selectedSubmission
            ? `${selectedSubmission.investor?.name || `LP ${selectedSubmission.investor_user_id}`} · ${templateById[String(selectedSubmission.template_id)]?.template_type || '-'}`
            : 'No submission selected'
        }
      >
        <LanguageToggle language={language} onChange={setLanguage} />
        <span className="badge">{statusLabel}</span>
        <select
          value={pdfLanguage}
          onChange={(event) => setPdfLanguage(event.target.value)}
          style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2d6c6' }}
        >
          <option value="en">PDF EN</option>
          <option value="ar">PDF AR</option>
        </select>
        <button className="btn secondary" onClick={handlePreview} disabled={!selectedSubmission}>
          {isPreviewing ? 'Preparing PDF...' : 'Preview PDF'}
        </button>
        <button className="btn secondary" onClick={handleReject} disabled={!selectedSubmission}>
          Reject & Request Changes
        </button>
        <button className="btn" onClick={handleApprove} disabled={!selectedSubmission}>
          Approve
        </button>
      </TopBar>

      <div className="builder-workspace">
        <aside className="builder-sidebar">
          <div className="field-meta" style={{ marginBottom: '8px' }}>
            Submissions ({submissions.length})
          </div>
          <div className="section-nav-list">
            {submissions.map((submission) => (
              <button
                key={submission.id}
                type="button"
                className={`section-nav-item ${
                  String(submission.id) === String(selectedSubmissionId) ? 'active' : ''
                }`}
                onClick={() => setSelectedSubmissionId(String(submission.id))}
              >
                <span className="section-nav-title">Submission #{submission.id}</span>
                <span className="section-nav-meta">
                  {(submission.investor?.name || `LP ${submission.investor_user_id}`)}
                  {' · '}
                  {(templateById[String(submission.template_id)]?.template_type || '-')}
                  {' · '}
                  {submission.status}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="builder-main">
          {!selectedSubmission ? (
            <SectionCard title="No Submission">
              <div className="field-meta">No submission selected for review.</div>
            </SectionCard>
          ) : (
            sections.map((section) => {
              return (
                <SectionCard key={section.id ?? section.key} title={getLocalized(section.title, language)}>
                  <div className="grid">
                    {(section.fields || []).map((field) => {
                      const fieldKey = getFieldDataKey(section, field)
                      const legacyFieldKey = field.key ?? field.id
                      const label = getLocalized(field.label, language)
                      const value =
                        selectedSubmission?.data?.[fieldKey] ??
                        selectedSubmission?.data?.[legacyFieldKey]
                      const matrixRows = buildMatrixRows(field.matrix?.rows, language)
                      const matrixColumns = Array.isArray(field.matrix?.columns)
                        ? field.matrix.columns
                        : []
                      const optionItems = buildLocalizedOptions(field.options, language)
                      const fieldComments = [
                        ...(groupedComments.byField[fieldKey] ?? []),
                        ...(groupedComments.byField[legacyFieldKey] ?? []),
                      ]
                      const submittedValueLabel =
                        field.type === 'select'
                          ? resolveOptionLabel(value, optionItems)
                          : field.type === 'checkbox'
                            ? (Array.isArray(value) ? value : [])
                                .map((item) => resolveOptionLabel(item, optionItems))
                                .join(', ') || '-'
                            : formatValue(value)

                      return (
                        <div key={fieldKey} className="field-row">
                          <div>
                            <div>{label}</div>
                            {field.type === 'matrix' ? (
                              <div
                                className="matrix-grid lp-matrix"
                                style={{
                                  marginTop: '8px',
                                  gridTemplateColumns: `140px repeat(${matrixColumns.length}, minmax(80px, 1fr))`,
                                }}
                              >
                                <div className="matrix-cell header" />
                                {matrixColumns.map((col, index) => (
                                  <div key={col.key ?? col.id ?? index} className="matrix-cell header">
                                    {getLocalized(col.label, language)}
                                  </div>
                                ))}
                                {matrixRows.map((row) => (
                                  <Fragment key={row.key}>
                                    <div className="matrix-cell header">{row.label}</div>
                                    {matrixColumns.map((col, colIndex) => {
                                      const rawCellValue = getMatrixCellValue(
                                        value,
                                        row.aliases,
                                        col.key,
                                      )
                                      const cellOptions = buildLocalizedOptions(col.options, language)
                                      const cellValue =
                                        col.type === 'select'
                                          ? resolveOptionLabel(rawCellValue, cellOptions)
                                          : formatValue(rawCellValue)
                                      return (
                                        <div key={`${row.key}-${col.key ?? colIndex}`} className="matrix-cell">
                                          {cellValue}
                                        </div>
                                      )
                                    })}
                                  </Fragment>
                                ))}
                              </div>
                            ) : field.type === 'file' ? (
                              <div className="field-meta" style={{ display: 'grid', gap: '8px' }}>
                                <div>
                                  Submitted file:{' '}
                                  {value?.name || (typeof value === 'string' ? value : '-')}
                                </div>
                                {value?.url ? (
                                  <a href={value.url} target="_blank" rel="noreferrer">
                                    Open file
                                  </a>
                                ) : null}
                                {value?.url && getFilePreviewType(value?.mime, value?.name) === 'image' ? (
                                  <img
                                    src={value.url}
                                    alt={value?.name || 'uploaded file'}
                                    style={{
                                      maxWidth: '360px',
                                      borderRadius: '10px',
                                      border: '1px solid #e2d6c6',
                                    }}
                                  />
                                ) : null}
                                {value?.url && getFilePreviewType(value?.mime, value?.name) === 'pdf' ? (
                                  <iframe
                                    src={value.url}
                                    title={value?.name || 'uploaded pdf'}
                                    style={{
                                      width: '100%',
                                      minHeight: '340px',
                                      border: '1px solid #e2d6c6',
                                      borderRadius: '10px',
                                      background: '#fff',
                                    }}
                                  />
                                ) : null}
                              </div>
                            ) : (
                              <div className="field-meta">Submitted value: {submittedValueLabel}</div>
                            )}
                            {fieldComments.length > 0 ? (
                              <div className="field-meta">Existing comments: {fieldComments.join(' | ')}</div>
                            ) : null}
                          </div>
                          <div>
                            <textarea
                              rows={2}
                              className="input"
                              placeholder="Field comment (optional)"
                              value={fieldCommentMap[fieldKey] ?? ''}
                              onChange={(event) =>
                                setFieldCommentMap((prev) => ({
                                  ...prev,
                                  [fieldKey]: event.target.value,
                                }))
                              }
                            />
                          </div>
                          <div>
                            <span className="tag">{selectedSubmission.status}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </SectionCard>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
