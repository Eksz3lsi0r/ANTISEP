#!/bin/bash
echo "Starting Backend..."
cd server && npm start &
SERVER_PID=$!

echo "Starting Frontend..."
cd client && npm run dev &
CLIENT_PID=$!

trap "kill $SERVER_PID $CLIENT_PID" EXIT

wait
