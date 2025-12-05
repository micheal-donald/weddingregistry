#!/bin/bash

# Start the wedding registry application

echo "Starting Wedding Registry backend server..."

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Start the backend server
cd backend
npm start &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 2

# Open the frontend
cd ..
echo "Opening frontend..."
echo "Frontend is available at: file://$(pwd)/index.html"
echo "Backend is running on: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the backend server"

# Wait for Ctrl+C
trap "echo 'Stopping backend server...'; kill $BACKEND_PID; exit" INT
wait $BACKEND_PID
