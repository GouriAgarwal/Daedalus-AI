#!/bin/bash
# start.sh — Starts both FastAPI backend and Vite frontend concurrently.

# Exit on error
set -e

# Get the directory of start.sh
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=================================================="
echo "🚀 Starting Daedalus AI Co-Founder Platform..."
echo "=================================================="

# Function to kill child processes on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill "$BACKEND_PID" 2>/dev/null || true
    kill "$FRONTEND_PID" 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Start backend server
echo "⚡ Starting Backend (FastAPI on http://127.0.0.1:8000)..."
cd "$DIR/backend"
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Run uvicorn in background
uvicorn main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend health check..."
for i in {1..10}; do
    if curl -s http://127.0.0.1:8000/health >/dev/null; then
        echo "✓ Backend is alive!"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "❌ Backend failed to start. Check your virtualenv and requirements.txt."
        exit 1
    fi
    sleep 1
done

# 2. Start frontend server
echo "💻 Starting Frontend (Vite on http://localhost:5173)..."
cd "$DIR/Frontend"
npm run dev &
FRONTEND_PID=$!

# Keep running
echo "=================================================="
echo "✨ Platform is running successfully!"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend Docs: http://127.0.0.1:8000/docs"
echo "Press Ctrl+C to stop both servers."
echo "=================================================="

wait
