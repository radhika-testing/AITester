import { useState, useEffect } from 'react'
import {
  Clock,
  ChevronRight,
  FileText,
  Download,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { testPlanApi } from '../services/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface HistoryItem {
  id: string
  ticket_id: string
  ticket_summary: string
  generated_at: string
  provider_used: string
}

interface TestPlanDetail {
  id: string
  ticket_id: string
  ticket_summary: string
  test_plan: {
    title: string
    source_issue: string
    generated_at: string
    test_cases: any[]
    metadata: {
      total_tests: number
      provider: string
      model: string
    }
  }
  generated_at: string
  provider_used: string
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [selectedItem, setSelectedItem] = useState<TestPlanDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const response = await testPlanApi.getHistory()
      setHistory(response.data.history || [])
    } catch (err) {
      console.error('Failed to load history', err)
    } finally {
      setLoading(false)
    }
  }

  const loadDetail = async (id: string) => {
    setDetailLoading(true)
    try {
      const response = await testPlanApi.getHistoryItem(id)
      setSelectedItem(response.data)
    } catch (err) {
      console.error('Failed to load detail', err)
    } finally {
      setDetailLoading(false)
    }
  }

  const exportItem = async (id: string, format: string) => {
    try {
      const response = await testPlanApi.export(id, format)
      const { content, filename } = response.data
      
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed', err)
    }
  }

  const convertToMarkdown = (plan: any): string => {
    let md = `# ${plan.title}\n\n`
    md += `**Source:** ${plan.source_issue}\n\n`
    md += `**Total Test Cases:** ${plan.metadata.total_tests}\n\n`
    md += `---\n\n`
    
    plan.test_cases.forEach((tc: any) => {
      md += `## ${tc.id}: ${tc.title}\n\n`
      md += `**Type:** ${tc.test_type} | **Priority:** ${tc.priority}\n\n`
      md += `**Description:** ${tc.description}\n\n`
      
      if (tc.preconditions?.length) {
        md += `### Preconditions\n`
        tc.preconditions.forEach((pre: string) => md += `- ${pre}\n`)
        md += `\n`
      }
      
      if (tc.steps?.length) {
        md += `### Steps\n`
        tc.steps.forEach((step: string, i: number) => md += `${i + 1}. ${step}\n`)
        md += `\n`
      }
      
      if (tc.expected_results?.length) {
        md += `### Expected Results\n`
        tc.expected_results.forEach((er: string) => md += `- ${er}\n`)
        md += `\n`
      }
      
      md += `---\n\n`
    })
    
    return md
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">History</h2>
        <p className="text-gray-600 mt-1">View and export previously generated test plans</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* History List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-medium text-gray-900">Recent Generations</h3>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                Loading...
              </div>
            ) : history.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Clock size={40} className="mx-auto mb-3 text-gray-300" />
                <p>No history yet</p>
                <p className="text-sm mt-1">Generate your first test plan to see it here</p>
              </div>
            ) : (
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadDetail(item.id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedItem?.id === item.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                        {item.ticket_id}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {item.provider_used}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium line-clamp-2">
                      {item.ticket_summary}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.generated_at).toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2">
          {detailLoading ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <Loader2 className="animate-spin mx-auto mb-2" size={24} />
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : selectedItem ? (
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                        {selectedItem.ticket_id}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full capitalize">
                        {selectedItem.provider_used}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedItem.test_plan.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedItem.test_plan.metadata.total_tests} test cases • {selectedItem.test_plan.metadata.model}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportItem(selectedItem.id, 'markdown')}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
                    >
                      <FileText size={16} />
                      Markdown
                    </button>
                    <button
                      onClick={() => exportItem(selectedItem.id, 'json')}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 text-sm"
                    >
                      <Download size={16} />
                      JSON
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 max-h-[600px] overflow-y-auto">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {convertToMarkdown(selectedItem.test_plan)}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <FileText size={64} className="mx-auto mb-4 text-gray-200" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a test plan</h3>
              <p className="text-gray-500">Click on an item from the history to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
