cd "$HOME/Downloads/agrisaathi"

echo "Starting backend..."
cd backend
source venv/bin/activate
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

sleep 3

echo "Starting frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "AgriSaathi is running!"
echo "Admin Login: http://localhost:5173/admin-login"
echo "Email: claude020528@gmail.com"
echo "Password: Mdk@2006"
echo ""
echo "Press Ctrl+C to stop"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" INT TERM
wait
