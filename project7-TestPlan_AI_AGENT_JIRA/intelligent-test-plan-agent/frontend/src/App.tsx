import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import { Settings, FileText, History, Play } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import SettingsPage from './pages/Settings'
import HistoryPage from './pages/History'

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-primary-700">Test Plan AI</h1>
            <p className="text-sm text-gray-500 mt-1">Intelligent Test Generator</p>
          </div>
          
          <nav className="p-4 space-y-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Play size={20} />
              <span>Generate</span>
            </NavLink>
            
            <NavLink
              to="/history"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <History size={20} />
              <span>History</span>
            </NavLink>
            
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Settings size={20} />
              <span>Settings</span>
            </NavLink>
          </nav>
          
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
            <div className="text-xs text-gray-500">
              <p>Shortcuts:</p>
              <p className="mt-1">Ctrl+Enter — Generate</p>
              <p>Ctrl+Shift+S — Save</p>
            </div>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
