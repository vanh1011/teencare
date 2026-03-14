#!/usr/bin/env bash
# Demo gọi các API chính (chạy sau khi backend đã bật và đã seed: docker compose exec backend npm run seed)
# Usage: ./scripts/demo-api.sh   hoặc   BASE_URL=http://localhost:3001 ./scripts/demo-api.sh
set -e
BASE_URL="${BASE_URL:-http://localhost:3001}"
API="$BASE_URL/api"

echo "=== 1. Health ==="
curl -s "$API/health" | head -c 200
echo -e "\n"

echo "=== 2. GET /api/parents ==="
curl -s "$API/parents?limit=5" | head -c 400
echo -e "\n"

echo "=== 3. GET /api/students ==="
curl -s "$API/students?limit=5" | head -c 400
echo -e "\n"

echo "=== 4. GET /api/classes ==="
curl -s "$API/classes?limit=5" | head -c 400
echo -e "\n"

echo "=== 5. GET /api/packages ==="
curl -s "$API/packages" | head -c 500
echo -e "\n"

echo "=== 6. GET /api/subscriptions (limit 3) ==="
curl -s "$API/subscriptions?limit=3" | head -c 500
echo -e "\n"

echo "=== 7. GET /api/dashboard (stats) ==="
curl -s "$API/dashboard" | head -c 600
echo -e "\n"

echo "=== 8. POST /api/parents (tạo mới) ==="
curl -s -X POST "$API/parents" \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Parent","phone":"0987654321","email":"demo@example.com"}' | head -c 300
echo -e "\n"

echo "Done. Đổi BASE_URL nếu backend chạy ở port khác."
