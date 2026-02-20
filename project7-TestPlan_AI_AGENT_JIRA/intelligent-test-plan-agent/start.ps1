# Start script for Windows PowerShell

Write-Host "Starting Intelligent Test Plan Generator..." -ForegroundColor Green

# Check if Python is installed
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Python is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Setup backend
Write-Host "`nSetting up backend..." -ForegroundColor Yellow
Set-Location backend

# Create virtual environment if it doesn't exist
if (!(Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Cyan
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& .\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
pip install -q -r requirements.txt

# Start backend in a new window
Write-Host "Starting backend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; .\venv\Scripts\Activate.ps1; uvicorn main:app --reload --port 8000; Read-Host 'Press Enter to close'"

Set-Location ..

# Setup frontend
Write-Host "`nSetting up frontend..." -ForegroundColor Yellow
Set-Location frontend

# Install dependencies if node_modules doesn't exist
if (!(Test-Path "node_modules")) {
    Write-Host "Installing Node.js dependencies..." -ForegroundColor Cyan
    npm install
}

# Start frontend in a new window
Write-Host "Starting frontend dev server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; npm run dev; Read-Host 'Press Enter to close'"

Set-Location ..

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Application started successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nPress any key to close this window..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
