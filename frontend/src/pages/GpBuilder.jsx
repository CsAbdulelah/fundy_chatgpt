import { Fragment, useEffect, useState } from 'react'
import TopBar from '../components/TopBar.jsx'
import LanguageToggle from '../components/LanguageToggle.jsx'
import {
  createTemplate,
  getTeams,
  getTemplates,
  updateTemplate,
} from '../api/client.js'
import { devConfig } from '../data/devConfig.js'

const FIELD_TYPES = [
  'text',
  'textarea',
  'number',
  'date',
  'select',
  'checkbox',
  'matrix',
  'email',
  'file',
]

const emptySection = (key) => ({
  id: crypto.randomUUID(),
  key,
  title: { en: 'New Section', ar: 'قسم جديد' },
  fields: [],
})

const emptyField = (key) => ({
  id: crypto.randomUUID(),
  key,
  type: 'text',
  required: false,
  label: { en: 'New Field', ar: 'حقل جديد' },
  options: { en: [], ar: [] },
  matrix: {
    rows: { en: [], ar: [] },
    columns: [],
  },
})

function normalizeMatrixColumns(columns) {
  if (Array.isArray(columns)) {
    return columns.map((col, index) => {
      if (typeof col === 'string') {
        return {
          id: crypto.randomUUID(),
          key: `col_${index + 1}`,
          label: { en: col, ar: col },
          type: 'text',
          options: { en: [], ar: [] },
        }
      }
      return {
        id: col.id ?? crypto.randomUUID(),
        key: col.key ?? `col_${index + 1}`,
        label: {
          en: col.label?.en ?? col.label?.ar ?? `Column ${index + 1}`,
          ar: col.label?.ar ?? col.label?.en ?? `عمود ${index + 1}`,
        },
        type: col.type ?? 'text',
        options: {
          en: Array.isArray(col.options?.en) ? col.options.en : [],
          ar: Array.isArray(col.options?.ar) ? col.options.ar : [],
        },
      }
    })
  }

  // Backward compatibility: old schema used columns as { en: string[], ar: string[] }
  const en = Array.isArray(columns?.en) ? columns.en : []
  const ar = Array.isArray(columns?.ar) ? columns.ar : []
  const max = Math.max(en.length, ar.length)
  return Array.from({ length: max }, (_, index) => ({
    id: crypto.randomUUID(),
    key: `col_${index + 1}`,
    label: {
      en: en[index] ?? ar[index] ?? `Column ${index + 1}`,
      ar: ar[index] ?? en[index] ?? `عمود ${index + 1}`,
    },
    type: 'text',
    options: { en: [], ar: [] },
  }))
}

function normalizeField(field, index) {
  const type = field.type ?? 'text'
  return {
    id: field.id ?? crypto.randomUUID(),
    key: field.key ?? `field_${index + 1}`,
    type,
    required: Boolean(field.required),
    label: {
      en: field.label?.en ?? field.label?.ar ?? 'New Field',
      ar: field.label?.ar ?? field.label?.en ?? 'حقل جديد',
    },
    options: {
      en: Array.isArray(field.options?.en) ? field.options.en : [],
      ar: Array.isArray(field.options?.ar) ? field.options.ar : [],
    },
    matrix: {
      rows: {
        en: Array.isArray(field.matrix?.rows?.en) ? field.matrix.rows.en : [],
        ar: Array.isArray(field.matrix?.rows?.ar) ? field.matrix.rows.ar : [],
      },
      columns: normalizeMatrixColumns(field.matrix?.columns),
    },
  }
}

function normalizeSection(section, index) {
  return {
    id: section.id ?? crypto.randomUUID(),
    key: section.key ?? `section_${index + 1}`,
    title: {
      en: section.title?.en ?? section.title?.ar ?? 'New Section',
      ar: section.title?.ar ?? section.title?.en ?? 'قسم جديد',
    },
    fields: Array.isArray(section.fields)
      ? section.fields.map((field, fieldIndex) => normalizeField(field, fieldIndex))
      : [],
  }
}

function getNextKey(prefix, existingKeys) {
  let index = 1
  let candidate = `${prefix}_${index}`
  while (existingKeys.has(candidate)) {
    index += 1
    candidate = `${prefix}_${index}`
  }
  return candidate
}

function toFriendlyErrorMessage(message, fallbackPrefix) {
  if (!message) return fallbackPrefix
  if (message.includes('Undefined column')) {
    return `${fallbackPrefix}. Database is outdated; run backend migrations.`
  }
  if (message.startsWith('Server error')) {
    return `${fallbackPrefix}. Check backend logs.`
  }
  return `${fallbackPrefix}: ${message}`
}

