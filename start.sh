#!/bin/sh
set -x
echo "[START] Script started"
echo "[START] Current directory: $(pwd)"
echo "[START] Listing apps/api/dist:"
ls -la apps/api/dist/ 2>&1 | head -5
echo "[START] Starting API on port 4000"
PORT=4000 node apps/api/dist/index.js 2>&1 &
API_PID=$!
echo "[START] API PID: $API_PID"
sleep 10
echo "[START] Starting Web on port 3000"
cd apps/web && exec npx next start -p 3000
