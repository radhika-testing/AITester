import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Settings API
export const settingsApi = {
  saveJiraConfig: (config: { base_url: string; username: string; api_token: string }) =>
    api.post('/settings/jira', config),
  
  getJiraStatus: () =>
    api.get('/settings/jira'),
  
  saveLLMConfig: (config: {
    provider: string
    groq_api_key?: string
    groq_model?: string
    ollama_base_url?: string
    ollama_model?: string
    temperature: number
  }) => api.post('/settings/llm', config),
  
  getLLMStatus: () =>
    api.get('/settings/llm'),
  
  testLLMConnection: (config: any) =>
    api.post('/settings/llm/test', config),
  
  listOllamaModels: (baseUrl: string) =>
    api.get('/settings/llm/models', { params: { base_url: baseUrl } })
}

// JIRA API
export const jiraApi = {
  fetchTicket: (ticketId: string) =>
    api.post('/jira/fetch', { ticketId }),
  
  getRecentTickets: () =>
    api.get('/jira/recent')
}

// Templates API
export const templatesApi = {
  uploadTemplate: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/templates/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  listTemplates: () =>
    api.get('/templates'),
  
  getTemplate: (id: string) =>
    api.get(`/templates/${id}`),
  
  deleteTemplate: (id: string) =>
    api.delete(`/templates/${id}`)
}

// Test Plan API
export const testPlanApi = {
  generate: (data: {
    ticket_id: string
    template_id?: string
    provider: string
  }) => api.post('/testplan/generate', data),
  
  getHistory: () =>
    api.get('/testplan/history'),
  
  getHistoryItem: (id: string) =>
    api.get(`/testplan/history/${id}`),
  
  export: (id: string, format: string) =>
    api.post(`/testplan/export/${id}`, { format })
}

export default api
