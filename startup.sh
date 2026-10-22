#!/bin/sh
set -e
cd /workspace
if curl -sf -o /dev/null --max-time 1 http://127.0.0.1:8080/; then
  exit 0
fi
npm run dev > /tmp/helios-dev.log 2>&1 &
nohup npm run worker > /tmp/helios-worker.log 2>&1 &
