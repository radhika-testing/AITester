// Test Case Generator - Groq API Integration
// ===========================================

// Configuration
const CONFIG = {
    API_URL: 'https://api.groq.com/openai/v1/chat/completions',
    STORAGE_KEY: 'testCaseGenerator_history',
    API_KEY_STORAGE: 'testCaseGenerator_apiKey'
};

// DOM Elements
const elements = {
    apiKey: document.getElementById('apiKey'),
    toggleApiKey: document.getElementById('toggleApiKey'),
    featureQuery: document.getElementById('featureQuery'),
    testType: document.getElementById('testType'),
    outputFormat: document.getElementById('outputFormat'),
    model: document.getElementById('model'),
    generateBtn: document.getElementById('generateBtn'),
    btnText: document.querySelector('.btn-text'),
    spinner: document.querySelector('.spinner'),
    resultsSection: document.getElementById('resultsSection'),
    resultsContent: document.getElementById('resultsContent'),
    resultsCode: document.getElementById('resultsCode'),
    copyBtn: document.getElementById('copyBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    regenerateBtn: document.getElementById('regenerateBtn'),
    historySection: document.getElementById('historySection'),
    historyList: document.getElementById('historyList'),
    clearHistory: document.getElementById('clearHistory'),
    toast: document.getElementById('toast')
};

// State
let currentResult = '';
let isGenerating = false;

// Initialize
function init() {
    loadSavedApiKey();
    loadHistory();
    setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
    // Toggle API Key visibility
    elements.toggleApiKey.addEventListener('click', toggleApiKeyVisibility);
    
    // Generate test cases
    elements.generateBtn.addEventListener('click', handleGenerate);
    
    // Copy results
    elements.copyBtn.addEventListener('click', copyResults);
    
    // Download results
    elements.downloadBtn.addEventListener('click', downloadResults);
    
    // Regenerate
    elements.regenerateBtn.addEventListener('click', handleGenerate);
    
    // Clear history
    elements.clearHistory.addEventListener('click', clearHistory);
    
    // Save API key when changed
    elements.apiKey.addEventListener('change', saveApiKey);
    
    // Enter key to generate (Ctrl+Enter)
    elements.featureQuery.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            handleGenerate();
        }
    });
}

// Toggle API Key visibility
function toggleApiKeyVisibility() {
    const type = elements.apiKey.type === 'password' ? 'text' : 'password';
    elements.apiKey.type = type;
    
    // Update icon
    const svg = type === 'password' 
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
           </svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
           </svg>`;
    
    elements.toggleApiKey.innerHTML = svg;
}

// Save API Key to localStorage
function saveApiKey() {
    const apiKey = elements.apiKey.value.trim();
    if (apiKey) {
        localStorage.setItem(CONFIG.API_KEY_STORAGE, apiKey);
    }
}

// Load saved API Key
function loadSavedApiKey() {
    const savedKey = localStorage.getItem(CONFIG.API_KEY_STORAGE);
    if (savedKey) {
        elements.apiKey.value = savedKey;
    }
}

// Handle Generate Button Click
async function handleGenerate() {
    if (isGenerating) return;
    
    const apiKey = elements.apiKey.value.trim();
    const query = elements.featureQuery.value.trim();
    
    // Validation
    if (!apiKey) {
        showToast('Please enter your Groq API key', 'error');
        elements.apiKey.focus();
        return;
    }
    
    if (!query) {
        showToast('Please describe the feature you want to test', 'error');
        elements.featureQuery.focus();
        return;
    }
    
    if (!apiKey.startsWith('gsk_')) {
        showToast('Invalid API key format. Groq keys start with "gsk_"', 'error');
        return;
    }
    
    // Start generation
    setGenerating(true);
    
    try {
        const testType = elements.testType.value;
        const outputFormat = elements.outputFormat.value;
        const model = elements.model.value;
        
        const prompt = buildPrompt(query, testType, outputFormat);
        const result = await callGroqAPI(apiKey, prompt, model);
        
        currentResult = result;
        displayResults(result, outputFormat);
        addToHistory(query, testType, outputFormat, result);
        
        showToast('Test cases generated successfully!', 'success');
    } catch (error) {
        console.error('Generation error:', error);
        showToast(error.message || 'Failed to generate test cases', 'error');
    } finally {
        setGenerating(false);
    }
}

// Build the prompt for Groq
function buildPrompt(query, testType, outputFormat) {
    const testTypeDescriptions = {
        functional: 'functional testing (testing features against requirements)',
        unit: 'unit testing (testing individual components/functions)',
        integration: 'integration testing (testing how components work together)',
        e2e: 'end-to-end testing (testing complete user workflows)',
        api: 'API testing (testing endpoints and responses)',
        ui: 'UI/UX testing (testing user interface and experience)',
        security: 'security testing (testing vulnerabilities and protections)',
        performance: 'performance testing (testing speed and load handling)',
        all: 'comprehensive testing covering all types'
    };

    const formatInstructions = {
        structured: `Generate test cases in a clear structured format with:
- Test Case ID
- Test Scenario
- Pre-conditions
- Test Steps (numbered)
- Expected Result
- Priority (High/Medium/Low)`,
        gherkin: `Generate test cases using Gherkin syntax (Given/When/Then format).
Each test case should follow:
Feature: [Feature name]
  Scenario: [Scenario description]
    Given [precondition]
    When [action]
    Then [expected result]`,
        markdown: `Generate test cases in Markdown format with proper headings, tables, and formatting.
Include sections for Overview, Test Cases (in table format), and Notes.`,
        json: `Generate test cases as a JSON array. Each test case should be an object with properties:
- id
- title
- description
- preconditions
- steps (array)
- expectedResult
- priority
- type`,
        csv: `Generate test cases in CSV format with the following columns:
Test ID,Test Scenario,Pre-conditions,Test Steps,Expected Result,Priority,Status`
    };

    return `You are an expert QA engineer specializing in test case design. Your task is to generate comprehensive, well-structured test cases.

FEATURE TO TEST:
"""${query}"""

TEST TYPE: ${testTypeDescriptions[testType]}

OUTPUT FORMAT INSTRUCTIONS:
${formatInstructions[outputFormat]}

REQUIREMENTS:
1. Generate at least 10-15 test cases covering happy paths, edge cases, and error scenarios
2. Include both positive and negative test cases
3. Make test steps clear, specific, and actionable
4. Ensure expected results are verifiable
5. Prioritize test cases based on criticality
6. For ${testType} testing, focus on the specific aspects relevant to this test type
7. Be thorough and think about all possible scenarios a user might encounter

Please generate the test cases now:`;
}

// Call Groq API
async function callGroqAPI(apiKey, prompt, model) {
    const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful QA assistant that generates comprehensive test cases.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 4096
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP error! status: ${response.status}`;
        
        if (response.status === 401) {
            throw new Error('Invalid API key. Please check your Groq API key.');
        } else if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (response.status === 500) {
            throw new Error('Groq API server error. Please try again later.');
        }
        
        throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response generated';
}

