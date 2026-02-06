import { Fragment, useEffect, useState } from 'react'
import TopBar from '../components/TopBar.jsx'
import LanguageToggle from '../components/LanguageToggle.jsx'
import { mockTemplates } from '../data/mock.js'
import {
  createTemplate,
  getDefaultSchema,
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
    columns: { en: [], ar: [] },
  },
})

export default function GpBuilder() {
  const [language, setLanguage] = useState('en')
  const [template, setTemplate] = useState(mockTemplates[0])
  const [templateId, setTemplateId] = useState(null)
  const [statusLabel, setStatusLabel] = useState('Live template')
  const [saveStatus, setSaveStatus] = useState('')

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const templates = await getTemplates(devConfig.teamId)
        if (templates.length > 0) {
          if (!isMounted) return
          const selected = templates[0]
          setTemplate({
            ...selected,
            sections: selected.schema?.sections ?? [],
          })
          setTemplateId(selected.id)
          setStatusLabel('Live template')
        } else {
          const schema = await getDefaultSchema()
          if (!isMounted) return
          setTemplate({
            name: 'Saudi KYC Master',
            description: 'Default Saudi KYC onboarding template',
            updatedAt: 'Just now',
            sections: schema.sections,
          })
          setTemplateId(null)
          setStatusLabel('Default schema')
        }
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

  const handlePublish = async () => {
    try {
      const schema = template.sections
        ? { sections: template.sections }
        : await getDefaultSchema()
      if (templateId) {
        await updateTemplate(templateId, {
          name: template.name || 'Saudi KYC Master',
          description: template.description || '',
          default_language: template.default_language || 'ar',
          schema,
          actor_id: devConfig.actorId,
        })
      } else {
        const created = await createTemplate({
          team_id: devConfig.teamId,
          name: template.name || 'Saudi KYC Master',
          description: template.description || '',
          default_language: template.default_language || 'ar',
          schema,
          actor_id: devConfig.actorId,
        })
        setTemplateId(created.id)
      }
      setSaveStatus('Saved')
      setStatusLabel('Published')
    } catch (error) {
      setSaveStatus(`Save failed: ${error.message}`)
    }
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
      ...(field.matrix ?? { rows: { en: [], ar: [] }, columns: { en: [], ar: [] } }),
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
                        <div>
                          <label className="field-meta">Options</label>
                          <OptionList
                            items={field.options?.[language] ?? []}
                            onAdd={(value) =>
                              addOption(sectionIndex, fieldIndex, language, value)
                            }
                            onRemove={(index) =>
                              removeOption(sectionIndex, fieldIndex, language, index)
                            }
                          />
                        </div>
                      ) : null}
                      {field.type === 'matrix' ? (
                        <div className="matrix-editor">
                          <div>
                            <label className="field-meta">Matrix rows</label>
                            <OptionList
                              items={field.matrix?.rows?.[language] ?? []}
                              onAdd={(value) =>
                                addMatrixItem(
                                  sectionIndex,
                                  fieldIndex,
                                  'rows',
                                  language,
                                  value,
                                )
                              }
                              onRemove={(index) =>
                                removeMatrixItem(
                                  sectionIndex,
                                  fieldIndex,
                                  'rows',
                                  language,
                                  index,
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="field-meta">Matrix columns</label>
                            <OptionList
                              items={field.matrix?.columns?.[language] ?? []}
                              onAdd={(value) =>
                                addMatrixItem(
                                  sectionIndex,
                                  fieldIndex,
                                  'columns',
                                  language,
                                  value,
                                )
                              }
                              onRemove={(index) =>
                                removeMatrixItem(
                                  sectionIndex,
                                  fieldIndex,
                                  'columns',
                                  language,
                                  index,
                                )
                              }
                            />
                          </div>
                          <div className="matrix-preview">
                            <div className="field-meta">Preview</div>
                            <div
                              className="matrix-grid"
                              style={{
                                gridTemplateColumns: `140px repeat(${
                                  (field.matrix?.columns?.[language] ?? []).length
                                }, minmax(80px, 1fr))`,
                              }}
                            >
                              <div className="matrix-cell" />
                              {(field.matrix?.columns?.[language] ?? []).map(
                                (col, index) => (
                                  <div key={`col-${index}`} className="matrix-cell header">
                                    {col}
                                  </div>
                                ),
                              )}
                              {(field.matrix?.rows?.[language] ?? []).map((row, rowIndex) => (
                                <Fragment key={`row-${rowIndex}`}>
                                  <div className="matrix-cell header">{row}</div>
                                  {(field.matrix?.columns?.[language] ?? []).map(
                                    (_, colIndex) => (
                                      <div
                                        key={`cell-${rowIndex}-${colIndex}`}
                                        className="matrix-cell"
                                      />
                                    ),
                                  )}
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
