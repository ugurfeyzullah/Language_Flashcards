#!/bin/bash
# Language Flash Cards Server Startup Script

echo ""
echo "🚀 Starting Language Flash Cards Server..."
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed or not in PATH"
    echo "Please install Python 3.7+ and try again"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install requirements
echo "📥 Installing dependencies..."
pip install -r requirements.txt --quiet

# Start the server
echo ""
echo "🌐 Starting Flask server..."
echo "📱 Open http://localhost:5000 in your browser"
echo "⏹️  Press Ctrl+C to stop the server"
echo ""
python server.py
