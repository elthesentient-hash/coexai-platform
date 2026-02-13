#!/bin/bash

# COUNCIL RUNNER - Keep agents working 24/7
# This script ensures the Agentic Council stays running

cd /root/.openclaw/workspace

echo "🏛️ Starting EL Agentic Council (Persistent Mode)..."
echo "═══════════════════════════════════════════════════════════"

# Function to check if council is running
check_council() {
  if pgrep -f "agentic-council-v2.js" > /dev/null; then
    return 0
  else
    return 1
  fi
}

# Function to start council
start_council() {
  echo "$(date): Starting Council..." >> /var/log/council.log
  
  # Run council in background with nohup
  nohup node council/agentic-council-v2.js > /var/log/council-output.log 2>&1 &
  
  sleep 2
  
  if check_council; then
    echo "✅ Council started successfully"
    echo "PID: $(pgrep -f "agentic-council-v2.js")"
  else
    echo "❌ Failed to start council"
  fi
}

# Check if already running
if check_council; then
  echo "✅ Council is already running"
  echo "PID: $(pgrep -f "agentic-council-v2.js")"
  echo ""
  echo "To see live activity:"
  echo "  tail -f /var/log/council-output.log"
else
  echo "🚀 Starting Council..."
  start_council
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "MONITORING COMMANDS:"
echo "  tail -f /var/log/council-output.log    # Live output"
echo "  tail -f /var/log/council.log           # Activity log"
echo "  ps aux | grep council                  # Check process"
echo "  kill $(pgrep -f council)               # Stop council"
echo "═══════════════════════════════════════════════════════════"
