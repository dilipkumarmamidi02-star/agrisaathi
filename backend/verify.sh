echo "--- What's actually running ---"
lsof -i :5173
lsof -i :80
echo ""
echo "--- What port 5173 actually serves ---"
curl -s http://localhost:5173/ | grep -E "title|manifest"
