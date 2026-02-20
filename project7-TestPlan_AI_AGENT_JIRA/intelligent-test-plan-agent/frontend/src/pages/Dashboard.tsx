import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Loader2,
  FileText,
  Download,
  Copy,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Clock,
  Tag,
  User,
  ChevronRight,
  BookOpen,
  Target,
  Shield,
  Server,
  Calendar,
  Users,
  AlertTriangle,
  CheckSquare,
  ListChecks
} from 'lucide-react'
import { jiraApi, testPlanApi, templatesApi } from '../services/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface JiraIssue {
  key: string
  summary: string
  description: string
  issue_type: string
  priority: string
  status: string
  assignee?: string
  labels: string[]
  components: string[]
  acceptance_criteria?: string
}

interface TestCase {
  id: string
  title: string
  description: string
  preconditions: string[]
  steps: string[]
  expected_results: string[]
  priority: string
  test_type: string
}

interface RiskItem {
  description: string
  impact: string
  mitigation: string
}

interface TestSchedule {
  phase: string
  duration: string
  activities: string[]
}

interface ResourceRequirement {
  type: string
  description: string
  quantity?: string
}

interface ComprehensiveTestPlan {
  title: string
  source_issue: string
  generated_at: string
  
  // Comprehensive sections
  executive_summary: string
  scope_objectives: string
  test_strategy: string
  test_environment: string
  entry_criteria: string[]
  exit_criteria: string[]
  risks_mitigations: RiskItem[]
  test_schedule: TestSchedule[]
  resource_requirements: ResourceRequirement[]
  
  // Test cases
  test_cases: TestCase[]
  
  metadata: {
    total_tests: number
    provider: string
    model: string
    comprehensive: boolean
  }
}