// Display Results
function displayResults(content, format) {
    elements.resultsCode.textContent = content;
    
    // Apply syntax highlighting based on format
    let language = 'plaintext';
    switch (format) {
        case 'json':
            language = 'json';
            break;
        case 'markdown':
            language = 'markdown';
            break;
        case 'gherkin':
            language = 'gherkin';
            break;
    }
    
    elements.resultsCode.className = `language-${language}`;
    hljs.highlightElement(elements.resultsCode);
    
    elements.resultsSection.classList.remove('hidden');
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Set Generating State
function setGenerating(generating) {
    isGenerating = generating;
    elements.generateBtn.disabled = generating;
    
    if (generating) {
        elements.btnText.classList.add('hidden');
        elements.spinner.classList.remove('hidden');
    } else {
        elements.btnText.classList.remove('hidden');
        elements.spinner.classList.add('hidden');
    }
}

// Copy Results to Clipboard
async function copyResults() {
    if (!currentResult) return;
    
    try {
        await navigator.clipboard.writeText(currentResult);
        showToast('Copied to clipboard!', 'success');
    } catch (err) {
        showToast('Failed to copy', 'error');
    }
}

// Download Results
function downloadResults() {
    if (!currentResult) return;
    
    const format = elements.outputFormat.value;
    const extensionMap = {
        structured: 'txt',
        gherkin: 'feature',
        markdown: 'md',
        json: 'json',
        csv: 'csv'
    };
    
    const extension = extensionMap[format] || 'txt';
    const mimeType = {
        json: 'application/json',
        csv: 'text/csv',
        md: 'text/markdown',
        feature: 'text/plain',
        txt: 'text/plain'
    }[extension] || 'text/plain';
    
    const blob = new Blob([currentResult], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.href = url;
    a.download = `test-cases-${timestamp}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('File downloaded!', 'success');
}

// History Management
function addToHistory(query, testType, format, result) {
    const history = getHistory();
    const item = {
        id: Date.now(),
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        testType,
        format,
        result,
        timestamp: new Date().toISOString()
    };
    
    history.unshift(item);
    
    // Keep only last 10 items
    if (history.length > 10) {
        history.pop();
    }
    
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(history));
    renderHistory();
}

function getHistory() {
    try {
        return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function loadHistory() {
    renderHistory();
}

function renderHistory() {
    const history = getHistory();
    
    if (history.length === 0) {
        elements.historySection.classList.add('hidden');
        return;
    }
    
    elements.historySection.classList.remove('hidden');
    
    elements.historyList.innerHTML = history.map(item => {
        const date = new Date(item.timestamp);
        const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="history-item" data-id="${item.id}">
                <div class="history-item-header">
                    <div class="history-item-title">${escapeHtml(item.query)}</div>
                    <div class="history-item-time">${timeStr}</div>
                </div>
                <div class="history-item-meta">
                    <span class="history-item-type">${item.testType}</span>
                    <span class="history-item-format">${item.format}</span>
                </div>
            </div>
        `;
    }).join('');
    
    // Add click handlers
    elements.historyList.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => loadHistoryItem(item.dataset.id));
    });
}

function loadHistoryItem(id) {
    const history = getHistory();
    const item = history.find(h => h.id == id);
    
    if (item) {
        elements.featureQuery.value = item.query.replace('...', '');
        elements.testType.value = item.testType;
        elements.outputFormat.value = item.format;
        currentResult = item.result;
        displayResults(item.result, item.format);
        showToast('Loaded from history', 'success');
    }
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all history?')) {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        renderHistory();
        showToast('History cleared', 'success');
    }
}

// Toast Notification
function showToast(message, type = 'info') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type}`;
    
    setTimeout(() => {
        elements.toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize the app
init();
