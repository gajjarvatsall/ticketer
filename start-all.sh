#!/bin/bash

# Event Ticketing Platform - Quick Start Script
# This script will start all microservices for local development

echo "🚀 Starting Event Ticketing Platform Microservices..."
echo ""

# Check if MongoDB is running
echo "Checking MongoDB..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running!"
    echo "Please start MongoDB first:"
    echo "  - macOS: brew services start mongodb-community"
    echo "  - Linux: sudo systemctl start mongod"
    echo "  - Or run: mongod --dbpath /path/to/data"
    echo ""
    read -p "Press enter once MongoDB is running..."
fi

# Function to start a service in a new terminal tab/window
start_service() {
    service_name=$1
    service_dir=$2
    port=$3
    
    echo "Starting $service_name on port $port..."
    
    # For macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript <<EOF
tell application "Terminal"
    do script "cd '$service_dir' && npm run dev"
end tell
EOF
    # For Linux with gnome-terminal
    elif command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "cd '$service_dir' && npm run dev; exec bash"
    # For Linux with xterm
    elif command -v xterm &> /dev/null; then
        xterm -e "cd '$service_dir' && npm run dev" &
    else
        echo "Please open a new terminal and run: cd $service_dir && npm run dev"
    fi
}

# Get the absolute path of the project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "📦 Installing dependencies (this may take a few minutes)..."
cd "$PROJECT_ROOT/auth" && npm install --silent
cd "$PROJECT_ROOT/event" && npm install --silent
cd "$PROJECT_ROOT/ticket" && npm install --silent
cd "$PROJECT_ROOT/payment" && npm install --silent
cd "$PROJECT_ROOT" && npm install --silent

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "🎬 Starting services..."
echo ""

# Start each service in a new terminal
start_service "Auth Service" "$PROJECT_ROOT/auth" "3001"
sleep 2

start_service "Event Service" "$PROJECT_ROOT/event" "3002"
sleep 2

start_service "Ticket Service" "$PROJECT_ROOT/ticket" "3003"
sleep 2

start_service "Payment Service" "$PROJECT_ROOT/payment" "3004"
sleep 2

start_service "Frontend (Vite)" "$PROJECT_ROOT" "5173"

echo ""
echo "✅ All services are starting!"
echo ""
echo "📝 Service URLs:"
echo "  - Frontend:        http://localhost:5173"
echo "  - Auth Service:    http://localhost:3001"
echo "  - Event Service:   http://localhost:3002"
echo "  - Ticket Service:  http://localhost:3003"
echo "  - Payment Service: http://localhost:3004"
echo ""
echo "⏱️  Please wait 10-15 seconds for all services to initialize..."
echo ""
echo "🌐 The application will open automatically in your browser."
echo ""
echo "💡 To stop all services, close all the terminal windows."
echo ""

# Wait a bit then open browser
sleep 10
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:5173
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:5173 2>/dev/null || echo "Please open http://localhost:5173 in your browser"
fi

echo "✨ Setup complete! Happy coding!"
