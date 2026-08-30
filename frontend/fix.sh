# Free port 8001 — something (likely a previous uvicorn run) is still bound to it
lsof -ti:8001 | xargs kill -9 2>/dev/null
echo "Port 8001 freed."
