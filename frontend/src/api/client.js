const baseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed: ${response.status}`)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export function getDefaultSchema() {
  return request('/templates/default-schema')
}

export function getTeams() {
  return request('/teams')
}

export function createTeam(payload) {
  return request('/teams', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getTemplates(teamId) {
  const query = new URLSearchParams({ team_id: String(teamId) })
  return request(`/templates?${query.toString()}`)
}

export function createTemplate(payload) {
  return request('/templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateTemplate(templateId, payload) {
  return request(`/templates/${templateId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getSubmissions({ templateId, investorUserId } = {}) {
  const query = new URLSearchParams()
  if (templateId) query.set('template_id', String(templateId))
  if (investorUserId) query.set('investor_user_id', String(investorUserId))
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return request(`/submissions${suffix}`)
}

export function createSubmission(payload) {
  return request('/submissions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateSubmission(submissionId, payload) {
  return request(`/submissions/${submissionId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function submitSubmission(submissionId, payload) {
  return request(`/submissions/${submissionId}/submit`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  })
}

export function resubmitSubmission(submissionId) {
  return request(`/submissions/${submissionId}/resubmit`, {
    method: 'POST',
  })
}

export function rejectSubmission(submissionId, payload) {
  return request(`/submissions/${submissionId}/reject`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function approveSubmission(submissionId) {
  return request(`/submissions/${submissionId}/approve`, {
    method: 'POST',
  })
}

export function createApprovalChain(payload) {
  return request('/approval-chains', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateApprovalChain(chainId, payload) {
  return request(`/approval-chains/${chainId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function startApprovalChain(submissionId, payload) {
  return request(`/approval-chains/${submissionId}/start`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function actOnApprovalStep(submissionId, payload) {
  return request(`/approval-chains/${submissionId}/action`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function downloadSubmissionPdf(submissionId) {
  const response = await fetch(`${baseUrl}/submissions/${submissionId}/pdf`)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed: ${response.status}`)
  }
  return response.blob()
}

export async function downloadSubmissionPdfWithLanguage(submissionId, language) {
  const response = await fetch(
    `${baseUrl}/submissions/${submissionId}/pdf?language=${language}`,
  )
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed: ${response.status}`)
  }
  return response.blob()
}

export async function uploadBrandingAsset(file, type) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)

  const response = await fetch(`${baseUrl}/branding/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed: ${response.status}`)
  }

  return response.json()
}
