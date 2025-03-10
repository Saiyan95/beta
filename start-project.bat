@echo off
echo Starting Beta Tech Support Project...

echo Starting Backend Server...
start cmd /k "cd backend && npm start"

echo Starting Frontend Server...
timeout /t 5
start cmd /k "cd frontend && npm start"

echo Project started successfully!
