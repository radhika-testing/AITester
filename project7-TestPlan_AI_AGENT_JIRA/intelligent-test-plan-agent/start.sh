#!/bin/bash

# Start script for macOS/Linux

echo -e "\033[32mStarting Intelligent Test Plan Generator...\033[0m"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "\033[31mError: Python 3 is not installed\033[0m"
    exit 1
fi

# Check if Node.js is installed
if ! command -v npm &> /dev/null; then
    echo -e "\033[31mError: Node.js is not installed\033[0m"
    exit 1
fi

# Setup backend
echo -e "\n\033[33mSetting up backend...\033[0m"
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "\033[36mCreating virtual environment...\033[0m"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "\033[36mActivating virtual environment...\033[0m"
source venv/bin/activate

# Install dependencies
echo -e "\033[36mInstalling Python dependencies...\033[0m"
pip install -q -r requirements.txt

# Start backend in background
echo -e "\033[32mStarting backend server...\033[0m"
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

cd ..

# Setup frontend
echo -e "\n\033[33mSetting up frontend...\033[0m"
cd frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "\033[36mInstalling Node.js dependencies...\033[0m"
    npm install
fi

# Start frontend in background
echo -e "\033[32mStarting frontend dev server...\033[0m"
npm run dev &
FRONTEND_PID=$!

cd ..

echo -e "\n\033[32m========================================"
echo "Application started successfully!"
echo "========================================"
echo -e "Frontend: http://localhost:5173"
echo -e "Backend:  http://localhost:8000"
echo -e "API Docs: http://localhost:8000/docs"
echo -e "========================================\033[0m"

# Wait for user input
echo -e "\nPress Ctrl+C to stop all servers"
wait