function normalizeTemplate(rawTemplate) {
  return {
    ...rawTemplate,
    name_ar: rawTemplate?.name_ar ?? '',
    template_type: rawTemplate?.template_type ?? 'individual',
    sections: Array.isArray(rawTemplate?.sections)
      ? rawTemplate.sections.map((section, index) => normalizeSection(section, index))
      : [],
  }
}

function emptyTemplate() {
  return {
    name: '',
    name_ar: '',
    description: '',
    default_language: 'ar',
    template_type: 'individual',
    sections: [],
  }
}

export default function GpBuilder() {
  const [language, setLanguage] = useState('en')
  const [templates, setTemplates] = useState([])
  const [teamId, setTeamId] = useState(devConfig.teamId)
  const [actorId, setActorId] = useState(devConfig.actorId)
  const [isContextReady, setIsContextReady] = useState(false)
  const [template, setTemplate] = useState(emptyTemplate())
  const [templateId, setTemplateId] = useState(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [activeSectionId, setActiveSectionId] = useState(null)
  const [statusLabel, setStatusLabel] = useState('Loading template...')
  const [saveStatus, setSaveStatus] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false)
  const [newTemplateForm, setNewTemplateForm] = useState({
    name: '',
    name_ar: '',
    description: '',
    template_type: 'individual',
  })

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const teams = await getTeams()
        const activeTeam = teams[0]
        const resolvedTeamId = activeTeam?.id ?? devConfig.teamId
        const resolvedActorId =
          activeTeam?.owner_user_id ?? activeTeam?.members?.[0]?.user_id ?? devConfig.actorId
        setTeamId(resolvedTeamId)
        setActorId(resolvedActorId)
        setIsContextReady(Boolean(activeTeam))

        const loadedTemplates = await getTemplates(resolvedTeamId)
        if (loadedTemplates.length > 0) {
          if (!isMounted) return
          setTemplates(loadedTemplates)
          const selected = loadedTemplates[0]
          setTemplate(normalizeTemplate({
            ...selected,
            sections: selected.schema?.sections ?? [],
          }))
          setTemplateId(selected.id)
          setSelectedTemplateId(String(selected.id))
          const firstSection = selected.schema?.sections?.[0]
          setActiveSectionId(firstSection?.id ?? firstSection?.key ?? null)
          setStatusLabel('Live template')
        } else {
          if (!isMounted) return
          setTemplates([])
          setTemplate(emptyTemplate())
          setTemplateId(null)
          setSelectedTemplateId('')
          setActiveSectionId(null)
          setStatusLabel('No template yet. Start building a new form.')
        }
      } catch (error) {
        if (!isMounted) return
        setTemplates([])
        setTemplate(emptyTemplate())
        setTemplateId(null)
        setSelectedTemplateId('')
        setActiveSectionId(null)
        setIsContextReady(false)
        setStatusLabel('Could not load templates.')
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [])

  const handlePublish = async () => {
    if (!isContextReady) {
      setSaveStatus('Save failed: team context is not ready')
      return
    }
    if (!templateId) {
      setSaveStatus('Create a template first.')
      return
    }
    try {
      const schema = { sections: template.sections ?? [] }
      const updated = await updateTemplate(templateId, {
        name: template.name || 'Saudi KYC Master',
        name_ar: template.name_ar || '',
        description: template.description || '',
        default_language: template.default_language || 'ar',
        template_type: template.template_type || 'individual',
        schema,
        actor_id: actorId,
      })
      setTemplate(normalizeTemplate({
        ...updated,
        sections: updated.schema?.sections ?? [],
      }))
      const refreshedTemplates = await getTemplates(teamId)
      setTemplates(refreshedTemplates)
      setSaveStatus('Saved')
      setStatusLabel('Published')
    } catch (error) {
      setSaveStatus(toFriendlyErrorMessage(error.message, 'Save failed'))
    }
  }

  const handleTemplateSwitch = (value) => {
    if (!value) return
    setSaveStatus('')
    const selected = templates.find((item) => String(item.id) === value)
    if (!selected) return
    setSelectedTemplateId(value)
    setTemplate(normalizeTemplate({
      ...selected,
      sections: selected.schema?.sections ?? [],
    }))
    setTemplateId(selected.id)
    const firstSection = selected.schema?.sections?.[0]
    setActiveSectionId(firstSection?.id ?? firstSection?.key ?? null)
    setStatusLabel('Live template')
  }

  const openCreateTemplateModal = () => {
    setNewTemplateForm({
      name: '',
      name_ar: '',
      description: '',
      template_type: 'individual',
    })
    setSaveStatus('')
    setIsCreateModalOpen(true)
  }

  const closeCreateTemplateModal = () => {
    if (isCreatingTemplate) return
    setIsCreateModalOpen(false)
  }

  const handleCreateTemplateSubmit = async () => {
    const name = newTemplateForm.name.trim()
    if (!name) {
      setSaveStatus('Template name is required.')
      return
    }
    if (!isContextReady) {
      setSaveStatus('Create failed: team context is not ready')
      return
    }

    try {
      setIsCreatingTemplate(true)
      const created = await createTemplate({
        team_id: teamId,
        name,
        name_ar: newTemplateForm.name_ar.trim(),
        description: newTemplateForm.description.trim(),
        default_language: 'ar',
        template_type: newTemplateForm.template_type,
        schema: { sections: [] },
        actor_id: actorId,
      })
      const normalized = normalizeTemplate({
        ...created,
        sections: created.schema?.sections ?? [],
      })
      const refreshedTemplates = await getTemplates(teamId)
      setTemplates(refreshedTemplates)
      setTemplate(normalized)
      setTemplateId(created.id)
      setSelectedTemplateId(String(created.id))
      setActiveSectionId(normalized.sections[0]?.id ?? normalized.sections[0]?.key ?? null)
      setStatusLabel('Template created. Start building sections and fields.')
      setSaveStatus('Saved')
      setIsCreateModalOpen(false)
    } catch (error) {
      setSaveStatus(toFriendlyErrorMessage(error.message, 'Create failed'))
    } finally {
      setIsCreatingTemplate(false)
    }
  }

  const addSection = () => {
    const existingKeys = new Set(template.sections.map((item) => item.key))
    const newSection = emptySection(getNextKey('section', existingKeys))
    setTemplate((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }))
    setActiveSectionId(newSection.id ?? newSection.key)
  }

  const updateSection = (index, key, value) => {
    setTemplate((prev) => {
      const next = [...prev.sections]
      next[index] = { ...next[index], [key]: value }
      return { ...prev, sections: next }
    })
  }

  const moveSection = (fromIndex, toIndex) => {
    setTemplate((prev) => {
      const next = [...prev.sections]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return { ...prev, sections: next }
    })
  }

  const removeSection = (index) => {
    const removingActive =
      index >= 0 &&
      template.sections[index] &&
      (template.sections[index].id ?? template.sections[index].key) === activeSectionId

    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== index),
    }))

    if (removingActive) {
      const remaining = template.sections.filter((_, idx) => idx !== index)
      setActiveSectionId(remaining[0]?.id ?? remaining[0]?.key ?? null)
    }
  }

  const addField = (sectionIndex) => {
    setTemplate((prev) => {
      const next = [...prev.sections]
      const existingFieldKeys = new Set(
        next.flatMap((section) => (section.fields ?? []).map((item) => item.key)),
      )
      next[sectionIndex] = {
        ...next[sectionIndex],
        fields: [
          ...next[sectionIndex].fields,
          emptyField(getNextKey('field', existingFieldKeys)),
        ],
      }
      return { ...prev, sections: next }
    })
  }

  const updateField = (sectionIndex, fieldIndex, key, value) => {
    setTemplate((prev) => {
      const next = [...prev.sections]
      const fields = [...next[sectionIndex].fields]
      fields[fieldIndex] = { ...fields[fieldIndex], [key]: value }
      next[sectionIndex] = { ...next[sectionIndex], fields }
      return { ...prev, sections: next }
    })
  }

  const moveField = (sectionIndex, fromIndex, toIndex) => {
    setTemplate((prev) => {
      const next = [...prev.sections]
      const fields = [...next[sectionIndex].fields]
      const [moved] = fields.splice(fromIndex, 1)
      fields.splice(toIndex, 0, moved)
      next[sectionIndex] = { ...next[sectionIndex], fields }
      return { ...prev, sections: next }
    })
  }

  const removeField = (sectionIndex, fieldIndex) => {
    setTemplate((prev) => {
      const next = [...prev.sections]
      next[sectionIndex] = {
        ...next[sectionIndex],
        fields: next[sectionIndex].fields.filter((_, idx) => idx !== fieldIndex),
      }
      return { ...prev, sections: next }
    })
  }

  const updateOptionList = (sectionIndex, fieldIndex, lang, list) => {
    updateField(sectionIndex, fieldIndex, 'options', {
      ...(template.sections[sectionIndex].fields[fieldIndex].options ?? {}),
      [lang]: list,
    })
  }

  const addOption = (sectionIndex, fieldIndex, lang, value) => {
    if (!value.trim()) return
    const current = template.sections[sectionIndex].fields[fieldIndex].options?.[lang] ?? []
    updateOptionList(sectionIndex, fieldIndex, lang, [...current, value.trim()])
  }

  const removeOption = (sectionIndex, fieldIndex, lang, index) => {
    const current = template.sections[sectionIndex].fields[fieldIndex].options?.[lang] ?? []
    updateOptionList(
      sectionIndex,
      fieldIndex,
      lang,
      current.filter((_, idx) => idx !== index),
    )
  }

  const updateMatrixList = (sectionIndex, fieldIndex, axis, lang, list) => {
    const field = template.sections[sectionIndex].fields[fieldIndex]
    updateField(sectionIndex, fieldIndex, 'matrix', {
      ...(field.matrix ?? { rows: { en: [], ar: [] }, columns: [] }),
      [axis]: {
        ...(field.matrix?.[axis] ?? { en: [], ar: [] }),
        [lang]: list,
      },
    })
  }

  const addMatrixItem = (sectionIndex, fieldIndex, axis, lang, value) => {
    if (!value.trim()) return
    const current = template.sections[sectionIndex].fields[fieldIndex].matrix?.[axis]?.[lang] ?? []
    updateMatrixList(sectionIndex, fieldIndex, axis, lang, [...current, value.trim()])
  }

  const removeMatrixItem = (sectionIndex, fieldIndex, axis, lang, index) => {
    const current = template.sections[sectionIndex].fields[fieldIndex].matrix?.[axis]?.[lang] ?? []
    updateMatrixList(
      sectionIndex,
      fieldIndex,
      axis,
      lang,
      current.filter((_, idx) => idx !== index),
    )
  }

  const addMatrixColumn = (sectionIndex, fieldIndex) => {
    setTemplate((prev) => {
      const next = [...prev.sections]
      const field = next[sectionIndex].fields[fieldIndex]
      const columns = field.matrix?.columns ?? []
      const newColumn = {
        id: crypto.randomUUID(),
        label: { en: 'New Column', ar: 'عمود جديد' },
        type: 'text',
        options: { en: [], ar: [] },
      }
      const updated = {
        ...field,
        matrix: {
          ...(field.matrix ?? { rows: { en: [], ar: [] }, columns: [] }),
          columns: [...columns, newColumn],
        },
      }
      next[sectionIndex].fields[fieldIndex] = updated
      return { ...prev, sections: next }
    })
  }

  const updateMatrixColumn = (sectionIndex, fieldIndex, columnIndex, key, value) => {
    setTemplate((prev) => {
      const next = [...prev.sections]
      const field = next[sectionIndex].fields[fieldIndex]
      const columns = [...(field.matrix?.columns ?? [])]
      columns[columnIndex] = { ...columns[columnIndex], [key]: value }
      next[sectionIndex].fields[fieldIndex] = {
        ...field,
        matrix: { ...(field.matrix ?? { rows: { en: [], ar: [] }, columns: [] }), columns },
      }
      return { ...prev, sections: next }
    })
  }

  const removeMatrixColumn = (sectionIndex, fieldIndex, columnIndex) => {
    setTemplate((prev) => {
      const next = [...prev.sections]
      const field = next[sectionIndex].fields[fieldIndex]
      const columns = (field.matrix?.columns ?? []).filter((_, idx) => idx !== columnIndex)
      next[sectionIndex].fields[fieldIndex] = {
        ...field,
        matrix: { ...(field.matrix ?? { rows: { en: [], ar: [] }, columns: [] }), columns },
      }
      return { ...prev, sections: next }
    })
  }

  const updateMatrixColumnOptions = (sectionIndex, fieldIndex, columnIndex, lang, list) => {
    const field = template.sections[sectionIndex].fields[fieldIndex]
    const column = field.matrix?.columns?.[columnIndex]
    if (!column) return
    updateMatrixColumn(sectionIndex, fieldIndex, columnIndex, 'options', {
      ...(column.options ?? { en: [], ar: [] }),
      [lang]: list,
    })
  }

  useEffect(() => {
    if (template.sections.length === 0) {
      if (activeSectionId !== null) setActiveSectionId(null)
      return
    }

    const exists = template.sections.some(
      (section) => (section.id ?? section.key) === activeSectionId,
    )
    if (!exists) {
      const first = template.sections[0]
      setActiveSectionId(first.id ?? first.key ?? null)
    }
  }, [template.sections, activeSectionId])

  const activeSectionIndex = template.sections.findIndex(
    (section) => (section.id ?? section.key) === activeSectionId,
  )
  const resolvedActiveSectionIndex =
    activeSectionIndex >= 0
      ? activeSectionIndex
      : template.sections.length > 0
        ? 0
        : -1
  const activeSection =
    resolvedActiveSectionIndex >= 0
      ? template.sections[resolvedActiveSectionIndex]
      : null

  const getLocalizedText = (value, fallback = '') =>
    value?.[language] || value?.en || value?.ar || fallback

  return (
    <div>
      <TopBar
        title="Form Builder"
        subtitle="Design the bilingual KYC form LPs will complete."
      >
        <select
          value={selectedTemplateId}
          onChange={(event) => handleTemplateSwitch(event.target.value)}
          style={{
            minWidth: '280px',
            padding: '8px 12px',
            borderRadius: '10px',
            border: '1px solid #e2d6c6',
          }}
        >
          {templates.length === 0 ? (
            <option value="">No templates</option>
          ) : null}
          {templates.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {item.name_ar ? ` / ${item.name_ar}` : ''}
              {` (${item.template_type ?? 'individual'})`}
            </option>
          ))}
        </select>
        <LanguageToggle language={language} onChange={setLanguage} />
        <button className="btn secondary" onClick={openCreateTemplateModal}>
          Create New Template
        </button>
        <button className="btn secondary" onClick={addSection}>
          Add Section
        </button>
        <button className="btn" onClick={handlePublish} disabled={!isContextReady || !templateId}>
          Save Template
        </button>
      </TopBar>

      <div className="card">
        <div className="field-meta" style={{ marginBottom: '10px' }}>
          Template: {template.name || 'Not selected'}
          {template.name_ar ? ` / ${template.name_ar}` : ''}
          {` · Type: ${template.template_type || '-'}`}
        </div>
        <p className="card-subtitle">
          {statusLabel}
          {saveStatus ? ` · ${saveStatus}` : ''}
        </p>
        <div className="builder-workspace">
          <aside className="builder-sidebar">
            <div className="field-meta" style={{ marginBottom: '8px' }}>
              Sections ({template.sections.length})
            </div>
            <div className="section-nav-list">
              {template.sections.map((section, sectionIndex) => {
                const sectionToken = section.id ?? section.key
                const isActive = sectionToken === (activeSection?.id ?? activeSection?.key)
                return (
                  <button
                    type="button"
                    key={sectionToken}
                    className={`section-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveSectionId(sectionToken)}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/plain', `section:${sectionIndex}`)
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      const payload = event.dataTransfer.getData('text/plain')
                      if (!payload.startsWith('section:')) return
                      const fromIndex = Number(payload.split(':')[1])
                      if (Number.isNaN(fromIndex) || fromIndex === sectionIndex) return
                      const movedToken =
                        template.sections[fromIndex]?.id ?? template.sections[fromIndex]?.key
                      moveSection(fromIndex, sectionIndex)
                      setActiveSectionId(movedToken ?? null)
                    }}
                  >
                    <span className="section-nav-title">
                      {getLocalizedText(section.title, 'Untitled section')}
                    </span>
                    <span className="section-nav-meta">
                      {section.fields?.length ?? 0} fields
                    </span>
                  </button>
                )
              })}
            </div>
          </aside>

          <div className="builder-main">
            {activeSection ? (
              <div className="section-card">
                <div className="section-header">
                  <div className="field-meta">Active section</div>
                  <div className="action-row">
                    <button
                      className="btn secondary"
                      onClick={() => addField(resolvedActiveSectionIndex)}
                    >
                      Add Field
                    </button>
                    <button
                      className="btn ghost"
                      onClick={() => removeSection(resolvedActiveSectionIndex)}
                    >
                      Remove Section
                    </button>
                  </div>
                </div>
                <div className="grid grid-2" style={{ marginTop: '12px' }}>
                  <div>
                    <label className="field-meta">Title (EN)</label>
                    <input
                      type="text"
                      value={activeSection.title?.en ?? ''}
                      onChange={(event) =>
                        updateSection(resolvedActiveSectionIndex, 'title', {
                          ...(activeSection.title ?? {}),
                          en: event.target.value,
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: '1px solid #e2d6c6',
                        marginTop: '6px',
                      }}
                    />
                  </div>
                  <div>
                    <label className="field-meta">Title (AR)</label>
                    <input
                      type="text"
                      className="arabic"
                      value={activeSection.title?.ar ?? ''}
                      onChange={(event) =>
                        updateSection(resolvedActiveSectionIndex, 'title', {
                          ...(activeSection.title ?? {}),
                          ar: event.target.value,
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: '1px solid #e2d6c6',
                        marginTop: '6px',
                      }}
                    />
                  </div>
                </div>

                <div className="grid" style={{ marginTop: '12px' }}>
                  {(activeSection.fields ?? []).map((field, fieldIndex) => (
                    <div
                      className="builder-field"
                      key={field.id ?? field.key}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/plain', `field:${fieldIndex}`)
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault()
                        const payload = event.dataTransfer.getData('text/plain')
                        if (!payload.startsWith('field:')) return
                        const fromFieldIndex = Number(payload.split(':')[1])
                        if (Number.isNaN(fromFieldIndex) || fromFieldIndex === fieldIndex) return
                        moveField(resolvedActiveSectionIndex, fromFieldIndex, fieldIndex)
                      }}
                    >
                    <div className="grid grid-2">
                      <div>
                        <label className="field-meta">Type</label>
                        <select
                          value={field.type}
                          onChange={(event) =>
                            updateField(
                              resolvedActiveSectionIndex,
                              fieldIndex,
                              'type',
                              event.target.value,
                            )
                          }
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            border: '1px solid #e2d6c6',
                            marginTop: '6px',
                          }}
                        >
                          {FIELD_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="field-meta">Label (EN)</label>
                        <input
                          type="text"
                          value={field.label?.en ?? ''}
                          onChange={(event) =>
                            updateField(
                              resolvedActiveSectionIndex,
                              fieldIndex,
                              'label',
                              {
                                ...(field.label ?? {}),
                                en: event.target.value,
                              },
                            )
                          }
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            border: '1px solid #e2d6c6',
                            marginTop: '6px',
                          }}
                        />
                      </div>
                      <div>
                        <label className="field-meta">Label (AR)</label>
                        <input
                          type="text"
                          className="arabic"
                          value={field.label?.ar ?? ''}
                          onChange={(event) =>
                            updateField(
                              resolvedActiveSectionIndex,
                              fieldIndex,
                              'label',
                              {
                                ...(field.label ?? {}),
                                ar: event.target.value,
                              },
                            )
                          }
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            border: '1px solid #e2d6c6',
                            marginTop: '6px',
                          }}
                        />
                      </div>
                      <div>
                        <label className="field-meta">Required</label>
                        <select
                          value={field.required ? 'yes' : 'no'}
                          onChange={(event) =>
                            updateField(
                              resolvedActiveSectionIndex,
                              fieldIndex,
                              'required',
                              event.target.value === 'yes',
                            )
                          }
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: '10px',
                            border: '1px solid #e2d6c6',
                            marginTop: '6px',
                          }}
                        >
                          <option value="yes">Required</option>
                          <option value="no">Optional</option>
                        </select>
                      </div>
                      {field.type === 'select' || field.type === 'checkbox' ? (
                        <div className="dual-list">
                          <div>
                            <label className="field-meta">Options (EN)</label>
                            <OptionList
                              items={field.options?.en ?? []}
                              onAdd={(value) =>
                                addOption(resolvedActiveSectionIndex, fieldIndex, 'en', value)
                              }
                              onRemove={(index) =>
                                removeOption(resolvedActiveSectionIndex, fieldIndex, 'en', index)
                              }
                            />
                          </div>
                          <div>
                            <label className="field-meta">Options (AR)</label>
                            <OptionList
                              items={field.options?.ar ?? []}
                              onAdd={(value) =>
                                addOption(resolvedActiveSectionIndex, fieldIndex, 'ar', value)
                              }
                              onRemove={(index) =>
                                removeOption(resolvedActiveSectionIndex, fieldIndex, 'ar', index)
                              }
                            />
                          </div>
                        </div>
                      ) : null}
                      {field.type === 'matrix' ? (
                        <div className="matrix-editor">
                          <div>
                            <label className="field-meta">Matrix rows (EN)</label>
                            <OptionList
                              items={field.matrix?.rows?.en ?? []}
                              onAdd={(value) =>
                                addMatrixItem(
                                  resolvedActiveSectionIndex,
                                  fieldIndex,
                                  'rows',
                                  'en',
                                  value,
                                )
                              }
                              onRemove={(index) =>
                                removeMatrixItem(
                                  resolvedActiveSectionIndex,
                                  fieldIndex,
                                  'rows',
                                  'en',
                                  index,
                                )
                              }
                            />
                            <label className="field-meta" style={{ marginTop: '10px' }}>
                              Matrix rows (AR)
                            </label>
                            <OptionList
                              items={field.matrix?.rows?.ar ?? []}
                              onAdd={(value) =>
                                addMatrixItem(
                                  resolvedActiveSectionIndex,
                                  fieldIndex,
                                  'rows',
                                  'ar',
                                  value,
                                )
                              }
                              onRemove={(index) =>
                                removeMatrixItem(
                                  resolvedActiveSectionIndex,
                                  fieldIndex,
                                  'rows',
                                  'ar',
                                  index,
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="field-meta">Matrix columns</label>
                            <div className="action-row" style={{ marginTop: '8px' }}>
                              <button
                                className="btn secondary"
                                onClick={() =>
                                  addMatrixColumn(resolvedActiveSectionIndex, fieldIndex)
                                }
                              >
                                Add Column
                              </button>
                            </div>
                            <div className="matrix-columns">
                              {(field.matrix?.columns ?? []).map((column, columnIndex) => (
                                <div key={column.id ?? columnIndex} className="matrix-column-card">
                                  <div className="grid grid-2">
                                    <label>
                                      <span className="field-meta">Label (EN)</span>
                                      <input
                                        type="text"
                                        className="input"
                                        value={column.label?.en ?? ''}
                                        onChange={(event) =>
                                          updateMatrixColumn(
                                            resolvedActiveSectionIndex,
                                            fieldIndex,
                                            columnIndex,
                                            'label',
                                            {
                                              ...(column.label ?? {}),
                                              en: event.target.value,
                                            },
                                          )
                                        }
                                      />
                                    </label>
                                    <label>
                                      <span className="field-meta">Label (AR)</span>
                                      <input
                                        type="text"
                                        className="input arabic"
                                        value={column.label?.ar ?? ''}
                                        onChange={(event) =>
                                          updateMatrixColumn(
                                            resolvedActiveSectionIndex,
                                            fieldIndex,
                                            columnIndex,
                                            'label',
                                            {
                                              ...(column.label ?? {}),
                                              ar: event.target.value,
                                            },
                                          )
                                        }
                                      />
                                    </label>
                                    <label>
                                      <span className="field-meta">Type</span>
                                      <select
                                        className="input"
                                        value={column.type ?? 'text'}
                                        onChange={(event) =>
                                          updateMatrixColumn(
                                            resolvedActiveSectionIndex,
                                            fieldIndex,
                                            columnIndex,
                                            'type',
                                            event.target.value,
                                          )
                                        }
                                      >
                                        <option value="text">Text</option>
                                        <option value="select">Dropdown</option>
                                      </select>
                                    </label>
                                  </div>
                                  {column.type === 'select' ? (
                                    <div className="dual-list" style={{ marginTop: '10px' }}>
                                      <div>
                                        <label className="field-meta">Options (EN)</label>
                                        <OptionList
                                          items={column.options?.en ?? []}
                                          onAdd={(value) => {
                                            const next = [
                                              ...(column.options?.en ?? []),
                                              value.trim(),
                                            ].filter(Boolean)
                                            updateMatrixColumnOptions(
                                              resolvedActiveSectionIndex,
                                              fieldIndex,
                                              columnIndex,
                                              'en',
                                              next,
                                            )
                                          }}
                                          onRemove={(index) => {
                                            const next = (column.options?.en ?? []).filter(
                                              (_, idx) => idx !== index,
                                            )
                                            updateMatrixColumnOptions(
                                              resolvedActiveSectionIndex,
                                              fieldIndex,
                                              columnIndex,
                                              'en',
                                              next,
                                            )
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <label className="field-meta">Options (AR)</label>
                                        <OptionList
                                          items={column.options?.ar ?? []}
                                          onAdd={(value) => {
                                            const next = [
                                              ...(column.options?.ar ?? []),
                                              value.trim(),
                                            ].filter(Boolean)
                                            updateMatrixColumnOptions(
                                              resolvedActiveSectionIndex,
                                              fieldIndex,
                                              columnIndex,
                                              'ar',
                                              next,
                                            )
                                          }}
                                          onRemove={(index) => {
                                            const next = (column.options?.ar ?? []).filter(
                                              (_, idx) => idx !== index,
                                            )
                                            updateMatrixColumnOptions(
                                              resolvedActiveSectionIndex,
                                              fieldIndex,
                                              columnIndex,
                                              'ar',
                                              next,
                                            )
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ) : null}
                                  <div className="action-row" style={{ marginTop: '10px' }}>
                                    <button
                                      className="btn ghost"
                                      onClick={() =>
                                        removeMatrixColumn(
                                          resolvedActiveSectionIndex,
                                          fieldIndex,
                                          columnIndex,
                                        )
                                      }
                                    >
                                      Remove Column
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="matrix-preview">
                            <div className="field-meta">Preview</div>
                            <div
                              className="matrix-grid"
                              style={{
                                gridTemplateColumns: `140px repeat(${
                                  (field.matrix?.columns ?? []).length
                                }, minmax(80px, 1fr))`,
                              }}
                            >
                              <div className="matrix-cell" />
                              {(field.matrix?.columns ?? []).map((col, index) => (
                                <div key={`col-${index}`} className="matrix-cell header">
                                  {col.label?.[language] ?? col.label?.en ?? col.label?.ar ?? ''}
                                </div>
                              ))}
                              {(field.matrix?.rows?.[language] ?? []).map((row, rowIndex) => (
                                <Fragment key={`row-${rowIndex}`}>
                                  <div className="matrix-cell header">{row}</div>
                                  {(field.matrix?.columns ?? []).map((_, colIndex) => (
                                    <div
                                      key={`cell-${rowIndex}-${colIndex}`}
                                      className="matrix-cell"
                                    />
                                  ))}
                                </Fragment>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="action-row" style={{ marginTop: '10px' }}>
                      <button
                        className="btn ghost"
                        onClick={() => removeField(resolvedActiveSectionIndex, fieldIndex)}
                      >
                        Remove Field
                      </button>
                    </div>
                  </div>
                  ))}
                </div>

                {(activeSection.fields ?? []).length === 0 ? (
                  <div className="field-meta" style={{ marginTop: '10px' }}>
                    No fields in this section yet.
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="section-card">
                <div className="field-meta">No sections yet. Click Add Section.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isCreateModalOpen ? (
        <div className="modal-backdrop" onClick={closeCreateTemplateModal}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Create Template</h3>
              <button className="btn ghost" onClick={closeCreateTemplateModal}>
                Close
              </button>
            </div>
            <div className="modal-body">
              <div className="grid" style={{ gap: '12px' }}>
                <label>
                  <span className="field-meta">Template name</span>
                  <input
                    className="input"
                    type="text"
                    value={newTemplateForm.name}
                    onChange={(event) =>
                      setNewTemplateForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                </label>
                <label>
                  <span className="field-meta">Description</span>
                  <input
                    className="input"
                    type="text"
                    value={newTemplateForm.description}
                    onChange={(event) =>
                      setNewTemplateForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span className="field-meta">Template name (AR)</span>
                  <input
                    className="input arabic"
                    type="text"
                    value={newTemplateForm.name_ar}
                    onChange={(event) =>
                      setNewTemplateForm((prev) => ({ ...prev, name_ar: event.target.value }))
                    }
                  />
                </label>
                <label>
                  <span className="field-meta">Template type</span>
                  <select
                    className="input"
                    value={newTemplateForm.template_type}
                    onChange={(event) =>
                      setNewTemplateForm((prev) => ({
                        ...prev,
                        template_type: event.target.value,
                      }))
                    }
                  >
                    <option value="individual">Individual</option>
                    <option value="institutional">Institutional</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn ghost" onClick={closeCreateTemplateModal}>
                Cancel
              </button>
              <button
                className="btn"
                onClick={handleCreateTemplateSubmit}
                disabled={isCreatingTemplate}
              >
                {isCreatingTemplate ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function OptionList({ items, onAdd, onRemove }) {
  const [value, setValue] = useState('')

  return (
    <div className="option-list">
      <div className="option-input">
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Add option"
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: '10px',
            border: '1px solid #e2d6c6',
          }}
        />
        <button
          className="btn secondary"
          onClick={() => {
            onAdd(value)
            setValue('')
          }}
          style={{ whiteSpace: 'nowrap' }}
        >
          Add
        </button>
      </div>
      <div className="option-tags">
        {items.length === 0 ? (
          <span className="field-meta">No options yet.</span>
        ) : (
          items.map((item, index) => (
            <span key={`${item}-${index}`} className="option-tag">
              {item}
              <button
                type="button"
                className="option-remove"
                onClick={() => onRemove(index)}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  )
}
