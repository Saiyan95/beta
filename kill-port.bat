@echo off
echo Killing process on port 5002...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5002" ^| find "LISTENING"') do taskkill /F /PID %%a
echo Done. 