export default function Dashboard() {
  const [ticketId, setTicketId] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [issue, setIssue] = useState<JiraIssue | null>(null)
  const [testPlan, setTestPlan] = useState<ComprehensiveTestPlan | null>(null)
  const [recentTickets, setRecentTickets] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('groq')
  const [copied, setCopied] = useState(false)
  const [progress, setProgress] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'testcases' | 'risks' | 'schedule'>('overview')

  useEffect(() => {
    loadRecentTickets()
    loadTemplates()
  }, [])

  const loadRecentTickets = async () => {
    try {
      const response = await jiraApi.getRecentTickets()
      setRecentTickets(response.data.tickets || [])
    } catch (err) {
      console.error('Failed to load recent tickets', err)
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

  const fetchTicket = async () => {
    if (!ticketId.trim()) {
      setError('Please enter a ticket ID')
      return
    }

    setLoading(true)
    setError('')
    setIssue(null)
    setTestPlan(null)

    try {
      const response = await jiraApi.fetchTicket(ticketId.trim().toUpperCase())
      setIssue(response.data.issue)
      loadRecentTickets()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch ticket')
    } finally {
      setLoading(false)
    }
  }

  const generateTestPlan = async () => {
    if (!issue) return

    setGenerating(true)
    setError('')
    setProgress('Initializing...')

    try {
      setProgress('Analyzing ticket context...')
      await new Promise(r => setTimeout(r, 500))
      
      setProgress('Generating comprehensive test plan with AI...')
      const response = await testPlanApi.generate({
        ticket_id: issue.key,
        template_id: selectedTemplate || undefined,
        provider: selectedProvider,
        comprehensive: true
      })

      setTestPlan(response.data.test_plan)
      setActiveTab('overview')
      setProgress('')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate test plan')
      setProgress('')
    } finally {
      setGenerating(false)
    }
  }

  const exportTestPlan = async (format: string) => {
    if (!testPlan) return
    
    try {
      // Get history ID from the test plan
      const historyResponse = await testPlanApi.getHistory()
      const historyItem = historyResponse.data.history.find(
        (h: any) => h.ticket_id === testPlan.source_issue
      )
      
      if (historyItem) {
        const response = await testPlanApi.export(historyItem.id, format)
        const { content, filename } = response.data
        
        // Download file
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Export failed', err)
    }
  }

  const copyToClipboard = () => {
    if (!testPlan) return
    
    const markdown = convertToMarkdown(testPlan)
    navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const convertToMarkdown = (plan: ComprehensiveTestPlan): string => {
    let md = `# ${plan.title}\n\n`
    md += `**Source:** ${plan.source_issue}\n\n`
    md += `**Total Test Cases:** ${plan.metadata.total_tests}\n\n`
    
    md += `## Executive Summary\n\n${plan.executive_summary}\n\n`
    md += `## Scope & Objectives\n\n${plan.scope_objectives}\n\n`
    md += `## Test Strategy\n\n${plan.test_strategy}\n\n`
    md += `## Test Environment\n\n${plan.test_environment}\n\n`
    
    md += `## Entry Criteria\n`
    plan.entry_criteria.forEach(c => md += `- ${c}\n`)
    md += `\n`
    
    md += `## Exit Criteria\n`
    plan.exit_criteria.forEach(c => md += `- ${c}\n`)
    md += `\n`
    
    md += `## Test Cases\n\n`
    plan.test_cases.forEach(tc => {
      md += `### ${tc.id}: ${tc.title}\n\n`
      md += `**Type:** ${tc.test_type} | **Priority:** ${tc.priority}\n\n`
      md += `**Description:** ${tc.description}\n\n`
      
      if (tc.preconditions.length) {
        md += `**Preconditions:**\n`
        tc.preconditions.forEach(pre => md += `- ${pre}\n`)
        md += `\n`
      }
      
      if (tc.steps.length) {
        md += `**Steps:**\n`
        tc.steps.forEach((step, i) => md += `${i + 1}. ${step}\n`)
        md += `\n`
      }
      
      if (tc.expected_results.length) {
        md += `**Expected Results:**\n`
        tc.expected_results.forEach(er => md += `- ${er}\n`)
        md += `\n`
      }
    })
    
    return md
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter' && issue && !generating) {
        generateTestPlan()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [issue, generating])

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Generate Test Plan</h2>
        <p className="text-gray-600 mt-1">Fetch a JIRA ticket and generate a comprehensive test plan using AI</p>
      </header>

      {/* Ticket Input */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          JIRA Ticket ID
        </label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              placeholder="e.g., PROJECT-123"
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none uppercase"
              onKeyDown={(e) => e.key === 'Enter' && fetchTicket()}
            />
          </div>
          <button
            onClick={fetchTicket}
            disabled={loading}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
            Fetch Ticket
          </button>
        </div>

        {/* Recent Tickets */}
        {recentTickets.length > 0 && (
          <div className="mt-4">
            <span className="text-sm text-gray-500">Recent:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {recentTickets.map((ticket) => (
                <button
                  key={ticket.ticket_id}
                  onClick={() => {
                    setTicketId(ticket.ticket_id)
                    fetchTicket()
                  }}
                  className="px-3 py-1 bg-gray-100 text-sm text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {ticket.ticket_id}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Ticket Display */}
      {issue && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                  {issue.key}
                </span>
                <span className={`px-3 py-1 text-sm rounded-full ${
                  issue.priority === 'High' ? 'bg-red-100 text-red-700' :
                  issue.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {issue.priority}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {issue.issue_type}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{issue.summary}</h3>
            </div>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
              {issue.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            {issue.assignee && (
              <div className="flex items-center gap-2 text-gray-600">
                <User size={16} />
                <span>Assignee: {issue.assignee}</span>
              </div>
            )}
            {issue.labels.length > 0 && (
              <div className="flex items-center gap-2 text-gray-600">
                <Tag size={16} />
                <span>Labels: {issue.labels.join(', ')}</span>
              </div>
            )}
          </div>

          <div className="prose prose-sm max-w-none mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Description:</h4>
            <p className="text-gray-600 whitespace-pre-wrap">{issue.description}</p>
          </div>

          {issue.acceptance_criteria && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-green-800 mb-2">Acceptance Criteria:</h4>
              <p className="text-green-700 text-sm whitespace-pre-wrap">{issue.acceptance_criteria}</p>
            </div>
          )}

          {/* Generation Controls */}
          <div className="border-t pt-4">
            <div className="flex flex-wrap items-end gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LLM Provider</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="groq">Groq (Cloud)</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template (Optional)</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="">No Template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={generateTestPlan}
                disabled={generating}
                className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium ml-auto"
              >
                {generating ? (
                  <><Loader2 className="animate-spin" size={20} /> {progress}</>
                ) : (
                  <><Sparkles size={20} /> Generate Comprehensive Test Plan</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Plan Output */}
      {testPlan && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{testPlan.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                Generated using {testPlan.metadata.provider} ({testPlan.metadata.model}) • {testPlan.metadata.total_tests} test cases
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                {copied ? <CheckCircle size={16} className="text-green-600" /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={() => exportTestPlan('markdown')}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                <FileText size={16} />
                Export MD
              </button>
              <button
                onClick={() => exportTestPlan('json')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 text-sm"
              >
                <Download size={16} />
                Export JSON
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b mb-6">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <BookOpen size={16} className="inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('testcases')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'testcases'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <ListChecks size={16} className="inline mr-2" />
                Test Cases ({testPlan.test_cases.length})
              </button>
              <button
                onClick={() => setActiveTab('risks')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'risks'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <AlertTriangle size={16} className="inline mr-2" />
                Risks
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'schedule'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar size={16} className="inline mr-2" />
                Schedule
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Executive Summary */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="flex items-center gap-2 text-lg font-medium text-blue-900 mb-2">
                    <BookOpen size={20} />
                    Executive Summary
                  </h4>
                  <div className="text-blue-800 prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {testPlan.executive_summary}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Scope & Objectives */}
                <div>
                  <h4 className="flex items-center gap-2 text-lg font-medium text-gray-900 mb-3">
                    <Target size={20} />
                    Scope & Objectives
                  </h4>
                  <div className="prose prose-sm max-w-none text-gray-600">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {testPlan.scope_objectives}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Test Strategy */}
                <div>
                  <h4 className="flex items-center gap-2 text-lg font-medium text-gray-900 mb-3">
                    <Shield size={20} />
                    Test Strategy
                  </h4>
                  <div className="prose prose-sm max-w-none text-gray-600">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {testPlan.test_strategy}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Test Environment */}
                <div>
                  <h4 className="flex items-center gap-2 text-lg font-medium text-gray-900 mb-3">
                    <Server size={20} />
                    Test Environment
                  </h4>
                  <div className="prose prose-sm max-w-none text-gray-600">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {testPlan.test_environment}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Entry & Exit Criteria */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="flex items-center gap-2 font-medium text-green-900 mb-3">
                      <CheckSquare size={18} />
                      Entry Criteria
                    </h4>
                    <ul className="space-y-2">
                      {testPlan.entry_criteria.map((criteria, i) => (
                        <li key={i} className="flex items-start gap-2 text-green-800 text-sm">
                          <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
                          {criteria}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h4 className="flex items-center gap-2 font-medium text-orange-900 mb-3">
                      <CheckCircle size={18} />
                      Exit Criteria
                    </h4>
                    <ul className="space-y-2">
                      {testPlan.exit_criteria.map((criteria, i) => (
                        <li key={i} className="flex items-start gap-2 text-orange-800 text-sm">
                          <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
                          {criteria}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Resource Requirements */}
                <div>
                  <h4 className="flex items-center gap-2 text-lg font-medium text-gray-900 mb-3">
                    <Users size={20} />
                    Resource Requirements
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {testPlan.resource_requirements.map((resource, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2 text-sm text-gray-900">{resource.type}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{resource.description}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">{resource.quantity || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Test Cases Tab */}
            {activeTab === 'testcases' && (
              <div className="space-y-4">
                {testPlan.test_cases.map((tc) => (
                  <div key={tc.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-primary-600 font-mono font-medium">{tc.id}</span>
                        <h4 className="font-medium text-gray-900">{tc.title}</h4>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          tc.priority === 'High' ? 'bg-red-100 text-red-700' :
                          tc.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {tc.priority}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {tc.test_type}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-3">{tc.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {tc.preconditions.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1">Preconditions</h5>
                          <ul className="text-gray-600 space-y-1">
                            {tc.preconditions.map((pre, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <ChevronRight size={14} className="mt-0.5 text-gray-400" />
                                {pre}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {tc.steps.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1">Steps</h5>
                          <ol className="text-gray-600 space-y-1">
                            {tc.steps.map((step, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-gray-400 font-mono">{i + 1}.</span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {tc.expected_results.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-700 mb-1">Expected Results</h5>
                          <ul className="text-gray-600 space-y-1">
                            {tc.expected_results.map((er, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle size={14} className="mt-0.5 text-green-500" />
                                {er}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Risks Tab */}
            {activeTab === 'risks' && (
              <div className="space-y-4">
                {testPlan.risks_mitigations.map((risk, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{risk.description}</h4>
                      <span className={`px-2 py-1 text-xs rounded ${
                        risk.impact === 'High' ? 'bg-red-100 text-red-700' :
                        risk.impact === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {risk.impact} Impact
                      </span>
                    </div>
                    <div className="bg-blue-50 rounded p-3">
                      <span className="text-sm font-medium text-blue-900">Mitigation: </span>
                      <span className="text-sm text-blue-800">{risk.mitigation}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <div className="space-y-4">
                {testPlan.test_schedule.map((phase, i) => (
                  <div key={i} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{phase.phase}</h4>
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock size={14} />
                        {phase.duration}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {phase.activities.map((activity, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                          <ChevronRight size={14} className="mt-0.5 text-gray-400" />
                          {activity}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
