#!/bin/bash

echo "🚀 Starting Ticketer Microservices..."
echo "======================================"

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  Warning: MongoDB doesn't appear to be running."
    echo "   Please start MongoDB before continuing."
    echo "   Example: sudo systemctl start mongod"
    read -p "Press Enter to continue anyway or Ctrl+C to exit..."
fi

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "⚠️  Warning: Port $1 is already in use!"
        return 1
    fi
    return 0
}

# Check if ports are available
echo ""
echo "Checking ports..."
check_port 3001 || echo "   Auth service port (3001) may be in use"
check_port 3002 || echo "   Event service port (3002) may be in use"
check_port 3003 || echo "   Ticket service port (3003) may be in use"
check_port 3004 || echo "   Payment service port (3004) may be in use"
check_port 5173 || echo "   Frontend port (5173) may be in use"

echo ""
echo "📦 Installing dependencies if needed..."

# Check and install dependencies for each service
for service in auth event ticket payment; do
    if [ ! -d "$service/node_modules" ]; then
        echo "Installing dependencies for $service service..."
        cd $service && npm install && cd ..
    fi
done

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies for frontend..."
    npm install
fi

echo ""
echo "✅ All dependencies installed!"
echo ""
echo "🔥 Starting services..."
echo "   This will open 5 terminal tabs/windows"
echo "   Press Ctrl+C in each terminal to stop the services"
echo ""

# Detect the operating system and terminal
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - use osascript to open new Terminal tabs
    echo "Starting services on macOS..."
    
    osascript -e 'tell application "Terminal"
        activate
        do script "cd '$(pwd)'/auth && echo \"🔐 Auth Service (Port 3001)\" && npm start"
    end tell'
    
    sleep 1
    
    osascript -e 'tell application "Terminal"
        do script "cd '$(pwd)'/event && echo \"📅 Event Service (Port 3002)\" && npm start"
    end tell'
    
    sleep 1
    
    osascript -e 'tell application "Terminal"
        do script "cd '$(pwd)'/ticket && echo \"🎫 Ticket Service (Port 3003)\" && npm start"
    end tell'
    
    sleep 1
    
    osascript -e 'tell application "Terminal"
        do script "cd '$(pwd)'/payment && echo \"💳 Payment Service (Port 3004)\" && npm start"
    end tell'
    
    sleep 2
    
    osascript -e 'tell application "Terminal"
        do script "cd '$(pwd)' && echo \"🎨 Frontend (Port 5173)\" && npm run dev"
    end tell'
    
    echo ""
    echo "✅ All services started in separate Terminal tabs!"
    echo "🌐 Frontend will be available at: http://localhost:5173"
    echo ""
    echo "Services:"
    echo "  - Auth Service:    http://localhost:3001"
    echo "  - Event Service:   http://localhost:3002"
    echo "  - Ticket Service:  http://localhost:3003"
    echo "  - Payment Service: http://localhost:3004"
    echo "  - Frontend:        http://localhost:5173"
    
elif command -v gnome-terminal &> /dev/null; then
    # Linux with GNOME Terminal
    echo "Starting services on Linux (GNOME Terminal)..."
    
    gnome-terminal --tab --title="Auth Service" -- bash -c "cd $(pwd)/auth && echo '🔐 Auth Service (Port 3001)' && npm start; exec bash" &
    gnome-terminal --tab --title="Event Service" -- bash -c "cd $(pwd)/event && echo '📅 Event Service (Port 3002)' && npm start; exec bash" &
    gnome-terminal --tab --title="Ticket Service" -- bash -c "cd $(pwd)/ticket && echo '🎫 Ticket Service (Port 3003)' && npm start; exec bash" &
    gnome-terminal --tab --title="Payment Service" -- bash -c "cd $(pwd)/payment && echo '💳 Payment Service (Port 3004)' && npm start; exec bash" &
    sleep 2
    gnome-terminal --tab --title="Frontend" -- bash -c "cd $(pwd) && echo '🎨 Frontend (Port 5173)' && npm run dev; exec bash" &
    
    echo ""
    echo "✅ All services started in separate terminal tabs!"
    
else
    # Fallback - use background processes with nohup
    echo "Starting services in background..."
    echo "⚠️  Note: Logs will be saved to <service>-output.log files"
    echo ""
    
    cd auth && nohup npm start > ../auth-output.log 2>&1 & 
    echo "✅ Auth Service started (PID: $!, logs: auth-output.log)"
    
    cd ../event && nohup npm start > ../event-output.log 2>&1 &
    echo "✅ Event Service started (PID: $!, logs: event-output.log)"
    
    cd ../ticket && nohup npm start > ../ticket-output.log 2>&1 &
    echo "✅ Ticket Service started (PID: $!, logs: ticket-output.log)"
    
    cd ../payment && nohup npm start > ../payment-output.log 2>&1 &
    echo "✅ Payment Service started (PID: $!, logs: payment-output.log)"
    
    cd ..
    sleep 3
    
    nohup npm run dev > frontend-output.log 2>&1 &
    echo "✅ Frontend started (PID: $!, logs: frontend-output.log)"
    
    echo ""
    echo "To stop all services, run: pkill -f \"npm start\" && pkill -f \"npm run dev\""
fi

echo ""
echo "Happy coding! 🎉"
