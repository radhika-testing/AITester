import { useState, useEffect } from 'react'
import {
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Upload,
  FileText,
  Trash2,
  Server,
  Cloud,
  Database
} from 'lucide-react'
import { settingsApi, templatesApi } from '../services/api'

export default function SettingsPage() {
  // JIRA Settings
  const [jiraBaseUrl, setJiraBaseUrl] = useState('')
  const [jiraUsername, setJiraUsername] = useState('')
  const [jiraToken, setJiraToken] = useState('')
  const [jiraStatus, setJiraStatus] = useState<any>(null)
  const [testingJira, setTestingJira] = useState(false)

  // LLM Settings
  const [llmProvider, setLlmProvider] = useState('groq')
  const [groqApiKey, setGroqApiKey] = useState('')
  const [groqModel, setGroqModel] = useState('llama-3.3-70b-versatile')
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434')
  const [ollamaModel, setOllamaModel] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [llmStatus, setLlmStatus] = useState<any>(null)
  const [testingLLM, setTestingLLM] = useState(false)

  // Templates
  const [templates, setTemplates] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  // General
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadSettings()
    loadTemplates()
  }, [])

  const loadSettings = async () => {
    try {
      // Load JIRA status
      const jiraRes = await settingsApi.getJiraStatus()
      setJiraStatus(jiraRes.data)
      if (jiraRes.data.base_url) {
        setJiraBaseUrl(jiraRes.data.base_url)
      }

      // Load LLM status
      const llmRes = await settingsApi.getLLMStatus()
      setLlmStatus(llmRes.data)
      if (llmRes.data.configured) {
        setLlmProvider(llmRes.data.provider || 'groq')
        setGroqModel(llmRes.data.groq_model || 'llama-3.3-70b-versatile')
        setOllamaModel(llmRes.data.ollama_model || '')
        setTemperature(llmRes.data.temperature || 0.7)
      }
    } catch (err) {
      console.error('Failed to load settings', err)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await templatesApi.listTemplates()
      setTemplates(response.data.templates || [])
    } catch (err) {
      console.error('Failed to load templates', err)
    }
  }

  const saveJiraSettings = async () => {
    setMessage('')
    setError('')
    setTestingJira(true)

    try {
      await settingsApi.saveJiraConfig({
        base_url: jiraBaseUrl,
        username: jiraUsername,
        api_token: jiraToken
      })
      setMessage('JIRA configuration saved successfully')
      loadSettings()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save JIRA settings')
    } finally {
      setTestingJira(false)
    }
  }

  const saveLLMSettings = async () => {
    setMessage('')
    setError('')
    setTestingLLM(true)

    try {
      await settingsApi.saveLLMConfig({
        provider: llmProvider,
        groq_api_key: groqApiKey,
        groq_model: groqModel,
        ollama_base_url: ollamaUrl,
        ollama_model: ollamaModel,
        temperature: temperature
      })
      setMessage('LLM configuration saved successfully')
      loadSettings()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save LLM settings')
    } finally {
      setTestingLLM(false)
    }
  }

  const testLLMConnection = async () => {
    setTestingLLM(true)
    setMessage('')
    setError('')

    try {
      await settingsApi.testLLMConnection({
        provider: llmProvider,
        groq_api_key: groqApiKey,
        groq_model: groqModel,
        ollama_base_url: ollamaUrl,
        ollama_model: ollamaModel,
        temperature: temperature
      })
      setMessage(`${llmProvider === 'groq' ? 'Groq' : 'Ollama'} connection successful`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Connection test failed')
    } finally {
      setTestingLLM(false)
    }
  }

  const fetchOllamaModels = async () => {
    try {
      const response = await settingsApi.listOllamaModels(ollamaUrl)
      setOllamaModels(response.data.models)
      if (response.data.models.length > 0 && !ollamaModel) {
        setOllamaModel(response.data.models[0])
      }
    } catch (err) {
      setError('Failed to fetch Ollama models')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage('')
    setError('')

    try {
      await templatesApi.uploadTemplate(file)
      setMessage('Template uploaded successfully')
      loadTemplates()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload template')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const deleteTemplate = async (id: string) => {
    try {
      await templatesApi.deleteTemplate(id)
      loadTemplates()
    } catch (err) {
      setError('Failed to delete template')
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">Configure your integrations and preferences</p>
      </header>

      {/* Status Messages */}
      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
          <CheckCircle size={20} />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* JIRA Configuration */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">JIRA Configuration</h3>
              <p className="text-sm text-gray-500">Connect to your JIRA instance</p>
            </div>
            {jiraStatus?.connected && (
              <span className="ml-auto px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full flex items-center gap-1">
                <CheckCircle size={14} /> Connected
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">JIRA Base URL</label>
              <input
                type="url"
                value={jiraBaseUrl}
                onChange={(e) => setJiraBaseUrl(e.target.value)}
                placeholder="https://your-domain.atlassian.net"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username / Email</label>
              <input
                type="email"
                value={jiraUsername}
                onChange={(e) => setJiraUsername(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
              <input
                type="password"
                value={jiraToken}
                onChange={(e) => setJiraToken(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={saveJiraSettings}
              disabled={testingJira}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
            >
              {testingJira ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Save JIRA Settings
            </button>
          </div>
        </div>

        {/* LLM Configuration */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Server className="text-purple-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">LLM Provider</h3>
              <p className="text-sm text-gray-500">Configure AI model settings</p>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setLlmProvider('groq')}
              className={`flex-1 p-4 border rounded-lg flex items-center gap-3 transition-colors ${
                llmProvider === 'groq'
                  ? 'border-primary-500 bg-primary-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <Cloud size={24} className={llmProvider === 'groq' ? 'text-primary-600' : 'text-gray-400'} />
              <div className="text-left">
                <div className={`font-medium ${llmProvider === 'groq' ? 'text-primary-700' : 'text-gray-700'}`}>
                  Groq (Cloud)
                </div>
                <div className="text-sm text-gray-500">Fast cloud inference</div>
              </div>
            </button>
            <button
              onClick={() => setLlmProvider('ollama')}
              className={`flex-1 p-4 border rounded-lg flex items-center gap-3 transition-colors ${
                llmProvider === 'ollama'
                  ? 'border-primary-500 bg-primary-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <Server size={24} className={llmProvider === 'ollama' ? 'text-primary-600' : 'text-gray-400'} />
              <div className="text-left">
                <div className={`font-medium ${llmProvider === 'ollama' ? 'text-primary-700' : 'text-gray-700'}`}>
                  Ollama (Local)
                </div>
                <div className="text-sm text-gray-500">Run models locally</div>
              </div>
            </button>
          </div>

          {/* Groq Settings */}
          {llmProvider === 'groq' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Groq API Key</label>
                <input
                  type="password"
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <select
                  value={groqModel}
                  onChange={(e) => setGroqModel(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
                  <option value="llama-3.1-8b-instant">Llama 3.1 8B</option>
                  <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                  <option value="gemma2-9b-it">Gemma 2 9B</option>
                </select>
              </div>
            </div>
          )}

          {/* Ollama Settings */}
          {llmProvider === 'ollama' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ollama Base URL</label>
                <input
                  type="url"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <select
                    value={ollamaModel}
                    onChange={(e) => setOllamaModel(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    {ollamaModels.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={fetchOllamaModels}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Temperature */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temperature: {temperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Deterministic</span>
              <span>Creative</span>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={testLLMConnection}
              disabled={testingLLM}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {testingLLM ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={saveLLMSettings}
              disabled={testingLLM}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={18} />
              Save LLM Settings
            </button>
          </div>
        </div>

        {/* Templates */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="text-orange-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Test Plan Templates</h3>
              <p className="text-sm text-gray-500">Upload PDF templates for test plan structure</p>
            </div>
          </div>

          {/* Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="template-upload"
            />
            <label
              htmlFor="template-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="text-gray-400 mb-3" size={40} />
              <span className="text-gray-700 font-medium">Click to upload PDF template</span>
              <span className="text-gray-500 text-sm mt-1">Max file size: 5MB</span>
            </label>
            {uploading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-primary-600">
                <Loader2 className="animate-spin" size={18} />
                <span>Uploading...</span>
              </div>
            )}
          </div>

          {/* Template List */}
          {templates.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Uploaded Templates</h4>
              <div className="space-y-2">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">{t.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(t.uploaded_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTemplate(t.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
