import { Fragment, useEffect, useState } from 'react'
import TopBar from '../components/TopBar.jsx'
import LanguageToggle from '../components/LanguageToggle.jsx'
import {
  createTemplate,
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

const emptySection = () => ({
  id: crypto.randomUUID(),
  key: '',
  title: { en: 'New Section', ar: 'قسم جديد' },
  fields: [],
})

const emptyField = () => ({
  id: crypto.randomUUID(),
  key: '',
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

function normalizeTemplate(rawTemplate) {
  return {
    ...rawTemplate,
    template_type: rawTemplate?.template_type ?? 'individual',
    sections: Array.isArray(rawTemplate?.sections)
      ? rawTemplate.sections.map((section, index) => normalizeSection(section, index))
      : [],
  }
}

function emptyTemplate() {
  return {
    name: '',
    description: '',
    default_language: 'ar',
    template_type: 'individual',
    sections: [],
  }
}

export default function GpBuilder() {
  const [language, setLanguage] = useState('en')
  const [templates, setTemplates] = useState([])
  const [template, setTemplate] = useState(emptyTemplate())
  const [templateId, setTemplateId] = useState(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState('new')
  const [statusLabel, setStatusLabel] = useState('Loading template...')
  const [saveStatus, setSaveStatus] = useState('')

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const loadedTemplates = await getTemplates(devConfig.teamId)
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
          setStatusLabel('Live template')
        } else {
          if (!isMounted) return
          setTemplates([])
          setTemplate(emptyTemplate())
          setTemplateId(null)
          setSelectedTemplateId('new')
          setStatusLabel('No template yet. Start building a new form.')
        }
      } catch (error) {
        if (!isMounted) return
        setTemplates([])
        setTemplate(emptyTemplate())
        setTemplateId(null)
        setSelectedTemplateId('new')
        setStatusLabel('Could not load templates.')
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [])

  const handlePublish = async () => {
    try {
      const schema = { sections: template.sections ?? [] }
      if (templateId) {
        const updated = await updateTemplate(templateId, {
          name: template.name || 'Saudi KYC Master',
          description: template.description || '',
          default_language: template.default_language || 'ar',
          template_type: template.template_type || 'individual',
          schema,
          actor_id: devConfig.actorId,
        })
        setTemplate(normalizeTemplate({
          ...updated,
          sections: updated.schema?.sections ?? [],
        }))
      } else {
        const created = await createTemplate({
          team_id: devConfig.teamId,
          name: template.name || 'Saudi KYC Master',
          description: template.description || '',
          default_language: template.default_language || 'ar',
          template_type: template.template_type || 'individual',
          schema,
          actor_id: devConfig.actorId,
        })
        setTemplateId(created.id)
        setSelectedTemplateId(String(created.id))
      }
      const refreshedTemplates = await getTemplates(devConfig.teamId)
      setTemplates(refreshedTemplates)
      setSaveStatus('Saved')
      setStatusLabel('Published')
    } catch (error) {
      setSaveStatus(`Save failed: ${error.message}`)
    }
  }

  const handleTemplateSwitch = (value) => {
    setSaveStatus('')
    setSelectedTemplateId(value)
    if (value === 'new') {
      setTemplate(emptyTemplate())
      setTemplateId(null)
      setStatusLabel('New template draft')
      return
    }

    const selected = templates.find((item) => String(item.id) === value)
    if (!selected) return
    setTemplate(normalizeTemplate({
      ...selected,
      sections: selected.schema?.sections ?? [],
    }))
    setTemplateId(selected.id)
    setStatusLabel('Live template')
  }

  const updateTemplateMeta = (key, value) => {
    setTemplate((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const addSection = () => {
    setTemplate((prev) => ({
      ...prev,
      sections: [...prev.sections, emptySection()],
    }))
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
    setTemplate((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== index),
    }))
  }

  const addField = (sectionIndex) => {
    setTemplate((prev) => {
      const next = [...prev.sections]
      next[sectionIndex] = {
        ...next[sectionIndex],
        fields: [...next[sectionIndex].fields, emptyField()],
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

  return (
    <div>
      <TopBar
        title="Form Builder"
        subtitle="Design the bilingual KYC form LPs will complete."
      >
        <LanguageToggle language={language} onChange={setLanguage} />
        <button className="btn secondary" onClick={addSection}>
          Add Section
        </button>
        <button className="btn" onClick={handlePublish}>
          Save Template
        </button>
      </TopBar>

      <div className="card">
        <div className="grid grid-2" style={{ marginBottom: '16px' }}>
          <div>
            <label className="field-meta">Template</label>
            <select
              value={selectedTemplateId}
              onChange={(event) => handleTemplateSwitch(event.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #e2d6c6',
                marginTop: '6px',
              }}
            >
              <option value="new">+ Create New Template</option>
              {templates.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.template_type ?? 'individual'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-meta">Template type</label>
            <select
              value={template.template_type ?? 'individual'}
              onChange={(event) => updateTemplateMeta('template_type', event.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #e2d6c6',
                marginTop: '6px',
              }}
            >
              <option value="individual">Individual</option>
              <option value="institutional">Institutional</option>
            </select>
          </div>
        </div>
        <div className="grid grid-2" style={{ marginBottom: '16px' }}>
          <div>
            <label className="field-meta">Template name</label>
            <input
              type="text"
              value={template.name ?? ''}
              onChange={(event) => updateTemplateMeta('name', event.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #e2d6c6',
                marginTop: '6px',
              }}
            />
          </div>
          <div>
            <label className="field-meta">Description</label>
            <input
              type="text"
              value={template.description ?? ''}
              onChange={(event) => updateTemplateMeta('description', event.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #e2d6c6',
                marginTop: '6px',
              }}
            />
          </div>
        </div>
        <p className="card-subtitle">
          {statusLabel}
          {saveStatus ? ` · ${saveStatus}` : ''}
        </p>
        <div className="grid">
          {template.sections.map((section, sectionIndex) => (
            <div
              className="section-card"
              key={section.id ?? section.key}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('text/plain', `section:${sectionIndex}`)
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                const payload = event.dataTransfer.getData('text/plain')
                if (payload.startsWith('section:')) {
                  const fromIndex = Number(payload.split(':')[1])
                  if (!Number.isNaN(fromIndex) && fromIndex !== sectionIndex) {
                    moveSection(fromIndex, sectionIndex)
                  }
                }
              }}
            >
              <div className="section-header">
                <div>
                  <div className="field-meta">Section key</div>
                  <input
                    type="text"
                    value={section.key ?? ''}
                    onChange={(event) =>
                      updateSection(sectionIndex, 'key', event.target.value)
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
                <div className="action-row">
                  <button
                    className="btn secondary"
                    onClick={() => addField(sectionIndex)}
                  >
                    Add Field
                  </button>
                  <button
                    className="btn ghost"
                    onClick={() => removeSection(sectionIndex)}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="grid grid-2" style={{ marginTop: '12px' }}>
                <div>
                  <label className="field-meta">Title (EN)</label>
                  <input
                    type="text"
                    value={section.title?.en ?? ''}
                    onChange={(event) =>
                      updateSection(sectionIndex, 'title', {
                        ...(section.title ?? {}),
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
                    value={section.title?.ar ?? ''}
                    onChange={(event) =>
                      updateSection(sectionIndex, 'title', {
                        ...(section.title ?? {}),
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
                {section.fields.map((field, fieldIndex) => (
                  <div
                    className="builder-field"
                    key={field.id ?? field.key}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData(
                        'text/plain',
                        `field:${sectionIndex}:${fieldIndex}`,
                      )
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault()
                      const payload = event.dataTransfer.getData('text/plain')
                      if (payload.startsWith('field:')) {
                        const [, fromSection, fromIndex] = payload.split(':')
                        const fromSectionIndex = Number(fromSection)
                        const fromFieldIndex = Number(fromIndex)
                        if (
                          fromSectionIndex === sectionIndex &&
                          !Number.isNaN(fromFieldIndex) &&
                          fromFieldIndex !== fieldIndex
                        ) {
                          moveField(sectionIndex, fromFieldIndex, fieldIndex)
                        }
                      }
                    }}
                  >
                    <div className="grid grid-2">
                      <div>
                        <label className="field-meta">Field key</label>
                        <input
                          type="text"
                          value={field.key ?? ''}
                          onChange={(event) =>
                            updateField(
                              sectionIndex,
                              fieldIndex,
                              'key',
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
                        />
                      </div>
                      <div>
                        <label className="field-meta">Type</label>
                        <select
                          value={field.type}
                          onChange={(event) =>
                            updateField(
                              sectionIndex,
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
                              sectionIndex,
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
                              sectionIndex,
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
                              sectionIndex,
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
                                addOption(sectionIndex, fieldIndex, 'en', value)
                              }
                              onRemove={(index) =>
                                removeOption(sectionIndex, fieldIndex, 'en', index)
                              }
                            />
                          </div>
                          <div>
                            <label className="field-meta">Options (AR)</label>
                            <OptionList
                              items={field.options?.ar ?? []}
                              onAdd={(value) =>
                                addOption(sectionIndex, fieldIndex, 'ar', value)
                              }
                              onRemove={(index) =>
                                removeOption(sectionIndex, fieldIndex, 'ar', index)
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
                                  sectionIndex,
                                  fieldIndex,
                                  'rows',
                                  'en',
                                  value,
                                )
                              }
                              onRemove={(index) =>
                                removeMatrixItem(
                                  sectionIndex,
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
                                  sectionIndex,
                                  fieldIndex,
                                  'rows',
                                  'ar',
                                  value,
                                )
                              }
                              onRemove={(index) =>
                                removeMatrixItem(
                                  sectionIndex,
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
                                onClick={() => addMatrixColumn(sectionIndex, fieldIndex)}
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
                                            sectionIndex,
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
                                            sectionIndex,
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
                                            sectionIndex,
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
                                              sectionIndex,
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
                                              sectionIndex,
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
                                              sectionIndex,
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
                                              sectionIndex,
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
                                          sectionIndex,
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
                        onClick={() => removeField(sectionIndex, fieldIndex)}
                      >
                        Remove Field
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
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
