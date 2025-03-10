@echo off
echo Installing Socket.io client...
call npm install socket.io-client

echo.
echo Running Socket.io tester...
node socket-test.js

pause
